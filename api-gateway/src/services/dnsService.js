const { Pool } = require('pg');
const axios = require('axios');
const DkimService = require('./dkimService');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ssghub_mail',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '')
});

class DnsService {
  static async setupTenantDns(tenant_id, domain) {
    // Extract saas_slug from domain (e.g., nabc.lms.ssghub.com -> lms)
    const parts = domain.split('.');
    const saas_slug = parts[1]; // lms, rupyo, etc.
    const wildcard_domain = `*.${saas_slug}.ssgzone.in`;
    
    const dnsRecords = [
      // Wildcard subdomain setup as per requirement
      {
        type: 'MX',
        name: wildcard_domain,
        value: `10 mail.ssgzone.in`,
        ttl: 3600
      },
      {
        type: 'TXT',
        name: wildcard_domain,
        value: `v=spf1 include:ssgzone.in ~all`,
        ttl: 3600
      },
      // Specific domain records
      {
        type: 'MX',
        name: domain,
        value: `10 mail.ssgzone.in`,
        ttl: 3600
      },
      {
        type: 'TXT',
        name: domain,
        value: `v=spf1 include:ssgzone.in ~all`,
        ttl: 3600
      },
      {
        type: 'TXT',
        name: `_dmarc.${domain}`,
        value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@ssgzone.in`,
        ttl: 3600
      },
      // DKIM record
      {
        type: 'TXT',
        name: `default._domainkey.${domain}`,
        value: await DkimService.setupDkimForDomain(domain).then(dkim => dkim.dnsRecord.value),
        ttl: 3600
      },
      {
        type: 'CNAME',
        name: `mail.${domain}`,
        value: `mail.ssgzone.in`,
        ttl: 3600
      }
    ];

    const createdRecords = [];
    
    for (const record of dnsRecords) {
      try {
        // Create DNS record in external provider (e.g., Cloudflare)
        const externalResult = await this.createExternalDnsRecord(record);
        
        // Store in database
        const query = `
          INSERT INTO dns_records (tenant_id, record_type, name, value, ttl, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const result = await pool.query(query, [
          tenant_id,
          record.type,
          record.name,
          record.value,
          record.ttl,
          externalResult.success ? 'active' : 'failed'
        ]);
        
        createdRecords.push(result.rows[0]);
      } catch (error) {
        console.error(`Failed to create DNS record for ${domain}:`, error);
        
        // Store failed record
        const query = `
          INSERT INTO dns_records (tenant_id, record_type, name, value, ttl, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const result = await pool.query(query, [
          tenant_id,
          record.type,
          record.name,
          record.value,
          record.ttl,
          'failed'
        ]);
        
        createdRecords.push(result.rows[0]);
      }
    }

    return createdRecords;
  }

  static async createExternalDnsRecord(record) {
    // This is a placeholder for external DNS provider integration
    // In production, integrate with Cloudflare, Route53, etc.
    
    if (process.env.DNS_PROVIDER === 'cloudflare') {
      return await this.createCloudflareRecord(record);
    }
    
    // Mock success for development
    return { success: true, id: 'mock-record-id' };
  }

  static async createCloudflareRecord(record) {
    try {
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${process.env.DNS_ZONE_ID}/dns_records`,
        {
          type: record.type,
          name: record.name,
          content: record.value,
          ttl: record.ttl
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DNS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.success,
        id: response.data.result?.id
      };
    } catch (error) {
      console.error('Cloudflare DNS creation failed:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  static async getTenantDnsStatus(tenant_id) {
    const query = `
      SELECT record_type, name, value, status, created_at, updated_at
      FROM dns_records 
      WHERE tenant_id = $1
      ORDER BY record_type, created_at
    `;
    
    const result = await pool.query(query, [tenant_id]);
    return result.rows;
  }

  static async updateRecordStatus(record_id, status) {
    const query = `
      UPDATE dns_records 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, record_id]);
    return result.rows[0];
  }

  static async verifyDnsRecords(tenant_id) {
    const records = await this.getTenantDnsStatus(tenant_id);
    const verificationResults = [];

    for (const record of records) {
      try {
        // Perform DNS lookup to verify record
        const isValid = await this.performDnsLookup(record.name, record.record_type, record.value);
        
        if (isValid && record.status !== 'active') {
          await this.updateRecordStatus(record.id, 'active');
        } else if (!isValid && record.status === 'active') {
          await this.updateRecordStatus(record.id, 'failed');
        }

        verificationResults.push({
          ...record,
          verified: isValid
        });
      } catch (error) {
        verificationResults.push({
          ...record,
          verified: false,
          error: error.message
        });
      }
    }

    return verificationResults;
  }

  static async performDnsLookup(name, type, expectedValue) {
    // This would use a DNS lookup library in production
    // For now, return true as placeholder
    return true;
  }
}

module.exports = DnsService;