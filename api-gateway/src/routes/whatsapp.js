const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-admin-secret';
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'ssgzone_wa_verify';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};

router.get('/status', auth, (req, res) => {
  res.json({ success: true, configured: !!(WA_PHONE_ID && WA_TOKEN) });
});

router.get('/messages', auth, async (req, res) => {
  const { phone = '' } = req.query;
  try {
    let query = `SELECT * FROM whatsapp_messages WHERE user_id=$1 AND tenant_id=$2`;
    const params = [String(req.user.id), req.user.tenant_id];
    if (phone) { params.push(phone); query += ` AND (from_number=$${params.length} OR to_number=$${params.length})`; }
    query += ' ORDER BY created_at ASC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/send', auth, async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ success: false, error: 'to and message required' });
  if (!WA_PHONE_ID || !WA_TOKEN) return res.status(503).json({ success: false, error: 'WhatsApp not configured' });

  try {
    const waRes = await axios.post(
      `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`,
      { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } },
      { headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    const waMessageId = waRes.data?.messages?.[0]?.id || null;
    const result = await pool.query(
      `INSERT INTO whatsapp_messages (user_id, tenant_id, direction, from_number, to_number, message_text, wa_message_id, status)
       VALUES ($1,$2,'outbound',$3,$4,$5,$6,'sent') RETURNING *`,
      [String(req.user.id), req.user.tenant_id, WA_PHONE_ID, to, message, waMessageId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ success: false, error: errMsg });
  }
});

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages) return;
    for (const msg of value.messages) {
      if (msg.type !== 'text') continue;
      await pool.query(
        `INSERT INTO whatsapp_messages (user_id, tenant_id, direction, from_number, to_number, message_text, wa_message_id, status)
         VALUES ('inbound','0','inbound',$1,$2,$3,$4,'received')
         ON CONFLICT DO NOTHING`,
        [msg.from, WA_PHONE_ID, msg.text?.body || '', msg.id]
      );
    }
  } catch (err) {
    console.error('WhatsApp webhook error:', err.message);
  }
});

router.get('/contacts', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM whatsapp_contacts WHERE user_id=$1 ORDER BY name ASC',
      [String(req.user.id)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/contacts', auth, async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone required' });
  try {
    const result = await pool.query(
      `INSERT INTO whatsapp_contacts (user_id, tenant_id, name, phone)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, phone) DO UPDATE SET name=$3
       RETURNING *`,
      [String(req.user.id), req.user.tenant_id, name, phone]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/contacts/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM whatsapp_contacts WHERE id=$1 AND user_id=$2', [req.params.id, String(req.user.id)]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
