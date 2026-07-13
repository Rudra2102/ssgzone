const express = require('express');
const router = express.Router();
const db = require('../services/DatabaseService');
const { authenticateToken } = require('../middleware/auth');
const AuditService = require('../services/auditService');
const crypto = require('crypto');

// GET audit logs (tenant-scoped)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { action, start_date, end_date, limit = 100 } = req.query;
    const logs = await AuditService.getAuditLogs({
      tenant_id: req.user.tenant_id,
      action, start_date, end_date, limit
    });
    res.json({ success: true, logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET verify immutability of a log entry
router.get('/verify/:logId', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, action, created_at, details FROM audit_logs WHERE id = $1 AND tenant_id = $2`,
      [req.params.logId, req.user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Log not found' });

    const log = result.rows[0];
    const hashInput = String(log.id) + log.action + log.created_at + (log.details ? JSON.stringify(log.details) : '');
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

    res.json({ success: true, logId: log.id, hash, verified: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify log' });
  }
});

module.exports = router;
