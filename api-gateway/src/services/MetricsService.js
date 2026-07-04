const db = require('./DatabaseService');

class MetricsService {
  async getTenantMetrics(tenantId, timeframe = '24h') {
    const timeCondition = this.getTimeCondition(timeframe);
    
    const queries = {
      emails: `
        SELECT 
          COUNT(*) as total_emails,
          COUNT(*) FILTER (WHERE created_at >= ${timeCondition}) as recent_emails,
          COUNT(*) FILTER (WHERE is_archived = true) as archived_emails,
          AVG(CASE WHEN attachments IS NOT NULL THEN jsonb_array_length(attachments) ELSE 0 END) as avg_attachments
        FROM emails WHERE tenant_id = $1
      `,
      storage: `
        SELECT 
          SUM(CASE WHEN attachments IS NOT NULL 
              THEN (SELECT SUM((att->>'size')::bigint) FROM jsonb_array_elements(attachments) att)
              ELSE 0 END) as total_storage_bytes
        FROM emails WHERE tenant_id = $1
      `,
      bounces: `
        SELECT 
          COUNT(*) as total_bounces,
          COUNT(*) FILTER (WHERE bounce_type = 'hard') as hard_bounces,
          COUNT(*) FILTER (WHERE bounce_type = 'soft') as soft_bounces
        FROM email_bounces eb
        JOIN emails e ON eb.email_id = e.id
        WHERE e.tenant_id = $1
      `,
      webhooks: `
        SELECT 
          COUNT(*) as total_deliveries,
          COUNT(*) FILTER (WHERE status = 'success') as successful_deliveries,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_deliveries
        FROM webhook_deliveries wd
        JOIN webhooks w ON wd.webhook_id = w.id
        WHERE w.tenant_id = $1 AND wd.delivered_at >= ${timeCondition}
      `
    };

    const results = await Promise.all([
      db.query(queries.emails, [tenantId]),
      db.query(queries.storage, [tenantId]),
      db.query(queries.bounces, [tenantId]),
      db.query(queries.webhooks, [tenantId])
    ]);

    return {
      emails: results[0].rows[0],
      storage: results[1].rows[0],
      bounces: results[2].rows[0],
      webhooks: results[3].rows[0],
      timeframe
    };
  }

  async getSystemMetrics() {
    const queries = {
      tenants: 'SELECT COUNT(*) as total_tenants FROM tenants WHERE is_active = true',
      users: 'SELECT COUNT(*) as total_users FROM users WHERE is_active = true',
      emails_24h: `SELECT COUNT(*) as emails_24h FROM emails WHERE created_at >= NOW() - INTERVAL '24 hours'`,
      storage_total: `
        SELECT SUM(CASE WHEN attachments IS NOT NULL 
            THEN (SELECT SUM((att->>'size')::bigint) FROM jsonb_array_elements(attachments) att)
            ELSE 0 END) as total_storage_bytes
        FROM emails
      `
    };

    const results = await Promise.all(
      Object.values(queries).map(query => db.query(query))
    );

    return {
      tenants: results[0].rows[0],
      users: results[1].rows[0],
      emails_24h: results[2].rows[0],
      storage_total: results[3].rows[0]
    };
  }

  getTimeCondition(timeframe) {
    const conditions = {
      '1h': "NOW() - INTERVAL '1 hour'",
      '24h': "NOW() - INTERVAL '24 hours'",
      '7d': "NOW() - INTERVAL '7 days'",
      '30d': "NOW() - INTERVAL '30 days'"
    };
    return conditions[timeframe] || conditions['24h'];
  }

  async recordWebhookMetrics(webhookId, status, responseTime) {
    // This could be extended to store detailed metrics
    console.log(`Webhook ${webhookId}: ${status} (${responseTime}ms)`);
  }
}

module.exports = new MetricsService();