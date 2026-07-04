const express = require('express');
const router = express.Router();
const RetentionService = require('../services/RetentionService');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Create retention policy
router.post('/policies', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const policy = await RetentionService.createRetentionPolicy(tenantId, req.body);
    res.json({ success: true, policy });
  } catch (error) {
    console.error('Error creating retention policy:', error);
    res.status(500).json({ error: 'Failed to create retention policy' });
  }
});

// Get retention policies
router.get('/policies', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const policies = await RetentionService.getRetentionPolicies(tenantId);
    res.json({ policies });
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    res.status(500).json({ error: 'Failed to fetch retention policies' });
  }
});

// Get retention stats
router.get('/stats', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const stats = await RetentionService.getRetentionStats(tenantId);
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching retention stats:', error);
    res.status(500).json({ error: 'Failed to fetch retention stats' });
  }
});

// Manual retention processing (admin only)
router.post('/process', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    await RetentionService.processRetention();
    res.json({ success: true, message: 'Retention processing started' });
  } catch (error) {
    console.error('Error processing retention:', error);
    res.status(500).json({ error: 'Failed to process retention' });
  }
});

module.exports = router;