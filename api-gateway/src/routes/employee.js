const express = require('express');
const pool = require('../services/DatabaseService');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { authenticate, requirePlatformAdmin } = require('../middleware/auth');
const { checkLockout, recordFailedAttempt, clearFailedAttempts } = require('../middleware/loginLockout');


const makeToken = (admin) => jwt.sign(
  { type: 'platform_admin', id: admin.id, email: admin.email, role: admin.role, full_name: admin.full_name },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

// POST /api/v1/employee/auth/login
router.post('/auth/login', checkLockout(req => req.body.email), async (req, res) => {
  try {
    const { email, password, totp_code } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const { rows } = await pool.query(
      'SELECT * FROM platform_admins WHERE email = $1 AND status = $2',
      [email.toLowerCase().trim(), 'active']
    );
    if (!rows.length) {
      await recordFailedAttempt(email.toLowerCase().trim());
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      await recordFailedAttempt(email.toLowerCase().trim());
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (admin.totp_enabled) {
      if (!totp_code) return res.status(200).json({ success: false, requires_2fa: true });
      const ok = speakeasy.totp.verify({ secret: admin.totp_secret, encoding: 'base32', token: totp_code, window: 1 });
      if (!ok) return res.status(401).json({ success: false, error: 'Invalid 2FA code' });
    }

    await clearFailedAttempts(email.toLowerCase().trim());
    await pool.query('UPDATE platform_admins SET last_login = NOW() WHERE id = $1', [admin.id]);

    res.json({
      success: true,
      token: makeToken(admin),
      user: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role, username: admin.username }
    });
  } catch (e) {
    console.error('Employee login error:', e);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// All routes below require platform_admin JWT
router.use(authenticate, requirePlatformAdmin);

// GET /api/v1/employee/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [tenants, users, saasApps, emails] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM tenant_companies'),
      pool.query('SELECT COUNT(*) FROM tenant_users'),
      pool.query('SELECT COUNT(*) FROM saas_applications'),
      pool.query("SELECT COUNT(*) FROM email_logs WHERE created_at >= CURRENT_DATE"),
    ]);
    res.json({ success: true, data: {
      totalTenants:  parseInt(tenants.rows[0].count),
      totalUsers:    parseInt(users.rows[0].count),
      totalSaasApps: parseInt(saasApps.rows[0].count),
      emailsToday:   parseInt(emails.rows[0].count),
    }});
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// GET /api/v1/employee/tenants
router.get('/tenants', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tc.*, sa.name AS saas_app_name,
        (SELECT COUNT(*) FROM tenant_users tu WHERE tu.tenant_id = tc.id) AS user_count
      FROM tenant_companies tc
      LEFT JOIN saas_applications sa ON sa.id = tc.saas_app_id
      ORDER BY tc.created_at DESC LIMIT 200
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
});

// GET /api/v1/employee/users
router.get('/users', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const { rows } = await pool.query(`
      SELECT tu.id, tu.first_name, tu.last_name, tu.email, tu.role, tu.status, tu.last_login,
        tc.company_name AS tenant_name
      FROM tenant_users tu
      LEFT JOIN tenant_companies tc ON tc.id = tu.tenant_id
      ORDER BY tu.created_at DESC LIMIT $1
    `, [limit]);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET /api/v1/employee/saas-apps
router.get('/saas-apps', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT sa.*,
        (SELECT COUNT(*) FROM tenant_companies tc WHERE tc.saas_app_id = sa.id) AS tenant_count
      FROM saas_applications sa ORDER BY sa.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch SaaS apps' });
  }
});

// GET /api/v1/employee/mailboxes
router.get('/mailboxes', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const { rows } = await pool.query(`
      SELECT tu.id, tu.email, tu.first_name, tu.last_name, tu.username, tu.role, tu.status,
        tc.company_name AS tenant_name
      FROM tenant_users tu
      LEFT JOIN tenant_companies tc ON tc.id = tu.tenant_id
      ORDER BY tu.created_at DESC LIMIT $1
    `, [limit]);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch mailboxes' });
  }
});

// GET /api/v1/employee/support-tickets
router.get('/support-tickets', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT st.*, tc.company_name AS tenant_name
      FROM support_tickets st
      LEFT JOIN tenant_companies tc ON tc.id::text = st.tenant_id
      ORDER BY st.created_at DESC LIMIT 200
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
});

// POST /api/v1/employee/support-tickets
router.post('/support-tickets', async (req, res) => {
  try {
    const { subject, description, tenant_id, priority = 'medium' } = req.body;
    if (!subject) return res.status(400).json({ success: false, error: 'Subject required' });
    const { rows } = await pool.query(
      `INSERT INTO support_tickets (subject, description, tenant_id, priority, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'open', $5, NOW(), NOW()) RETURNING *`,
      [subject, description || '', tenant_id || null, priority, req.user.email]
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

// PATCH /api/v1/employee/support-tickets/:id/status
router.patch('/support-tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      'UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
});

// PATCH /api/v1/employee/profile/change-password
router.patch('/profile/change-password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, error: 'Both passwords required' });
    if (new_password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

    const { rows } = await pool.query('SELECT password_hash FROM platform_admins WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Admin not found' });

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Current password incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE platform_admins SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// GET /api/v1/employee/2fa/status
router.get('/2fa/status', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT totp_enabled FROM platform_admins WHERE id = $1', [req.user.id]);
    res.json({ success: true, data: { enabled: rows[0]?.totp_enabled || false } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch 2FA status' });
  }
});

// POST /api/v1/employee/2fa/setup
router.post('/2fa/setup', async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `SSGzone Employee (${req.user.email})`, length: 20 });
    await pool.query('UPDATE platform_admins SET totp_secret = $1 WHERE id = $2', [secret.base32, req.user.id]);
    const qr = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, data: { secret: secret.base32, qr_code: qr } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to setup 2FA' });
  }
});

// POST /api/v1/employee/2fa/enable
router.post('/2fa/enable', async (req, res) => {
  try {
    const { token } = req.body;
    const { rows } = await pool.query('SELECT totp_secret FROM platform_admins WHERE id = $1', [req.user.id]);
    if (!rows[0]?.totp_secret) return res.status(400).json({ success: false, error: 'Run setup first' });
    const ok = speakeasy.totp.verify({ secret: rows[0].totp_secret, encoding: 'base32', token, window: 1 });
    if (!ok) return res.status(400).json({ success: false, error: 'Invalid code' });
    await pool.query('UPDATE platform_admins SET totp_enabled = true WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: '2FA enabled' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to enable 2FA' });
  }
});

// POST /api/v1/employee/2fa/disable
router.post('/2fa/disable', async (req, res) => {
  try {
    await pool.query('UPDATE platform_admins SET totp_enabled = false, totp_secret = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: '2FA disabled' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
  }
});

module.exports = router;
