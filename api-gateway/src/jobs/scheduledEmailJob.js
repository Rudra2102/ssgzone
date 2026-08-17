const db = require('../services/DatabaseService');
const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function processScheduledEmails() {
  try {
    // Fetch all pending emails whose scheduled_at has passed
    const result = await db.query(
      `SELECT * FROM scheduled_emails WHERE status='pending' AND scheduled_at <= NOW() LIMIT 20`
    );
    for (const email of result.rows) {
      try {
        if (email.mode === 'single') {
          await mailer.sendMail({
            from: `"SSGzone" <${process.env.SMTP_USER}>`,
            to: email.to_name ? `"${email.to_name}" <${email.to_email}>` : email.to_email,
            subject: email.subject,
            html: email.body,
            text: email.body.replace(/<[^>]*>/g, '')
          });
        } else {
          // broadcast
          let rows;
          if (email.broadcast_target === 'users') {
            rows = (await db.query(`SELECT DISTINCT email FROM tenant_users WHERE status='active' AND email IS NOT NULL`)).rows;
          } else {
            rows = (await db.query(`SELECT DISTINCT admin_email as email FROM tenant_companies WHERE status='active' AND admin_email IS NOT NULL`)).rows;
          }
          for (const row of rows) {
            try {
              await mailer.sendMail({
                from: `"SSGzone" <${process.env.SMTP_USER}>`,
                to: row.email, subject: email.subject,
                html: email.body, text: email.body.replace(/<[^>]*>/g, '')
              });
            } catch {}
          }
        }
        await db.query(
          `UPDATE scheduled_emails SET status='sent', sent_at=NOW() WHERE id=$1`,
          [email.id]
        );
      } catch (err) {
        await db.query(
          `UPDATE scheduled_emails SET status='failed', error_message=$1 WHERE id=$2`,
          [err.message, email.id]
        );
      }
    }
  } catch (err) {
    if (!err.message.includes('does not exist')) console.error('Scheduled email job error:', err.message);
  }
}

function start() {
  console.log('Scheduled email job started (runs every 60s)');
  processScheduledEmails();
  setInterval(processScheduledEmails, 60 * 1000);
}

module.exports = { start };
