const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD || '')
});

class AuditService {
  static async logApiCall(req, action, resource, details = {}) {
    try {
      const query = `
        INSERT INTO audit_logs (saas_id, tenant_id, user_id, action, resource, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const values = [
        req.saas?.id || null,
        req.tenant?.id || null,
        req.user?.id || null,
        action,
        resource,
        JSON.stringify(details),
        req.ip || req.connection?.remoteAddress,
        req.get('User-Agent')
      ];

      await pool.query(query, values);
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  static async logEmailTransfer(from, to, subject, status, details = {}) {
    try {
      const query = `
        INSERT INTO audit_logs (action, resource, details)
        VALUES ($1, $2, $3)
      `;

      const auditDetails = {
        from,
        to,
        subject,
        status,
        ...details
      };

      await pool.query(query, [
        'email_transfer',
        'email',
        JSON.stringify(auditDetails)
      ]);
    } catch (error) {
      console.error('Email audit logging failed:', error);
    }
  }

  static async logSecurityEvent(event, severity, details = {}) {
    try {
      const query = `
        INSERT INTO audit_logs (action, resource, details)
        VALUES ($1, $2, $3)
      `;

      const auditDetails = {
        event,
        severity,
        timestamp: new Date().toISOString(),
        ...details
      };

      await pool.query(query, [
        'security_event',
        'security',
        JSON.stringify(auditDetails)
      ]);
    } catch (error) {
      console.error('Security audit logging failed:', error);
    }
  }

  static async getAuditLogs(filters = {}) {
    try {
      let query = `
        SELECT al.*, sa.saas_name, t.tenant_slug, u.email as user_email
        FROM audit_logs al
        LEFT JOIN saas_applications sa ON al.saas_id = sa.id
        LEFT JOIN tenant_companies t ON al.tenant_id = t.id
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 0;

      if (filters.saas_id) {
        query += ` AND al.saas_id = $${++paramCount}`;
        values.push(filters.saas_id);
      }

      if (filters.tenant_id) {
        query += ` AND al.tenant_id = $${++paramCount}`;
        values.push(filters.tenant_id);
      }

      if (filters.action) {
        query += ` AND al.action = $${++paramCount}`;
        values.push(filters.action);
      }

      if (filters.start_date) {
        query += ` AND al.created_at >= $${++paramCount}`;
        values.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ` AND al.created_at <= $${++paramCount}`;
        values.push(filters.end_date);
      }

      query += ` ORDER BY al.created_at DESC`;
      
      if (filters.limit) {
        const limit = parseInt(filters.limit);
        if (limit > 0 && limit <= 1000) {
          query += ` LIMIT $${++paramCount}`;
          values.push(limit);
        }
      } else {
        query += ` LIMIT 100`;
      }

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }
}

module.exports = AuditService;