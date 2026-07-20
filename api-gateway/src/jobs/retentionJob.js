const cron = require('node-cron');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

class RetentionJob {
  async processRetention() {
    console.log('Running email retention cleanup...');
    try {
      const policies = await pool.query(`SELECT * FROM email_retention_policies WHERE is_active = true`);
      let totalDeleted = 0;

      for (const policy of policies.rows) {
        const tid = String(policy.tenant_id);
        const folders = [
          { folder: 'inbox', days: policy.inbox_days },
          { folder: 'sent', days: policy.sent_days },
          { folder: 'trash', days: policy.trash_days },
          { folder: 'spam', days: policy.spam_days },
        ];
        for (const { folder, days } of folders) {
          if (!days) continue;
          const r = await pool.query(
            `DELETE FROM emails WHERE tenant_id=$1 AND folder=$2 AND created_at < NOW() - ($3 || ' days')::INTERVAL`,
            [tid, folder, days]
          );
          totalDeleted += r.rowCount;
        }
      }

      const archived = await pool.query(
        `DELETE FROM emails WHERE archived=true AND created_at < NOW() - INTERVAL '90 days'`
      );
      totalDeleted += archived.rowCount;

      console.log(`Retention cleanup complete — deleted ${totalDeleted} emails`);
    } catch (err) {
      console.error('Retention job error:', err.message);
    }
  }

  start() {
    cron.schedule('0 2 * * *', () => this.processRetention());
    console.log('Retention Job started — runs daily at 2 AM');
  }
}

module.exports = new RetentionJob();
