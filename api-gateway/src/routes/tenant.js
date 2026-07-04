const express = require('express');
const TenantService = require('../services/tenantService');
const DnsService = require('../services/dnsService');
const RegionService = require('../services/RegionService');
const db = require('../services/DatabaseService');
const { validateTenantProvisioning } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Provision new tenant
router.post('/provision', authenticate, validateTenantProvisioning, auditLogger('tenant_provision', 'tenant'), async (req, res) => {
  try {
    const { saas_slug, company_name, tenant_slug, data_region } = req.body;
    const saas_id = req.saas.id;
    
    // Verify saas_slug matches authenticated SaaS
    if (saas_slug !== req.saas.saas_slug) {
      return res.status(400).json({
        success: false,
        error: 'saas_slug does not match authenticated SaaS application'
      });
    }
    
    // Create domain: tenant_slug.saas_slug.ssghub.com
    const domain = `${tenant_slug}.${saas_slug}.ssghub.com`;
    
    // Check if tenant already exists
    const existingTenant = await TenantService.findBySlugAndSaas(tenant_slug, saas_id);
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        error: 'Tenant slug already exists for this SaaS application'
      });
    }

    // Create tenant with region support
    const tenant = await RegionService.createTenantWithRegion({
      saas_id,
      tenant_name: company_name, // Map company_name to tenant_name
      tenant_slug,
      domain, // Pass domain during creation
      admin_email: req.body.admin_email || `admin@${domain}`
    }, data_region || 'us-east-1');
    
    // Set up DNS records
    await DnsService.setupTenantDns(tenant.id, domain);

    res.status(201).json({
      success: true,
      data: {
        id: tenant.id,
        company_name: tenant.company_name,
        tenant_slug: tenant.tenant_slug,
        domain: tenant.domain,
        status: tenant.status,
        dns_status: 'provisioning'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get tenant details
router.get('/:tenant_slug', authenticate, async (req, res) => {
  try {
    const { tenant_slug } = req.params;
    const saas_id = req.saas.id;
    
    const tenant = await TenantService.findBySlugAndSaas(tenant_slug, saas_id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Get DNS status
    const dnsRecords = await DnsService.getTenantDnsStatus(tenant.id);

    res.json({
      success: true,
      data: {
        ...tenant,
        dns_records: dnsRecords
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all tenants for SaaS
router.get('/', authenticate, async (req, res) => {
  try {
    const saas_id = req.saas.id;
    const tenants = await TenantService.findBySaasId(saas_id);

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update tenant status
router.patch('/:tenant_slug/status', authenticate, async (req, res) => {
  try {
    const { tenant_slug } = req.params;
    const { status } = req.body;
    const saas_id = req.saas.id;
    
    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: active, suspended, or inactive'
      });
    }

    const tenant = await TenantService.updateStatus(tenant_slug, saas_id, status);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Group management endpoints (as specified in requirements)
router.post('/group/create', authenticate, async (req, res) => {
  try {
    const { name, email, description, members, is_public } = req.body;
    const tenantId = req.user?.tenant_id || req.body.tenant_id;

    const query = `
      INSERT INTO email_groups (tenant_id, name, email, description, is_public, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      tenantId, name, email, description, is_public || false, req.user?.id || 1
    ]);

    const group = result.rows[0];

    // Add members
    if (members && members.length > 0) {
      for (const member of members) {
        const memberQuery = `
          INSERT INTO group_members (group_id, user_id, role, added_at)
          VALUES ($1, $2, $3, NOW())
        `;
        await db.query(memberQuery, [group.id, member.user_id, member.role || 'member']);
      }
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

module.exports = router;