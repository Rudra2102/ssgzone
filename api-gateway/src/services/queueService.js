const Bull = require('bull');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

// Bull queue instance
const emailQueue = new Bull('email-delivery', { redis: redisConfig });

// AWS SES transporter
const transporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST,
  port: parseInt(process.env.SES_SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SES_SMTP_USER, pass: process.env.SES_SMTP_PASS }
});

// Process email jobs
emailQueue.process(async (job) => {
  const { dbId, from, to, subject, html, text, attachments = [] } = job.data;

  await pool.query(
    `UPDATE email_delivery_queue SET status = 'processing', processed_at = NOW(), job_id = $1 WHERE id = $2`,
    [String(job.id), dbId]
  );

  const mailOptions = {
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text
  };

  if (attachments.length > 0) {
    mailOptions.attachments = attachments.map(a => ({ filename: a.filename, path: a.path }));
  }

  const result = await transporter.sendMail(mailOptions);

  await pool.query(
    `UPDATE email_delivery_queue SET status = 'sent', sent_at = NOW(), ses_message_id = $1 WHERE id = $2`,
    [result.messageId, dbId]
  );

  return { messageId: result.messageId };
});

// Handle failed jobs
emailQueue.on('failed', async (job, err) => {
  const { dbId } = job.data;
  const isFinal = job.attemptsMade >= job.opts.attempts;

  await pool.query(
    `UPDATE email_delivery_queue 
     SET status = $1, failed_at = NOW(), last_error = $2, retry_count = $3
     WHERE id = $4`,
    [isFinal ? 'failed' : 'queued', err.message, job.attemptsMade, dbId]
  );
});

// Add email to queue
async function enqueueEmail({ tenantId, from, to, subject, html, text, attachments = [], scheduledAt, priority = 0, metadata = {} }) {
  const toJson = JSON.stringify(Array.isArray(to) ? to : [to]);

  const { rows } = await pool.query(
    `INSERT INTO email_delivery_queue 
     (tenant_id, from_email, to_email, subject, html_content, text_content, attachments, scheduled_at, priority, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [tenantId, from, toJson, subject, html, text, JSON.stringify(attachments), scheduledAt || new Date(), priority, JSON.stringify(metadata)]
  );

  const dbId = rows[0].id;
  const delay = scheduledAt ? Math.max(0, new Date(scheduledAt) - Date.now()) : 0;

  const job = await emailQueue.add(
    { dbId, from, to, subject, html, text, attachments },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, delay, priority }
  );

  await pool.query(`UPDATE email_delivery_queue SET job_id = $1 WHERE id = $2`, [String(job.id), dbId]);

  return { jobId: job.id, dbId };
}

// Cancel a queued job
async function cancelEmail(dbId, tenantId) {
  const { rows } = await pool.query(
    `SELECT job_id, status FROM email_delivery_queue WHERE id = $1 AND tenant_id = $2`,
    [dbId, tenantId]
  );
  if (!rows.length) throw new Error('Job not found');
  if (rows[0].status !== 'queued') throw new Error('Only queued emails can be cancelled');

  const job = await emailQueue.getJob(rows[0].job_id);
  if (job) await job.remove();

  await pool.query(`UPDATE email_delivery_queue SET status = 'cancelled' WHERE id = $1`, [dbId]);
  return true;
}

// Get queue stats
async function getQueueStats(tenantId) {
  const [dbStats, queueCounts] = await Promise.all([
    pool.query(
      `SELECT status, COUNT(*) as count FROM email_delivery_queue WHERE tenant_id = $1 GROUP BY status`,
      [tenantId]
    ),
    emailQueue.getJobCounts()
  ]);

  return {
    db: dbStats.rows,
    queue: queueCounts
  };
}

// Get job status
async function getJobStatus(dbId, tenantId) {
  const { rows } = await pool.query(
    `SELECT id, job_id, status, retry_count, last_error, sent_at, failed_at, ses_message_id, created_at
     FROM email_delivery_queue WHERE id = $1 AND tenant_id = $2`,
    [dbId, tenantId]
  );
  if (!rows.length) throw new Error('Job not found');
  return rows[0];
}

module.exports = { emailQueue, enqueueEmail, cancelEmail, getQueueStats, getJobStatus };
