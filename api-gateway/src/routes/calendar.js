const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../services/DatabaseService');
const router = express.Router();

// Create table on startup
db.query(`CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  tenant_id TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
)`).catch(() => {});

const webmailAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'Token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
    if (decoded.type !== 'user') return res.status(403).json({ success: false, error: 'User token required' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

router.get('/events', webmailAuth, async (req, res) => {
  const { start, end } = req.query;
  try {
    const result = await db.query(
      `SELECT * FROM calendar_events WHERE user_id=$1 AND start_time >= $2 AND start_time <= $3 ORDER BY start_time`,
      [req.user.id, start || new Date(0).toISOString(), end || new Date('2099-01-01').toISOString()]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/events', webmailAuth, async (req, res) => {
  const { title, start_time, end_time, description, all_day, color } = req.body;
  if (!title || !start_time || !end_time) return res.status(400).json({ success: false, error: 'title, start_time, end_time required' });
  try {
    const result = await db.query(
      `INSERT INTO calendar_events (user_id, tenant_id, title, description, start_time, end_time, all_day, color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, req.user.tenant_id || '', title, description || null, start_time, end_time, all_day || false, color || '#6366f1']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/events/:id', webmailAuth, async (req, res) => {
  const { title, start_time, end_time, description, all_day, color } = req.body;
  try {
    const result = await db.query(
      `UPDATE calendar_events SET title=$1, description=$2, start_time=$3, end_time=$4, all_day=$5, color=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [title, description || null, start_time, end_time, all_day || false, color || '#6366f1', req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Event not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/events/:id', webmailAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM calendar_events WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
