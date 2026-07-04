const express = require('express');
const router = express.Router();
const db = require('../services/DatabaseService');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const crypto = require('crypto');

// Verify immutability of archived logs (SOC 2 compliance)
router.get('/verify-immutable/:logId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { logId } = req.params;
    
    // Get log from immutable table
    const query = `
      SELECT id, action, created_at, details, archive_hash 
      FROM audit_logs_immutable 
      WHERE id = $1
    `;
    const result = await db.query(query, [logId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Immutable log not found' });
    }
    
    const log = result.rows[0];
    
    // Recompute hash
    const hashInput = log.id + log.action + log.created_at + (log.details ? JSON.stringify(log.details) : '');
    const computedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
    
    const isValid = computedHash === log.archive_hash;
    
    res.json({
      success: true,
      logId: log.id,
      isImmutable: isValid,
      storedHash: log.archive_hash,
      computedHash,
      archivedAt: log.created_at
    });
  } catch (error) {
    console.error('Error verifying log immutability:', error);
    res.status(500).json({ error: 'Failed to verify log immutability' });
  }
});

// Archive logs manually (for testing)
router.post('/archive', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT archive_audit_logs() as count');
    const archivedCount = result.rows[0].count;
    
    res.json({
      success: true,
      message: `${archivedCount} logs archived successfully`,
      archivedCount
    });
  } catch (error) {
    console.error('Error archiving logs:', error);
    res.status(500).json({ error: 'Failed to archive logs' });
  }
});

module.exports = router;