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

// GET /api/v1/webmail/inbox?folder=inbox&page=1&limit=25&search=
router.get('/inbox', webmailAuth, async (req, res) => {
  const { folder = 'inbox', page = 1, limit = 25, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const userEmail = req.user.email;
  const tenantId = String(req.user.tenant_id);

  try {
    let where = `WHERE to_email = $1 AND tenant_id = $2 AND folder = $3 AND archived = false`;
    const params = [userEmail, tenantId, folder];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (subject ILIKE $${params.length} OR from_email ILIKE $${params.length} OR text_content ILIKE $${params.length})`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM emails ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const result = await pool.query(
      `SELECT id, subject, from_email, to_email, read_status, starred,
              folder, created_at, attachments,
              LEFT(text_content, 120) as preview
       FROM emails
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const unread = await pool.query(
      `SELECT COUNT(*) FROM emails WHERE to_email = $1 AND tenant_id = $2 AND folder = 'inbox' AND read_status = false AND archived = false`,
      [userEmail, tenantId]
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
      `SELECT * FROM emails WHERE id = $1 AND to_email = $2 AND archived = false`,
      [req.params.id, req.user.email]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Email not found' });
    await pool.query('UPDATE emails SET read_status = true WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/webmail/send
router.post('/send', webmailAuth, async (req, res) => {
  const { to, subject, html_content, text_content, cc, bcc } = req.body;
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
      html: html_content || text_content,
      text: text_content || html_content
    });

    // Save to sent folder
    await pool.query(
      `INSERT INTO emails (tenant_id, from_email, to_email, subject, html_content, text_content, folder, read_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent', true)`,
      [String(req.user.tenant_id), fromEmail, to, subject, html_content || '', text_content || '']
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
      'UPDATE emails SET read_status = $1 WHERE id = $2 AND to_email = $3',
      [req.body.is_read !== false, req.params.id, req.user.email]
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
      'UPDATE emails SET starred = NOT starred WHERE id = $1 AND to_email = $2 RETURNING starred',
      [req.params.id, req.user.email]
    );
    res.json({ success: true, is_starred: result.rows[0]?.starred });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/webmail/email/:id/move
router.patch('/email/:id/move', webmailAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE emails SET folder = $1 WHERE id = $2 AND to_email = $3',
      [req.body.folder, req.params.id, req.user.email]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/webmail/email/:id  (move to trash, or archive if already trash)
router.delete('/email/:id', webmailAuth, async (req, res) => {
  try {
    const email = await pool.query(
      'SELECT folder FROM emails WHERE id = $1 AND to_email = $2',
      [req.params.id, req.user.email]
    );
    if (!email.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    if (email.rows[0].folder === 'trash') {
      await pool.query('UPDATE emails SET archived = true WHERE id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE emails SET folder = $1 WHERE id = $2', ['trash', req.params.id]);
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
      `SELECT folder, COUNT(*) as total, COUNT(*) FILTER (WHERE read_status = false) as unread
       FROM emails
       WHERE to_email = $1 AND tenant_id = $2 AND archived = false
       GROUP BY folder`,
      [req.user.email, String(req.user.tenant_id)]
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

// GET /api/v1/webmail/analytics
router.get('/analytics', webmailAuth, async (req, res) => {
  const userEmail = req.user.email;

  try {
    const [volumeResult, folderResult, sendersResult, dowResult, statsResult] = await Promise.all([
      pool.query(
        `SELECT DATE(created_at) as day, COUNT(*) as count
         FROM emails WHERE to_email = $1 AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at) ORDER BY day ASC`,
        [userEmail]
      ),
      pool.query(
        `SELECT folder, COUNT(*) as total, COUNT(*) FILTER (WHERE read_status = false) as unread
         FROM emails WHERE to_email = $1 AND archived = false GROUP BY folder`,
        [userEmail]
      ),
      pool.query(
        `SELECT from_email, from_name, COUNT(*) as count
         FROM emails WHERE to_email = $1
         GROUP BY from_email, from_name ORDER BY count DESC LIMIT 5`,
        [userEmail]
      ),
      pool.query(
        `SELECT EXTRACT(DOW FROM created_at) as dow, COUNT(*) as count
         FROM emails WHERE to_email = $1 AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY dow ORDER BY dow`,
        [userEmail]
      ),
      pool.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE read_status = false) as unread,
                COUNT(*) FILTER (WHERE folder = 'sent' AND DATE(created_at) = CURRENT_DATE) as sent_today,
                COUNT(*) FILTER (WHERE starred = true) as starred,
                COUNT(*) FILTER (WHERE folder = 'spam') as spam
         FROM emails WHERE to_email = $1`,
        [userEmail]
      )
    ]);

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = volumeResult.rows.find(r => r.day?.toISOString?.().split('T')[0] === dateStr);
      last7.push({ date: dateStr, count: found ? parseInt(found.count) : 0, label: d.toLocaleDateString('en', { weekday: 'short' }) });
    }

    const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowData = dowLabels.map((label, i) => {
      const found = dowResult.rows.find(r => parseInt(r.dow) === i);
      return { label, count: found ? parseInt(found.count) : 0 };
    });

    res.json({
      success: true,
      data: {
        volume7d: last7,
        folders: folderResult.rows,
        topSenders: sendersResult.rows,
        dowActivity: dowData,
        stats: statsResult.rows[0]
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/webmail/templates
router.get('/templates', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_templates WHERE tenant_id = $1 AND is_active = true ORDER BY name ASC`,
      [String(req.user.tenant_id)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/templates
router.post('/templates', webmailAuth, async (req, res) => {
  const { name, subject, html_body, category = 'general' } = req.body;
  if (!name || !subject || !html_body) return res.status(400).json({ success: false, error: 'name, subject, html_body required' });
  try {
    const result = await pool.query(
      `INSERT INTO email_templates (tenant_id, name, subject, html_body, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [String(req.user.tenant_id), name, subject, html_body, category, req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/v1/webmail/templates/:id
router.put('/templates/:id', webmailAuth, async (req, res) => {
  const { name, subject, html_body, category } = req.body;
  try {
    const result = await pool.query(
      `UPDATE email_templates SET name=$1, subject=$2, html_body=$3, category=$4, updated_at=NOW()
       WHERE id=$5 AND tenant_id=$6 RETURNING *`,
      [name, subject, html_body, category, req.params.id, String(req.user.tenant_id)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/webmail/templates/:id
router.delete('/templates/:id', webmailAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE email_templates SET is_active=false WHERE id=$1 AND tenant_id=$2`,
      [req.params.id, String(req.user.tenant_id)]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
