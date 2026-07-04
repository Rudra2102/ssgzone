const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

class RetentionService {
  static async setRetentionPolicy(tenantId, retentionDays) {
    try {
      const query = `
        UPDATE tenants 
        SET retention_days = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [retentionDays, tenantId]);
      return result.rows[0];
    } catch (error) {
      console.error('Set retention policy failed:', error);
      throw error;
    }
  }

  static async getRetentionPolicy(tenantId) {
    try {
      const query = `SELECT retention_days FROM tenants WHERE id = $1`;
      const result = await pool.query(query, [tenantId]);
      return result.rows[0]?.retention_days || 2555;
    } catch (error) {
      console.error('Get retention policy failed:', error);
      throw error;
    }
  }

  static async deleteExpiredMessages(tenantId, retentionDays) {
    try {
      const query = `
        DELETE FROM messages 
        WHERE user_id IN (SELECT id FROM users WHERE tenant_id = $1)
        AND created_at < NOW() - INTERVAL '1 day' * $2
      `;
      const result = await pool.query(query, [tenantId, retentionDays]);
      return { deletedCount: result.rowCount };
    } catch (error) {
      console.error('Delete expired messages failed:', error);
      throw error;
    }
  }

  static async archiveOldMessages(tenantId, archiveDays) {
    try {
      const query = `
        UPDATE messages 
        SET archived = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id IN (SELECT id FROM users WHERE tenant_id = $1)
        AND created_at < NOW() - INTERVAL '1 day' * $2
        AND archived = false
      `;
      const result = await pool.query(query, [tenantId, archiveDays]);
      return { archivedCount: result.rowCount };
    } catch (error) {
      console.error('Archive old messages failed:', error);
      throw error;
    }
  }
}

module.exports = RetentionService;
