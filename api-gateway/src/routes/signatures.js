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

// GET /api/v1/signatures
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_signatures WHERE user_id=$1', [String(req.user.id)]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/signatures (upsert)
router.post('/', auth, async (req, res) => {
  const { name, html_body, is_active } = req.body;
  if (html_body === undefined) return res.status(400).json({ success: false, error: 'html_body required' });
  try {
    const result = await pool.query(
      `INSERT INTO user_signatures (user_id, tenant_id, name, html_body, is_active)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET name=$3, html_body=$4, is_active=$5, updated_at=NOW()
       RETURNING *`,
      [String(req.user.id), req.user.tenant_id, name || 'Default', html_body, is_active !== false]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/v1/signatures/toggle
router.patch('/toggle', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE user_signatures SET is_active = NOT is_active, updated_at=NOW() WHERE user_id=$1 RETURNING *`,
      [String(req.user.id)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'No signature configured' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
