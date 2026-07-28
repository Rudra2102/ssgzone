const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { checkAndSendAutoResponse } = require('./autoresponder');
const { applyRulesToEmail } = require('./rules');
const { notifyNewEmailSms } = require('../jobs/smsNotificationJob');
const { requireFeature } = require('../middleware/permissions');

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
    req.user = jwt.verify(token, process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'));
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

    // Check 2FA
    if (user.totp_enabled) {
      const tempToken = jwt.sign(
        { type: 'webmail_2fa_pending', userId: user.id },
        process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'),
        { expiresIn: '5m' }
      );
      return res.json({ success: true, requires_2fa: true, temp_token: tempToken });
    }

    const token = jwt.sign(
      { type: 'user', id: user.id, tenant_id: user.tenant_id, saas_id: user.saas_app_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'),
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
router.get('/inbox', webmailAuth, requireFeature('email'), async (req, res) => {
  const { folder = 'inbox', page = 1, limit = 25, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const userEmail = req.user.email;
  const tenantId = String(req.user.tenant_id);

  try {
    let where, params;
    if (folder === 'starred') {
      where = `WHERE to_email = $1 AND tenant_id = $2 AND starred = true AND archived = false`;
      params = [userEmail, tenantId];
    } else {
      where = `WHERE to_email = $1 AND tenant_id = $2 AND folder = $3 AND archived = false`;
      params = [userEmail, tenantId, folder];
    }

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
router.post('/send', webmailAuth, requireFeature('email'), async (req, res) => {
  const { to, subject, html_content, text_content, cc, bcc, scheduled_at } = req.body;
  if (!to || !subject) return res.status(400).json({ success: false, error: 'to and subject required' });
  try {
    const userResult = await pool.query(
      'SELECT first_name, last_name, email FROM tenant_users WHERE id = $1',
      [req.user.id]
    );
    const sender = userResult.rows[0];
    const fromEmail = sender?.email || req.user.email;
    const fromName = sender ? `${sender.first_name} ${sender.last_name}` : fromEmail;

    // Schedule if future datetime provided
    if (scheduled_at && new Date(scheduled_at) > new Date()) {
      await pool.query(
        `INSERT INTO email_queue (tenant_id, from_email, to_email, subject, body, scheduled_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')`,
        [String(req.user.tenant_id), fromEmail, to, subject, html_content || text_content || '', scheduled_at]
      );
      return res.json({ success: true, message: 'Email scheduled', scheduled_at });
    }

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
    const { attachment_ids } = req.body;
    const sentInsert = await pool.query(
      `INSERT INTO emails (tenant_id, from_email, to_email, subject, html_content, text_content, folder, read_status, tracking_token)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent', true, $7) RETURNING id`,
      [String(req.user.tenant_id), fromEmail, to, subject, html_content || '', text_content || '', require('crypto').randomBytes(32).toString('hex')]
    );
    if (attachment_ids && attachment_ids.length > 0) {
      await pool.query(
        `UPDATE attachments SET email_id = $1 WHERE id = ANY($2::int[]) AND user_id = $3`,
        [sentInsert.rows[0].id, attachment_ids, req.user.id]
      );
    }

    // Save to recipient inbox and apply rules + autoresponder
    const recipientResult = await pool.query(
      `SELECT tu.id, tu.tenant_id FROM tenant_users tu WHERE tu.email=$1 AND tu.status='active' LIMIT 1`,
      [to]
    );
    if (recipientResult.rows.length) {
      const recipient = recipientResult.rows[0];
      const inboxInsert = await pool.query(
        `INSERT INTO emails (tenant_id, from_email, to_email, subject, html_content, text_content, folder, read_status, tracking_token)
         VALUES ($1, $2, $3, $4, $5, $6, 'inbox', false, $7) RETURNING id`,
        [String(recipient.tenant_id), fromEmail, to, subject, html_content || '', text_content || '', require('crypto').randomBytes(32).toString('hex')]
      );
      const inboxEmailId = inboxInsert.rows[0].id;
      await applyRulesToEmail(inboxEmailId, to, recipient.tenant_id, fromEmail, subject, text_content || '', pool);
      await checkAndSendAutoResponse(recipient.id, to, fromEmail, recipient.tenant_id);
      await notifyNewEmailSms(to, fromEmail, subject);
      await pool.query(
        `INSERT INTO user_notifications (user_id, tenant_id, type, title, body)
         VALUES ($1,$2,'new_email',$3,$4)`,
        [String(recipient.id), recipient.tenant_id, `New email from ${fromEmail}`, subject || '(no subject)']
      );
    }

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
router.get('/analytics', webmailAuth, requireFeature('analytics'), async (req, res) => {
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
router.get('/templates', webmailAuth, requireFeature('email'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_templates WHERE tenant_id = $1 AND is_active = true ORDER BY name ASC`,
      [String(req.user.tenant_id)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/templates
router.post('/templates', webmailAuth, requireFeature('email'), async (req, res) => {
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

// GET /api/v1/webmail/track/open/:token
router.get('/track/open/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE emails SET open_count = open_count + 1 WHERE tracking_token=$1 RETURNING id, tenant_id`,
      [req.params.token]
    );
    if (result.rows.length) {
      const { id, tenant_id } = result.rows[0];
      await pool.query(
        `INSERT INTO email_tracking_events (email_id, tenant_id, event_type, ip_address, user_agent) VALUES ($1,$2,'open',$3,$4)`,
        [id, tenant_id, req.ip, req.headers['user-agent'] || '']
      );
    }
  } catch {}
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache', 'Pragma': 'no-cache' });
  res.send(pixel);
});

// GET /api/v1/webmail/track/click/:token
router.get('/track/click/:token', async (req, res) => {
  const { url } = req.query;
  try {
    const result = await pool.query(
      `UPDATE emails SET click_count = click_count + 1 WHERE tracking_token=$1 RETURNING id, tenant_id`,
      [req.params.token]
    );
    if (result.rows.length) {
      const { id, tenant_id } = result.rows[0];
      await pool.query(
        `INSERT INTO email_tracking_events (email_id, tenant_id, event_type, url, ip_address, user_agent) VALUES ($1,$2,'click',$3,$4,$5)`,
        [id, tenant_id, url || '', req.ip, req.headers['user-agent'] || '']
      );
    }
  } catch {}
  res.redirect(url || 'https://ssgzone.in');
});

// GET /api/v1/webmail/email/:id/tracking
router.get('/email/:id/tracking', webmailAuth, async (req, res) => {
  try {
    const email = await pool.query(
      `SELECT open_count, click_count, tracking_token FROM emails WHERE id=$1 AND to_email=$2`,
      [req.params.id, req.user.email]
    );
    if (!email.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    const events = await pool.query(
      `SELECT event_type, url, ip_address, created_at FROM email_tracking_events WHERE email_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...email.rows[0], events: events.rows } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Ensure bcc_email column exists on emails table
pool.query(`ALTER TABLE emails ADD COLUMN IF NOT EXISTS bcc_email TEXT DEFAULT ''`).catch(() => {});

// POST /api/v1/webmail/drafts
router.post('/drafts', webmailAuth, async (req, res) => {
  const { subject, to, cc, bcc, html_content, text_content } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO emails (tenant_id, from_email, to_email, cc_email, bcc_email, subject, html_content, text_content, folder, read_status, tracking_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'drafts',true,$9) RETURNING id`,
      [String(req.user.tenant_id), req.user.email, to || '', cc || '', bcc || '', subject || '', html_content || '', text_content || '', require('crypto').randomBytes(32).toString('hex')]
    );
    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/v1/webmail/drafts/:id
router.put('/drafts/:id', webmailAuth, async (req, res) => {
  const { subject, to, cc, bcc, html_content, text_content } = req.body;
  try {
    await pool.query(
      `UPDATE emails SET subject=$1, to_email=$2, cc_email=$3, bcc_email=$4, html_content=$5, text_content=$6, created_at=NOW()
       WHERE id=$7 AND from_email=$8 AND folder='drafts'`,
      [subject || '', to || '', cc || '', bcc || '', html_content || '', text_content || '', req.params.id, req.user.email]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/webmail/drafts/:id
router.delete('/drafts/:id', webmailAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE emails SET archived=true WHERE id=$1 AND from_email=$2 AND folder='drafts'`,
      [req.params.id, req.user.email]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/2fa/setup
router.post('/2fa/setup', webmailAuth, async (req, res) => {
  const speakeasy = require('speakeasy');
  const QRCode = require('qrcode');
  try {
    const secret = speakeasy.generateSecret({ name: `SSGzone Mail (${req.user.email})`, length: 20 });
    await pool.query('UPDATE tenant_users SET totp_secret=$1 WHERE id=$2', [secret.base32, req.user.id]);
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ success: true, data: { secret: secret.base32, qr_code: qrDataUrl } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/2fa/enable
router.post('/2fa/enable', webmailAuth, async (req, res) => {
  const speakeasy = require('speakeasy');
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'token required' });
  try {
    const result = await pool.query('SELECT totp_secret FROM tenant_users WHERE id=$1', [req.user.id]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) return res.status(400).json({ success: false, error: 'Run /2fa/setup first' });
    const valid = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    if (!valid) return res.status(400).json({ success: false, error: 'Invalid token' });
    await pool.query('UPDATE tenant_users SET totp_enabled=true WHERE id=$1', [req.user.id]);
    res.json({ success: true, message: '2FA enabled' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/2fa/disable
router.post('/2fa/disable', webmailAuth, async (req, res) => {
  try {
    await pool.query('UPDATE tenant_users SET totp_enabled=false, totp_secret=NULL WHERE id=$1', [req.user.id]);
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/webmail/2fa/status
router.get('/2fa/status', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT totp_enabled FROM tenant_users WHERE id=$1', [req.user.id]);
    res.json({ success: true, data: { enabled: result.rows[0]?.totp_enabled || false } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/2fa/verify (no auth)
router.post('/2fa/verify', async (req, res) => {
  const speakeasy = require('speakeasy');
  const bcrypt = require('bcryptjs');
  const { temp_token, totp_token } = req.body;
  if (!temp_token || !totp_token) return res.status(400).json({ success: false, error: 'temp_token and totp_token required' });
  try {
    let decoded;
    try { decoded = jwt.verify(temp_token, process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret')); }
    catch { return res.status(401).json({ success: false, error: 'Invalid or expired temp token' }); }
    if (decoded.type !== 'webmail_2fa_pending') return res.status(401).json({ success: false, error: 'Invalid token type' });
    const result = await pool.query(
      `SELECT tu.*, tc.saas_app_id, tc.company_slug
       FROM tenant_users tu JOIN tenant_companies tc ON tc.id = tu.tenant_id
       WHERE tu.id=$1 AND tu.status='active'`,
      [decoded.userId]
    );
    if (!result.rows.length) return res.status(401).json({ success: false, error: 'User not found' });
    const user = result.rows[0];
    const valid = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: totp_token, window: 1 });
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid 2FA code' });
    const token = jwt.sign(
      { type: 'user', id: user.id, tenant_id: user.tenant_id, saas_id: user.saas_app_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'),
      { expiresIn: '8h' }
    );
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, full_name: `${user.first_name} ${user.last_name}`, role: user.role, tenant_id: user.tenant_id, type: 'user' } } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/webmail/search
router.get('/search', webmailAuth, async (req, res) => {
  const { q, folder, from_email, date_from, date_to, has_attachment } = req.query;
  if (!q) return res.status(400).json({ success: false, error: 'q param required' });
  const userEmail = req.user.email;
  const tenantId = String(req.user.tenant_id);
  try {
    const params = [userEmail, tenantId, `%${q}%`];
    let where = `WHERE to_email=$1 AND tenant_id=$2 AND archived=false AND (subject ILIKE $3 OR text_content ILIKE $3 OR from_email ILIKE $3)`;
    if (folder) { params.push(folder); where += ` AND folder=$${params.length}`; }
    if (from_email) { params.push(`%${from_email}%`); where += ` AND from_email ILIKE $${params.length}`; }
    if (date_from) { params.push(date_from); where += ` AND created_at >= $${params.length}`; }
    if (date_to) { params.push(date_to); where += ` AND created_at <= $${params.length}`; }
    if (has_attachment === 'true') where += ` AND attachments IS NOT NULL AND attachments != '[]'`;
    const result = await pool.query(
      `SELECT id, subject, from_email, to_email, read_status, starred, folder, created_at, attachments, LEFT(text_content, 120) as preview FROM emails ${where} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Labels tables init
pool.query(`CREATE TABLE IF NOT EXISTS email_labels (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, tenant_id TEXT NOT NULL, name VARCHAR(50) NOT NULL, color VARCHAR(20) DEFAULT '#6366f1', created_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => {});
pool.query(`CREATE TABLE IF NOT EXISTS email_label_map (id SERIAL PRIMARY KEY, email_id INTEGER NOT NULL, label_id INTEGER NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(email_id, label_id))`).catch(() => {});

// GET /api/v1/webmail/labels
router.get('/labels', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM email_labels WHERE user_id=$1 ORDER BY name`, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/labels
router.post('/labels', webmailAuth, async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name required' });
  try {
    const result = await pool.query(
      `INSERT INTO email_labels (user_id, tenant_id, name, color) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, String(req.user.tenant_id), name, color || '#6366f1']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/webmail/labels/:id
router.delete('/labels/:id', webmailAuth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM email_labels WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/webmail/email/:id/labels
router.get('/email/:id/labels', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT el.* FROM email_labels el JOIN email_label_map elm ON elm.label_id = el.id WHERE elm.email_id=$1`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/webmail/email/:id/labels
router.post('/email/:id/labels', webmailAuth, async (req, res) => {
  const { label_id } = req.body;
  if (!label_id) return res.status(400).json({ success: false, error: 'label_id required' });
  try {
    await pool.query(`INSERT INTO email_label_map (email_id, label_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.params.id, label_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/webmail/email/:id/labels/:label_id
router.delete('/email/:id/labels/:label_id', webmailAuth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM email_label_map WHERE email_id=$1 AND label_id=$2`, [req.params.id, req.params.label_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/webmail/thread
router.get('/thread', webmailAuth, async (req, res) => {
  const { subject, email: participantEmail } = req.query;
  if (!subject || !participantEmail) return res.status(400).json({ success: false, error: 'subject and email required' });
  const tenantId = String(req.user.tenant_id);
  try {
    const result = await pool.query(
      `SELECT id, subject, from_email, to_email, cc_email, html_content, text_content, created_at, read_status, attachments
       FROM emails
       WHERE (from_email = $1 OR to_email = $1) AND subject ILIKE $2 AND tenant_id = $3 AND archived = false
       ORDER BY created_at ASC LIMIT 50`,
      [participantEmail, `%${subject.replace(/^(Re:|Fwd:)\s*/i, '').trim()}%`, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/webmail/export
router.get('/export', webmailAuth, async (req, res) => {
  const { folder = 'inbox' } = req.query;
  const userEmail = req.user.email;
  const tenantId = String(req.user.tenant_id);
  try {
    let where, params;
    if (folder === 'starred') {
      where = `WHERE to_email=$1 AND tenant_id=$2 AND starred=true AND archived=false`;
      params = [userEmail, tenantId];
    } else {
      where = `WHERE to_email=$1 AND tenant_id=$2 AND folder=$3 AND archived=false`;
      params = [userEmail, tenantId, folder];
    }
    const result = await pool.query(
      `SELECT created_at, from_email, to_email, subject, LEFT(text_content, 200) as preview FROM emails ${where} ORDER BY created_at DESC LIMIT 1000`,
      params
    );
    const dateStr = new Date().toISOString().split('T')[0];
    const header = 'date,from,to,subject,preview\n';
    const rows = result.rows.map(r => [
      new Date(r.created_at).toISOString(),
      `"${(r.from_email||'').replace(/"/g,'""')}"`,
      `"${(r.to_email||'').replace(/"/g,'""')}"`,
      `"${(r.subject||'').replace(/"/g,'""')}"`,
      `"${(r.preview||'').replace(/"/g,'""').replace(/\n/g,' ')}"`
    ].join(','));
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="emails_${folder}_${dateStr}.csv"`
    });
    res.send(header + rows.join('\n'));
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/webmail/scheduled
router.get('/scheduled', webmailAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, to_email, subject, scheduled_at, status FROM email_queue
       WHERE from_email = $1 AND status = 'scheduled' ORDER BY scheduled_at ASC`,
      [req.user.email]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/webmail/scheduled/:id
router.delete('/scheduled/:id', webmailAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE email_queue SET status = 'cancelled' WHERE id = $1 AND from_email = $2`,
      [req.params.id, req.user.email]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
