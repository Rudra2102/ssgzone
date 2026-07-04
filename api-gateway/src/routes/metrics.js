const express = require('express');
const router = express.Router();
const MetricsService = require('../services/MetricsService');
const { authenticateToken, requireTenantAdmin, requireSuperAdmin } = require('../middleware/auth');

// Get tenant metrics
router.get('/tenant', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { timeframe = '24h' } = req.query;
    
    const metrics = await MetricsService.getTenantMetrics(tenantId, timeframe);
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching tenant metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get system metrics (super admin only)
router.get('/system', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const metrics = await MetricsService.getSystemMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

// Get tenant usage metrics (Task 2.1)
router.get('/usage', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Get usage limits
    const limitsQuery = 'SELECT * FROM tenant_usage_limits WHERE tenant_id = $1';
    const limitsResult = await require('../services/DatabaseService').query(limitsQuery, [tenantId]);
    
    // Get current usage
    const usageQuery = 'SELECT * FROM tenant_usage_tracking WHERE tenant_id = $1 AND month_year = $2';
    const usageResult = await require('../services/DatabaseService').query(usageQuery, [tenantId, currentMonth]);
    
    const limits = limitsResult.rows[0] || {
      emails_per_month: 50000,
      api_calls_per_minute: 100,
      storage_limit_gb: 100,
      users_limit: 1000
    };
    
    const usage = usageResult.rows[0] || {
      emails_sent: 0,
      api_calls_made: 0,
      storage_used_gb: 0,
      active_users: 0
    };
    
    res.json({
      success: true,
      usage: {
        emails: {
          used: usage.emails_sent,
          limit: limits.emails_per_month,
          remaining: Math.max(0, limits.emails_per_month - usage.emails_sent),
          percentage: Math.round((usage.emails_sent / limits.emails_per_month) * 100)
        },
        storage: {
          used: usage.storage_used_gb,
          limit: limits.storage_limit_gb,
          remaining: Math.max(0, limits.storage_limit_gb - usage.storage_used_gb),
          percentage: Math.round((usage.storage_used_gb / limits.storage_limit_gb) * 100)
        },
        users: {
          active: usage.active_users,
          limit: limits.users_limit,
          remaining: Math.max(0, limits.users_limit - usage.active_users),
          percentage: Math.round((usage.active_users / limits.users_limit) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    res.status(500).json({ error: 'Failed to fetch usage metrics' });
  }
});

module.exports = router;