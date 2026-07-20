const cron = require('node-cron');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

class GDPRDeletionJob {
  constructor() { this.isRunning = false; }

  async processPendingDeletions() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const result = await pool.query(
        `SELECT id, user_id, user_email, tenant_id FROM gdpr_deletion_queue
         WHERE status = 'pending' AND scheduled_for <= NOW()
         ORDER BY scheduled_for ASC LIMIT 10`
      );
      for (const deletion of result.rows) {
        await this.processUserDeletion(deletion);
      }
    } catch (err) {
      console.error('GDPR job error:', err.message);
    } finally {
      this.isRunning = false;
    }
  }

  async processUserDeletion({ id: deletionId, user_id, user_email, tenant_id }) {
    try {
      await pool.query(
        `UPDATE gdpr_deletion_queue SET status='processing', started_at=NOW() WHERE id=$1`,
        [deletionId]
      );

      await this.auditStep(deletionId, 'delete_emails', async () => {
        const r = await pool.query(`DELETE FROM emails WHERE to_email=$1 AND tenant_id=$2`, [user_email, String(tenant_id)]);
        const r2 = await pool.query(`DELETE FROM emails WHERE from_email=$1 AND tenant_id=$2`, [user_email, String(tenant_id)]);
        return { deleted_received: r.rowCount, deleted_sent: r2.rowCount };
      });

      await this.auditStep(deletionId, 'delete_templates', async () => {
        const r = await pool.query(`DELETE FROM email_templates WHERE created_by=$1 AND tenant_id=$2`, [user_id, tenant_id]);
        return { deleted: r.rowCount };
      });

      await this.auditStep(deletionId, 'anonymize_audit', async () => {
        const r = await pool.query(
          `UPDATE audit_logs SET user_id=NULL, ip_address='0.0.0.0' WHERE user_id=$1`, [user_id]
        ).catch(() => ({ rowCount: 0 }));
        return { anonymized: r.rowCount };
      });

      await this.auditStep(deletionId, 'delete_user', async () => {
        await pool.query(`DELETE FROM tenant_users WHERE id=$1`, [user_id]);
        return { deleted: true };
      });

      await pool.query(
        `UPDATE gdpr_deletion_queue SET status='completed', completed_at=NOW() WHERE id=$1`,
        [deletionId]
      );
      console.log(`GDPR deletion completed: ${user_email}`);
    } catch (err) {
      console.error(`GDPR deletion failed for ${user_email}:`, err.message);
      await pool.query(
        `UPDATE gdpr_deletion_queue SET status='failed', error_message=$1 WHERE id=$2`,
        [err.message, deletionId]
      );
    }
  }

  async auditStep(deletionId, step, operation) {
    try {
      const result = await operation();
      await pool.query(
        `INSERT INTO gdpr_deletion_audit (deletion_id, step, status, details) VALUES ($1,$2,'completed',$3)`,
        [deletionId, step, JSON.stringify(result)]
      );
      return result;
    } catch (err) {
      await pool.query(
        `INSERT INTO gdpr_deletion_audit (deletion_id, step, status, details) VALUES ($1,$2,'failed',$3)`,
        [deletionId, step, JSON.stringify({ error: err.message })]
      );
      throw err;
    }
  }

  start() {
    cron.schedule('*/30 * * * *', () => this.processPendingDeletions());
    console.log('GDPR Deletion Job started — runs every 30 minutes');
  }
}

module.exports = new GDPRDeletionJob();
