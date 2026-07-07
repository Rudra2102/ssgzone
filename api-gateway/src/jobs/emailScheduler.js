const schedule = require('node-schedule');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const transporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST,
  port: parseInt(process.env.SES_SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SES_SMTP_USER, pass: process.env.SES_SMTP_PASS }
});

async function sendEmailViaSES(email) {
  try {
    const result = await transporter.sendMail({
      from: email.from_email || process.env.SES_FROM_EMAIL,
      to: email.to_email,
      subject: email.subject,
      html: email.html_content,
      text: email.text_content
    });
    await pool.query(
      `UPDATE email_queue SET status = 'sent', sent_at = NOW(), whatsapp_message_id = $1 WHERE id = $2`,
      [result.messageId, email.id]
    );
    console.log(`Email sent: ${email.id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email ${email.id}:`, error);
    await pool.query(
      `UPDATE email_queue SET status = 'failed', bounce_reason = $1 WHERE id = $2`,
      [error.message, email.id]
    );
    return false;
  }
}

function startEmailScheduler() {
  console.log('Email scheduler started');
  schedule.scheduleJob('* * * * *', async () => {
    try {
      const result = await pool.query(`
        SELECT id, from_email, to_email, subject, html_content, text_content
        FROM email_queue
        WHERE status = 'pending' AND scheduled_at <= NOW()
        LIMIT 100
      `);
      if (result.rows.length > 0) {
        console.log(`Processing ${result.rows.length} scheduled emails`);
        for (const email of result.rows) await sendEmailViaSES(email);
      }
    } catch (error) {
      console.error('Email scheduler error:', error);
    }
  });
}

function stopEmailScheduler() {
  schedule.gracefulShutdown();
  console.log('Email scheduler stopped');
}

module.exports = { startEmailScheduler, stopEmailScheduler };
