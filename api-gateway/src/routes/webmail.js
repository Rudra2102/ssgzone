const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const router = express.Router();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const webmailAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// POST /api/v1/webmail/auth/login
router.post('/auth/login', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });
  try {
    const result = await pool.query(
      `SELECT tu.*, tc.saas_app_id, tc.company_slug
       FROM tenant_users tu
       JOIN tenant_companies tc ON tc.id = tu.tenant_id
       WHERE tu.email = $1 AND tu.status = 'active'`,
      [email]
    );
    if (!result.rows.length) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = jwt.sign(
      { type: 'user', id: user.id, tenant_id: user.tenant_id, saas_id: user.saas_app_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super-admin-secret',
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, full_name: `${user.first_name} ${user.last_name}`, role: user.role, tenant_id: user.tenant_id, type: 'user' }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/webmail/inbox?folder=INBOX&page=1&limit=25&search=
router.get('/inbox', webmailAuth, async (req, res) => {
  const { folder = 'INBOX', page = 1, limit = 25, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const userId = req.user.id;
  try {
    let whereClause = `WHERE es.user_id = $1 AND es.folder = $2 AND es.is_deleted = false`;
    const params = [userId, folder];
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (es.subject ILIKE $${params.length} OR es.from_email ILIKE $${params.length} OR es.body_text ILIKE $${params.length})`;
    }
    const countResult = await pool.query(`SELECT COUNT(*) FROM email_storage es ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(parseInt(limit), offset);
    const result = await pool.query(
      `SELECT es.id, es.subject, es.from_email, es.from_name, es.to_email,
              es.is_read, es.is_starred, es.has_attachments, es.received_at, es.folder,
              LEFT(es.body_text, 120) as preview
       FROM email_storage es
       ${whereClause}
       ORDER BY es.received_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const unread = await pool.query(
      `SELECT COUNT(*) FROM email_storage WHERE user_id = $1 AND folder = 'INBOX' AND is_read = false AND is_deleted = false`,
      [userId]
    );
    res.json({ success: true, data: result.rows, total, unread: parseInt(unread.rows[0].count), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/webmail/email/:id
router.get('/email/:id', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_storage WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Email not found' });
    await pool.query('UPDATE email_storage SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/webmail/send
router.post('/send', webmailAuth, async (req, res) => {
  const { to, subject, body_html, body_text, cc, bcc } = req.body;
  if (!to || !subject) return res.status(400).json({ success: false, error: 'to and subject required' });
  try {
    const userResult = await pool.query(
      'SELECT first_name, last_name, email FROM tenant_users WHERE id = $1',
      [req.user.id]
    );
    const sender = userResult.rows[0];
    const fromEmail = sender?.email || req.user.email;
    const fromName = sender ? `${sender.first_name} ${sender.last_name}` : fromEmail;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to, cc, bcc, subject,
      html: body_html || body_text,
      text: body_text || body_html
    });

    await pool.query(
      `INSERT INTO email_storage (user_id, tenant_id, folder, subject, from_email, from_name, to_email, body_html, body_text, is_read, received_at)
       VALUES ($1, $2, 'Sent', $3, $4, $5, $6, $7, $8, true, NOW())`,
      [req.user.id, req.user.tenant_id, subject, fromEmail, fromName, to, body_html || '', body_text || '']
    );
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Send email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/webmail/email/:id/read
router.patch('/email/:id/read', webmailAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE email_storage SET is_read = $1 WHERE id = $2 AND user_id = $3',
      [req.body.is_read !== false, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/webmail/email/:id/star
router.patch('/email/:id/star', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE email_storage SET is_starred = NOT is_starred WHERE id = $1 AND user_id = $2 RETURNING is_starred',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, is_starred: result.rows[0]?.is_starred });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/webmail/email/:id/move
router.patch('/email/:id/move', webmailAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE email_storage SET folder = $1 WHERE id = $2 AND user_id = $3',
      [req.body.folder, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/webmail/email/:id
router.delete('/email/:id', webmailAuth, async (req, res) => {
  try {
    const email = await pool.query(
      'SELECT folder FROM email_storage WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!email.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    if (email.rows[0].folder === 'Trash') {
      await pool.query('UPDATE email_storage SET is_deleted = true WHERE id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE email_storage SET folder = $1 WHERE id = $2', ['Trash', req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/webmail/folders/counts
router.get('/folders/counts', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT folder, COUNT(*) as total, COUNT(*) FILTER (WHERE is_read = false) as unread
       FROM email_storage
       WHERE user_id = $1 AND is_deleted = false
       GROUP BY folder`,
      [req.user.id]
    );
    const counts = {};
    result.rows.forEach(r => { counts[r.folder] = { total: parseInt(r.total), unread: parseInt(r.unread) }; });
    res.json({ success: true, data: counts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/webmail/profile
router.get('/profile', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tu.id, tu.email, tu.first_name, tu.last_name, tu.role, tc.company_name, tc.domain
       FROM tenant_users tu JOIN tenant_companies tc ON tc.id = tu.tenant_id
       WHERE tu.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
