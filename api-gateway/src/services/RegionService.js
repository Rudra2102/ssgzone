const db = require('./DatabaseService');

class RegionService {
  constructor() {
    this.supportedRegions = {
      'us-east-1': { name: 'US East', location: 'Virginia, USA' },
      'us-west-2': { name: 'US West', location: 'Oregon, USA' },
      'eu-west-1': { name: 'EU West', location: 'Ireland' },
      'eu-central-1': { name: 'EU Central', location: 'Frankfurt, Germany' },
      'ap-southeast-1': { name: 'Asia Pacific', location: 'Singapore' }
    };
  }

  async createTenantWithRegion(tenantData, region = 'us-east-1') {
    if (!this.supportedRegions[region]) {
      throw new Error(`Unsupported region: ${region}`);
    }

    // Generate domain if not provided
    const domain = tenantData.domain || `${tenantData.tenant_slug}.temp.ssghub.com`;

    const query = `
      INSERT INTO tenants (saas_id, tenant_slug, company_name, domain, admin_email, data_region, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      tenantData.saas_id,
      tenantData.tenant_slug,
      tenantData.tenant_name, // This maps to company_name column
      domain,
      tenantData.admin_email,
      region
    ]);

    return result.rows[0];
  }

  async getTenantRegion(tenantId) {
    const query = 'SELECT data_region FROM tenants WHERE id = $1';
    const result = await db.query(query, [tenantId]);
    
    if (result.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    return result.rows[0].data_region;
  }

  getSupportedRegions() {
    return this.supportedRegions;
  }

  validateRegionCompliance(tenantId, operation) {
    // Foundation for GDPR and other regional compliance checks
    console.log(`Region compliance check for tenant ${tenantId}: ${operation}`);
    return true;
  }
}

module.exports = new RegionService();