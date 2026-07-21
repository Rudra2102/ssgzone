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

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
    next();
  } catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};

// GET /api/v1/notifications/prefs — must be before /:id routes
router.get('/prefs', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM user_notification_prefs WHERE user_id=$1`,
      [String(req.user.id)]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/notifications/prefs (upsert)
router.post('/prefs', auth, async (req, res) => {
  const { notify_new_email, notify_chat_mention, email_digest, email_digest_frequency, sms_new_email, phone } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO user_notification_prefs
         (user_id, tenant_id, notify_new_email, notify_chat_mention, email_digest, email_digest_frequency, sms_new_email, phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id) DO UPDATE SET
         notify_new_email=$3, notify_chat_mention=$4, email_digest=$5,
         email_digest_frequency=$6, sms_new_email=$7, phone=$8, updated_at=NOW()
       RETURNING *`,
      [String(req.user.id), req.user.tenant_id,
       notify_new_email !== false, notify_chat_mention !== false,
       email_digest === true, email_digest_frequency || 'daily',
       sms_new_email === true, phone || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/v1/notifications/read-all — must be before /:id
router.patch('/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE user_notifications SET is_read=true WHERE user_id=$1`,
      [String(req.user.id)]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/notifications/create (internal — no auth required)
router.post('/create', async (req, res) => {
  const { user_id, tenant_id, type, title, body, link } = req.body;
  if (!user_id || !type || !title) return res.status(400).json({ success: false, error: 'user_id, type, title required' });
  try {
    const result = await pool.query(
      `INSERT INTO user_notifications (user_id, tenant_id, type, title, body, link)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [String(user_id), tenant_id || 0, type, title, body || null, link || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/notifications?limit=20
router.get('/', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  try {
    const result = await pool.query(
      `SELECT * FROM user_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,
      [String(req.user.id), limit]
    );
    const unread = await pool.query(
      `SELECT COUNT(*) FROM user_notifications WHERE user_id=$1 AND is_read=false`,
      [String(req.user.id)]
    );
    res.json({ success: true, data: result.rows, unread: parseInt(unread.rows[0].count) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE user_notifications SET is_read=true WHERE id=$1 AND user_id=$2`,
      [req.params.id, String(req.user.id)]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM user_notifications WHERE id=$1 AND user_id=$2`,
      [req.params.id, String(req.user.id)]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
