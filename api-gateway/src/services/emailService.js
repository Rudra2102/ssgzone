const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

async function searchEmails(tenantId, query, filters = {}) {
  try {
    let sql = `SELECT id, from_email, subject, html_content, text_content, created_at, read_status FROM emails WHERE tenant_id = $1`;
    const params = [tenantId];

    if (query) { params.push(`%${query}%`); sql += ` AND (subject ILIKE $${params.length} OR html_content ILIKE $${params.length})`; }
    if (filters.from) { params.push(filters.from); sql += ` AND from_email = $${params.length}`; }
    if (filters.date_from) { params.push(filters.date_from); sql += ` AND created_at >= $${params.length}`; }
    if (filters.date_to) { params.push(filters.date_to); sql += ` AND created_at <= $${params.length}`; }
    if (filters.read_status !== undefined) { params.push(filters.read_status); sql += ` AND read_status = $${params.length}`; }
    if (filters.folder) { params.push(filters.folder); sql += ` AND folder = $${params.length}`; }

    sql += ` ORDER BY created_at DESC LIMIT 50`;
    const result = await pool.query(sql, params);
    return { success: true, emails: result.rows, count: result.rows.length };
  } catch (error) {
    console.error('Search emails error:', error);
    return { success: false, error: error.message };
  }
}

async function moveEmailToFolder(emailId, folder) {
  try {
    const validFolders = ['inbox', 'drafts', 'sent', 'trash', 'spam', 'archive'];
    if (!validFolders.includes(folder)) return { success: false, error: 'Invalid folder' };

    const result = await pool.query(
      `UPDATE emails SET folder = $1, updated_at = NOW() WHERE id = $2 RETURNING id, folder`,
      [folder, emailId]
    );
    if (result.rows.length === 0) return { success: false, error: 'Email not found' };
    return { success: true, email: result.rows[0] };
  } catch (error) {
    console.error('Move email error:', error);
    return { success: false, error: error.message };
  }
}

async function addLabelToEmail(emailId, label) {
  try {
    const result = await pool.query(`SELECT labels FROM emails WHERE id = $1`, [emailId]);
    if (result.rows.length === 0) return { success: false, error: 'Email not found' };

    const labels = result.rows[0].labels || [];
    if (!labels.includes(label)) labels.push(label);

    await pool.query(`UPDATE emails SET labels = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(labels), emailId]);
    return { success: true, labels };
  } catch (error) {
    console.error('Add label error:', error);
    return { success: false, error: error.message };
  }
}

async function markEmailReadStatus(emailId, readStatus) {
  try {
    const result = await pool.query(
      `UPDATE emails SET read_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, read_status`,
      [readStatus, emailId]
    );
    if (result.rows.length === 0) return { success: false, error: 'Email not found' };
    return { success: true, email: result.rows[0] };
  } catch (error) {
    console.error('Mark read error:', error);
    return { success: false, error: error.message };
  }
}

async function scheduleEmail(tenantId, to, subject, html, text, scheduledAt) {
  try {
    const result = await pool.query(
      `INSERT INTO email_queue (tenant_id, from_email, to_email, subject, html_content, text_content, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id, status, scheduled_at`,
      [tenantId, process.env.SES_FROM_EMAIL, to, subject, html, text, scheduledAt]
    );
    return { success: true, email: result.rows[0] };
  } catch (error) {
    console.error('Schedule email error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { searchEmails, moveEmailToFolder, addLabelToEmail, markEmailReadStatus, scheduleEmail };
