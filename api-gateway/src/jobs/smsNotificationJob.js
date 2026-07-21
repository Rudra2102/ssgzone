const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || '';

async function sendSmsNotification(toPhone, message) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return false;
  try {
    const axios = require('axios');
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      new URLSearchParams({ To: toPhone, From: TWILIO_FROM, Body: message }),
      { auth: { username: TWILIO_SID, password: TWILIO_TOKEN } }
    );
    return true;
  } catch (err) {
    console.error('SMS send error:', err.message);
    return false;
  }
}

async function notifyNewEmailSms(toEmail, fromEmail, subject) {
  try {
    const pref = await pool.query(
      `SELECT p.phone FROM user_notification_prefs p
       JOIN tenant_users tu ON tu.id::text = p.user_id
       WHERE tu.email=$1 AND p.sms_new_email=true AND p.phone IS NOT NULL`,
      [toEmail]
    );
    if (!pref.rows.length) return;
    const msg = `SSGzone Mail: New email from ${fromEmail} — "${(subject || '').slice(0, 50)}"`;
    await sendSmsNotification(pref.rows[0].phone, msg);
  } catch (err) {
    console.error('SMS notification error:', err.message);
  }
}

module.exports = { sendSmsNotification, notifyNewEmailSms };
