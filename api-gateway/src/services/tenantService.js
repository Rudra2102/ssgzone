const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ssghub_mail',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '')
});

class TenantService {
  static async create(tenantData) {
    const { saas_id, company_name, tenant_slug, domain } = tenantData;
    
    const query = `
      INSERT INTO tenants (saas_id, company_name, tenant_slug, domain)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [saas_id, company_name, tenant_slug, domain]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM tenants WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findBySlugAndSaas(tenant_slug, saas_id) {
    const query = 'SELECT * FROM tenants WHERE tenant_slug = $1 AND saas_id = $2';
    const result = await pool.query(query, [tenant_slug, saas_id]);
    return result.rows[0];
  }

  static async findBySaasId(saas_id) {
    const query = `
      SELECT t.*, COUNT(u.id) as user_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id AND u.status = 'active'
      WHERE t.saas_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query, [saas_id]);
    return result.rows;
  }

  static async updateStatus(tenant_slug, saas_id, status) {
    const query = `
      UPDATE tenants 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_slug = $2 AND saas_id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, tenant_slug, saas_id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM tenants WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getUsageStats(tenant_id, days = 30) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as emails_sent,
        SUM(size) as total_size
      FROM messages 
      WHERE user_id IN (
        SELECT id FROM users WHERE tenant_id = $1
      )
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const result = await pool.query(query, [tenant_id]);
    return result.rows;
  }
}

module.exports = TenantService;