const cron = require('node-cron');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

class DigestJob {
  async sendDigests() {
    console.log('Running email digest job...');
    try {
      const prefs = await pool.query(
        `SELECT p.*, tu.email, tu.first_name
         FROM user_notification_prefs p
         JOIN tenant_users tu ON tu.id::text = p.user_id
         WHERE p.email_digest = true`
      );

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      for (const pref of prefs.rows) {
        try {
          const interval = pref.email_digest_frequency === 'weekly' ? '7 days' : '1 day';
          const unread = await pool.query(
            `SELECT COUNT(*) FROM emails WHERE to_email=$1 AND read_status=false AND folder='inbox' AND archived=false`,
            [pref.email]
          );
          const recent = await pool.query(
            `SELECT subject, from_email, created_at FROM emails
             WHERE to_email=$1 AND folder='inbox' AND archived=false
             AND created_at >= NOW() - INTERVAL '${interval}'
             ORDER BY created_at DESC LIMIT 5`,
            [pref.email]
          );
          if (recent.rows.length === 0) continue;

          const emailList = recent.rows.map(e =>
            `<li><strong>${e.subject || '(no subject)'}</strong> from ${e.from_email} — ${new Date(e.created_at).toLocaleString()}</li>`
          ).join('');

          await transporter.sendMail({
            from: `"SSGzone Mail" <${process.env.SMTP_USER}>`,
            to: pref.email,
            subject: `Your ${pref.email_digest_frequency} email digest — ${parseInt(unread.rows[0].count)} unread`,
            html: `<p>Hi ${pref.first_name || 'there'},</p>
                   <p>You have <strong>${unread.rows[0].count} unread emails</strong> in your inbox.</p>
                   <p>Recent emails:</p><ul>${emailList}</ul>
                   <p><a href="https://mail.ssgzone.in">Open SSGzone Mail</a></p>`
          });
          console.log(`Digest sent to ${pref.email}`);
        } catch (err) {
          console.error(`Digest failed for ${pref.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Digest job error:', err.message);
    }
  }

  start() {
    cron.schedule('0 7 * * *', () => this.sendDigests());
    console.log('Digest Job started — runs daily at 7 AM');
  }
}

module.exports = new DigestJob();
