const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const crypto = require('crypto');

const router = express.Router();
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
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// POST /api/v1/video/rooms
router.post('/rooms', auth, async (req, res) => {
  const { title } = req.body;
  const tenantId = String(req.user.tenant_id);
  const userId = req.user.id;
  try {
    const slug = crypto.randomBytes(4).toString('hex');
    const roomName = `ssgzone-${tenantId}-${slug}`;
    const result = await pool.query(
      `INSERT INTO video_rooms (tenant_id, created_by, room_name, room_slug, title)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, userId, roomName, slug, title || 'Meeting']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/video/rooms
router.get('/rooms', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vr.*, tu.first_name || ' ' || tu.last_name as host_name
       FROM video_rooms vr
       JOIN tenant_users tu ON tu.id = vr.created_by
       WHERE vr.tenant_id = $1 AND vr.is_active = true
       ORDER BY vr.started_at DESC
       LIMIT 20`,
      [String(req.user.tenant_id)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/video/rooms/:id
router.delete('/rooms/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE video_rooms SET is_active = false, ended_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [req.params.id, String(req.user.tenant_id)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
