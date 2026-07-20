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

const superAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'super_admin') return res.status(403).json({ success: false, error: 'Super admin only' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};

router.get('/requests', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.*, tc.company_name as tenant_name
       FROM gdpr_deletion_queue q
       LEFT JOIN tenant_companies tc ON tc.id = q.tenant_id
       ORDER BY q.requested_at DESC LIMIT 100`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/requests', superAdminAuth, async (req, res) => {
  const { user_email, tenant_id, delay_hours = 72 } = req.body;
  if (!user_email || !tenant_id) return res.status(400).json({ success: false, error: 'user_email and tenant_id required' });
  try {
    const userResult = await pool.query(
      `SELECT id FROM tenant_users WHERE email=$1 AND tenant_id=$2`, [user_email, tenant_id]
    );
    if (!userResult.rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    const userId = userResult.rows[0].id;

    const existing = await pool.query(
      `SELECT id FROM gdpr_deletion_queue WHERE user_email=$1 AND status IN ('pending','processing')`, [user_email]
    );
    if (existing.rows.length) return res.status(409).json({ success: false, error: 'Deletion request already pending' });

    const result = await pool.query(
      `INSERT INTO gdpr_deletion_queue (user_id, user_email, tenant_id, requested_by, scheduled_for)
       VALUES ($1, $2, $3, $4, NOW() + ($5 || ' hours')::INTERVAL) RETURNING *`,
      [userId, user_email, tenant_id, req.user.id, delay_hours]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/requests/:id', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE gdpr_deletion_queue SET status='cancelled' WHERE id=$1 AND status='pending' RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Request not found or not cancellable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/requests/:id/audit', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM gdpr_deletion_audit WHERE deletion_id=$1 ORDER BY completed_at ASC`, [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/requests/:id/execute', superAdminAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE gdpr_deletion_queue SET scheduled_for=NOW() WHERE id=$1 AND status='pending'`, [req.params.id]
    );
    const gdprJob = require('../jobs/gdprDeletionJob');
    gdprJob.processPendingDeletions();
    res.json({ success: true, message: 'Deletion triggered — processing in background' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/retention', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, tc.company_name FROM email_retention_policies r
       JOIN tenant_companies tc ON tc.id = r.tenant_id ORDER BY tc.company_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/retention/:tenant_id', superAdminAuth, async (req, res) => {
  const { inbox_days, sent_days, trash_days, spam_days, is_active } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO email_retention_policies (tenant_id, inbox_days, sent_days, trash_days, spam_days, is_active)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (tenant_id) DO UPDATE SET
         inbox_days=$2, sent_days=$3, trash_days=$4, spam_days=$5, is_active=$6, updated_at=NOW()
       RETURNING *`,
      [req.params.tenant_id, inbox_days || 365, sent_days || 365, trash_days || 30, spam_days || 7, is_active !== false]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/stats', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status='pending') as pending,
        COUNT(*) FILTER (WHERE status='processing') as processing,
        COUNT(*) FILTER (WHERE status='completed') as completed,
        COUNT(*) FILTER (WHERE status='failed') as failed,
        COUNT(*) FILTER (WHERE status='cancelled') as cancelled,
        COUNT(*) as total
       FROM gdpr_deletion_queue`
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
