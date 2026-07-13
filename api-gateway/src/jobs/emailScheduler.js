const { Pool } = require('pg');
const { enqueueEmail, emailQueue } = require('../services/queueService');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

// On startup, re-enqueue any pending emails from old email_queue table
async function migratePendingEmails() {
  try {
    const result = await pool.query(`
      SELECT id, tenant_id, from_email, to_email, subject, html_content, text_content, scheduled_at
      FROM email_queue
      WHERE status = 'pending' AND scheduled_at <= NOW()
      LIMIT 100
    `);
    if (result.rows.length === 0) return;
    console.log(`Migrating ${result.rows.length} pending emails to Redis queue`);
    for (const email of result.rows) {
      await enqueueEmail({
        tenantId: email.tenant_id,
        from: email.from_email || process.env.SES_FROM_EMAIL,
        to: email.to_email,
        subject: email.subject,
        html: email.html_content,
        text: email.text_content,
        scheduledAt: email.scheduled_at,
        metadata: { migrated_from: 'email_queue', original_id: email.id }
      });
      await pool.query(`UPDATE email_queue SET status = 'processing' WHERE id = $1`, [email.id]);
    }
  } catch (error) {
    // email_queue table may not exist yet - that's fine
    if (!error.message.includes('does not exist')) {
      console.error('Email migration error:', error.message);
    }
  }
}

function startEmailScheduler() {
  console.log('Email scheduler started');
  migratePendingEmails();
}

async function stopEmailScheduler() {
  await emailQueue.close();
  console.log('Email scheduler stopped');
}

module.exports = { startEmailScheduler, stopEmailScheduler };
