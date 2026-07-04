const express = require('express');
const router = express.Router();
const DMARCService = require('../services/DMARCService');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Get DMARC dashboard data
router.get('/dashboard', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const data = await DMARCService.getDMARCDashboardData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching DMARC dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch DMARC data' });
  }
});

// Get DMARC failures for tenant domains
router.get('/failures', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { hours = 24 } = req.query;
    
    // Get tenant domain
    const tenantQuery = 'SELECT domain FROM tenants WHERE id = $1';
    const tenantResult = await require('../services/DatabaseService').query(tenantQuery, [tenantId]);
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const domain = tenantResult.rows[0].domain;
    const failures = await DMARCService.getDMARCFailures(domain, hours);
    
    res.json({ success: true, failures });
  } catch (error) {
    console.error('Error fetching DMARC failures:', error);
    res.status(500).json({ error: 'Failed to fetch DMARC failures' });
  }
});

// Set custom DMARC policy for tenant (Task 1.2)
router.post('/policy/set', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { policy, subdomain_policy, percentage, rua_email, ruf_email } = req.body;
    
    // Validate policy values
    const validPolicies = ['none', 'quarantine', 'reject'];
    if (!validPolicies.includes(policy)) {
      return res.status(400).json({ error: 'Invalid policy value' });
    }
    
    const query = `
      INSERT INTO tenant_dmarc_policies (tenant_id, policy, subdomain_policy, percentage, rua_email, ruf_email)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id)
      DO UPDATE SET 
        policy = $2,
        subdomain_policy = $3,
        percentage = $4,
        rua_email = $5,
        ruf_email = $6,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await require('../services/DatabaseService').query(query, [
      tenantId, policy, subdomain_policy, percentage || 100, rua_email, ruf_email
    ]);
    
    res.json({ success: true, policy: result.rows[0] });
  } catch (error) {
    console.error('Error setting DMARC policy:', error);
    res.status(500).json({ error: 'Failed to set DMARC policy' });
  }
});

// Get tenant DMARC policy
router.get('/policy', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    const query = 'SELECT * FROM tenant_dmarc_policies WHERE tenant_id = $1';
    const result = await require('../services/DatabaseService').query(query, [tenantId]);
    
    if (result.rows.length === 0) {
      return res.json({ success: true, policy: null, usingDefault: true });
    }
    
    res.json({ success: true, policy: result.rows[0], usingDefault: false });
  } catch (error) {
    console.error('Error fetching DMARC policy:', error);
    res.status(500).json({ error: 'Failed to fetch DMARC policy' });
  }
});

// Process incoming DMARC report
router.post('/report', async (req, res) => {
  try {
    const reportXML = req.body;
    const reportId = await DMARCService.processDMARCReport(reportXML);
    res.json({ success: true, reportId });
  } catch (error) {
    console.error('Error processing DMARC report:', error);
    res.status(500).json({ error: 'Failed to process DMARC report' });
  }
});

module.exports = router;