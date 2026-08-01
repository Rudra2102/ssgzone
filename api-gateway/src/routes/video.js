const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { requireFeature } = require('../middleware/permissions');

const pool = require('../services/DatabaseService');
const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'));
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// POST /api/v1/video/rooms
router.post('/rooms', auth, requireFeature('video'), async (req, res) => {
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
router.get('/rooms', auth, requireFeature('video'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vr.*, tu.first_name || ' ' || tu.last_name as host_name
       FROM video_rooms vr
       LEFT JOIN tenant_users tu ON tu.id::text = vr.created_by::text
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
