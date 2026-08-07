const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'ssgzone_mail',
      user: process.env.DB_APP_USER || 'app_user',
      password: String(process.env.DB_APP_PASSWORD || ''),
      max: 20,
      idleTimeoutMillis: 30050,
      connectionTimeoutMillis: 2000,
    });
  }

  // Plain query — no tenant context (platform-level tables only)
  async query(text, params) {
    const client = await this.pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  // Tenant-scoped query — sets app.current_tenant_id for RLS
  async tenantQuery(tenantId, text, params) {
    const client = await this.pool.connect();
    try {
      await client.query(`SET LOCAL app.current_tenant_id = $1`, [String(tenantId)]);
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  // Returns a client with tenant context already set — for multi-statement transactions
  async getTenantClient(tenantId) {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_tenant_id = $1`, [String(tenantId)]);
    return client;
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new DatabaseService();
