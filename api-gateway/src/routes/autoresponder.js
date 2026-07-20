const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-admin-secret';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};

// GET /api/v1/autoresponder
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM auto_responders WHERE user_id=$1', [req.user.id]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/autoresponder
router.post('/', auth, async (req, res) => {
  const { subject, message, start_date, end_date, is_active } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'message required' });
  try {
    const result = await pool.query(
      `INSERT INTO auto_responders (user_id, tenant_id, subject, message, start_date, end_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET
         subject=$3, message=$4, start_date=$5, end_date=$6, is_active=$7, updated_at=NOW()
       RETURNING *`,
      [req.user.id, req.user.tenant_id, subject || 'Out of Office', message, start_date || null, end_date || null, is_active !== false]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/v1/autoresponder/toggle
router.patch('/toggle', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE auto_responders SET is_active = NOT is_active, updated_at=NOW() WHERE user_id=$1 RETURNING *`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'No autoresponder configured' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/autoresponder
router.delete('/', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM auto_responders WHERE user_id=$1', [req.user.id]);
    await pool.query('DELETE FROM auto_responder_sent WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/autoresponder/tenant
router.get('/tenant', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ar.*, tu.first_name, tu.last_name, tu.email as user_email
       FROM auto_responders ar
       JOIN tenant_users tu ON tu.id = ar.user_id
       WHERE ar.tenant_id=$1
       ORDER BY ar.is_active DESC, ar.updated_at DESC`,
      [req.user.tenant_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

async function checkAndSendAutoResponse(toUserId, toEmail, fromEmail, tenantId) {
  try {
    const result = await pool.query(
      `SELECT ar.* FROM auto_responders ar
       WHERE ar.user_id=$1 AND ar.is_active=true
         AND (ar.start_date IS NULL OR ar.start_date <= NOW())
         AND (ar.end_date IS NULL OR ar.end_date >= NOW())
         AND NOT EXISTS (
           SELECT 1 FROM auto_responder_sent ars
           WHERE ars.user_id=$1 AND ars.sender_email=$2
         )`,
      [toUserId, fromEmail]
    );
    if (!result.rows.length) return false;
    const ar = result.rows[0];
    await pool.query(
      `INSERT INTO auto_responder_sent (user_id, sender_email) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [toUserId, fromEmail]
    );
    await pool.query(
      `INSERT INTO emails (tenant_id, from_email, to_email, subject, text_content, folder, read_status)
       VALUES ($1,$2,$3,$4,$5,'sent',true)`,
      [String(tenantId), toEmail, fromEmail, ar.subject, ar.message]
    );
    return true;
  } catch (err) {
    console.error('Autoresponder error:', err.message);
    return false;
  }
}

module.exports = { router, checkAndSendAutoResponse };
