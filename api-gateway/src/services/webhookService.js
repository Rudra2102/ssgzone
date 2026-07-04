const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

class WebhookService {
  static async registerWebhook(tenantId, url, events) {
    try {
      const query = `
        INSERT INTO webhooks (tenant_id, url, events, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await pool.query(query, [tenantId, url, JSON.stringify(events), 'active']);
      return result.rows[0];
    } catch (error) {
      console.error('Webhook registration failed:', error);
      throw error;
    }
  }

  static async triggerWebhook(event, data) {
    try {
      console.log(`Webhook triggered: ${event}`, data);
      // Webhook logic here
      return { success: true };
    } catch (error) {
      console.error('Webhook trigger failed:', error);
      throw error;
    }
  }

  static async getWebhooks(tenantId) {
    try {
      const query = `SELECT * FROM webhooks WHERE tenant_id = $1`;
      const result = await pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Get webhooks failed:', error);
      throw error;
    }
  }
}

module.exports = WebhookService;
