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

// GET /api/v1/contacts/suggest?q= — must be before /:id
router.get('/suggest', auth, async (req, res) => {
  const { q = '' } = req.query;
  if (!q) return res.json({ success: true, data: [] });
  try {
    const result = await pool.query(
      `SELECT name, email FROM user_contacts
       WHERE user_id=$1 AND (name ILIKE $2 OR email ILIKE $2)
       ORDER BY name ASC LIMIT 8`,
      [String(req.user.id), `%${q}%`]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/contacts?search=
router.get('/', auth, async (req, res) => {
  const { search = '' } = req.query;
  try {
    let query = 'SELECT * FROM user_contacts WHERE user_id=$1';
    const params = [String(req.user.id)];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $2 OR email ILIKE $2)`;
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/contacts
router.post('/', auth, async (req, res) => {
  const { name, email, phone, company, notes } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, error: 'name and email required' });
  try {
    const result = await pool.query(
      `INSERT INTO user_contacts (user_id, tenant_id, name, email, phone, company, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id, email) DO UPDATE SET name=$3, phone=$5, company=$6, notes=$7
       RETURNING *`,
      [String(req.user.id), req.user.tenant_id, name, email, phone || null, company || null, notes || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/v1/contacts/:id
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone, company, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE user_contacts SET name=$1, email=$2, phone=$3, company=$4, notes=$5
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [name, email, phone || null, company || null, notes || null, req.params.id, String(req.user.id)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/contacts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_contacts WHERE id=$1 AND user_id=$2', [req.params.id, String(req.user.id)]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
