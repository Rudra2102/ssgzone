const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret');

const saasAdminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'saas_admin') return res.status(403).json({ success: false, error: 'SaaS admin access required' });
    req.decoded = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// POST /api/saas-admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const result = await pool.query(
      `SELECT sau.*, sa.saas_name, sa.saas_slug, sa.id as saas_id
       FROM saas_admin_users sau
       JOIN saas_applications sa ON sa.id = sau.saas_app_id
       WHERE sau.email = $1 AND sau.is_active = true`,
      [email]
    );

    if (!result.rows.length) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const permsResult = await pool.query(
      'SELECT feature_key, is_enabled FROM saas_feature_permissions WHERE saas_id = $1',
      [user.saas_id]
    );
    const permissions = {};
    permsResult.rows.forEach(r => { permissions[r.feature_key] = r.is_enabled; });

    // Check 2FA
    if (user.totp_enabled) {
      const tempToken = jwt.sign(
        { type: 'saas_admin_2fa_pending', adminId: user.id },
        JWT_SECRET, { expiresIn: '5m' }
      );
      return res.json({ success: true, requires_2fa: true, temp_token: tempToken });
    }

    const token = jwt.sign(
      { type: 'saas_admin', id: user.id, adminId: user.id, saas_id: user.saas_id, saas_slug: user.saas_slug, email: user.email, permissions },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: { id: user.id, email: user.email, name: user.name, saas_id: user.saas_id, saas_name: user.saas_name, saas_slug: user.saas_slug, type: 'saas_admin', permissions }
      }
    });
  } catch (err) {
    console.error('SaaS admin login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /api/saas-admin/create-admin — SuperAdmin creates a SaaS admin user
router.post('/create-admin', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'super_admin') return res.status(403).json({ success: false, error: 'Super admin only' });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  const { saas_app_id, name, email, password } = req.body;
  if (!saas_app_id || !name || !email || !password) {
    return res.status(400).json({ success: false, error: 'saas_app_id, name, email, password required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO saas_admin_users (saas_app_id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $4, name = $2, updated_at = NOW()
       RETURNING id, saas_app_id, name, email, created_at`,
      [saas_app_id, name, email, hash]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/saas-admin/dashboard/stats
router.get('/dashboard/stats', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT tc.id) as total_tenants,
        COUNT(DISTINCT CASE WHEN tc.status = 'active' THEN tc.id END) as active_tenants,
        COUNT(DISTINCT tu.id) as total_users,
        COUNT(DISTINCT CASE WHEN tu.status = 'active' THEN tu.id END) as active_users
       FROM tenant_companies tc
       LEFT JOIN tenant_users tu ON tu.tenant_id = tc.id
       WHERE tc.saas_app_id = $1`,
      [req.decoded.saas_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/saas-admin/tenants
router.get('/tenants', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.id, tc.company_name, tc.company_slug, tc.domain, tc.status, tc.plan_type, tc.max_users, tc.created_at,
              COUNT(tu.id) as user_count
       FROM tenant_companies tc
       LEFT JOIN tenant_users tu ON tu.tenant_id = tc.id AND tu.status = 'active'
       WHERE tc.saas_app_id = $1
       GROUP BY tc.id ORDER BY tc.created_at DESC`,
      [req.decoded.saas_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/saas-admin/api-keys
router.get('/api-keys', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT api_key, api_secret, webhook_secret FROM saas_applications WHERE id = $1',
      [req.decoded.saas_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/saas-admin/sso/generate
router.post('/sso/generate', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ success: false, error: 'API key required' });

  try {
    const saasResult = await pool.query(
      'SELECT id, saas_slug FROM saas_applications WHERE api_key = $1 AND status = $2',
      [apiKey, 'active']
    );
    if (!saasResult.rows.length) return res.status(401).json({ success: false, error: 'Invalid API key' });

    const saas = saasResult.rows[0];
    const { user_email, tenant_slug, redirect_to } = req.body;
    if (!user_email || !tenant_slug) return res.status(400).json({ success: false, error: 'user_email and tenant_slug required' });

    const tenantResult = await pool.query(
      'SELECT id FROM tenant_companies WHERE company_slug = $1 AND saas_app_id = $2',
      [tenant_slug, saas.id]
    );
    if (!tenantResult.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const tenantId = tenantResult.rows[0].id;

    let userResult = await pool.query(
      'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
      [user_email, tenantId]
    );

    if (!userResult.rows.length) {
      const username = user_email.split('@')[0];
      const hash = await bcrypt.hash(require('crypto').randomBytes(16).toString('hex'), 10);
      userResult = await pool.query(
        `INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash, status)
         VALUES ($1, $2, $3, $4, '', 'user', $5, 'active') RETURNING id`,
        [tenantId, username, user_email, username, hash]
      );
    }

    const userId = userResult.rows[0].id;
    const ssoToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO sso_tokens (token, user_id, tenant_id, saas_app_id, expires_at, redirect_to) VALUES ($1, $2, $3, $4, $5, $6)',
      [ssoToken, userId, tenantId, saas.id, expiresAt, redirect_to || null]
    );

    const loginUrl = `${process.env.WEBMAIL_URL || 'https://mail.ssgzone.in'}/?sso_token=${ssoToken}${redirect_to ? '&redirect=' + redirect_to : ''}`;
    res.json({ success: true, data: { sso_token: ssoToken, login_url: loginUrl, expires_at: expiresAt } });
  } catch (err) {
    console.error('SSO generate error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/saas-admin/webhook/config
router.get('/webhook/config', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saas_webhook_configs WHERE saas_id = $1', [req.decoded.saas_id]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/webhook/config
router.post('/webhook/config', saasAdminAuth, async (req, res) => {
  const { url, events, is_active } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'url required' });
  const secret = require('crypto').randomBytes(20).toString('hex');
  try {
    const result = await pool.query(
      `INSERT INTO saas_webhook_configs (saas_id, url, events, secret, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (saas_id) DO UPDATE SET url=$2, events=$3, is_active=$5, updated_at=NOW()
       RETURNING *`,
      [req.decoded.saas_id, url, events || ['email.received','email.sent','user.created'], secret, is_active !== false]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/webhook/test
router.post('/webhook/test', saasAdminAuth, async (req, res) => {
  try {
    const cfg = await pool.query('SELECT * FROM saas_webhook_configs WHERE saas_id = $1', [req.decoded.saas_id]);
    if (!cfg.rows.length) return res.status(404).json({ success: false, error: 'No webhook configured' });
    const { url, secret } = cfg.rows[0];
    const payload = JSON.stringify({ event: 'webhook.test', saas_id: req.decoded.saas_id, timestamp: new Date().toISOString() });
    const sig = require('crypto').createHmac('sha256', secret).update(payload).digest('hex');
    const https = require('https');
    const http = require('http');
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsedUrl.hostname, port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SSGzone-Signature': sig, 'Content-Length': Buffer.byteLength(payload) },
      timeout: 5000
    };
    const startTime = Date.now();
    const pingReq = lib.request(options, (pingRes) => {
      const duration = Date.now() - startTime;
      res.json({ success: true, data: { status_code: pingRes.statusCode, duration_ms: duration, url } });
    });
    pingReq.on('error', (e) => res.json({ success: false, error: e.message }));
    pingReq.on('timeout', () => { pingReq.destroy(); res.json({ success: false, error: 'Timeout after 5s' }); });
    pingReq.write(payload);
    pingReq.end();
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/saas-admin/api-logs
router.get('/api-logs', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT method, endpoint, status_code, duration_ms, ip_address, created_at
       FROM saas_api_logs WHERE saas_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.decoded.saas_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/keys/regenerate
router.post('/keys/regenerate', saasAdminAuth, async (req, res) => {
  const crypto = require('crypto');
  const newKey = 'sk_' + crypto.randomBytes(24).toString('hex');
  const newSecret = crypto.randomBytes(32).toString('hex');
  try {
    const result = await pool.query(
      `UPDATE saas_applications SET api_key=$1, api_secret=$2, updated_at=NOW() WHERE id=$3 RETURNING api_key, api_secret`,
      [newKey, newSecret, req.decoded.saas_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/saas-admin/tenants/:id/status
router.patch('/tenants/:id/status', saasAdminAuth, async (req, res) => {
  const { status } = req.body;
  if (!['active','suspended'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
  try {
    const result = await pool.query(
      `UPDATE tenant_companies SET status=$1 WHERE id=$2 AND saas_app_id=$3 RETURNING *`,
      [status, req.params.id, req.decoded.saas_id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/saas-admin/tenants/:id/users
router.get('/tenants/:id/users', saasAdminAuth, async (req, res) => {
  try {
    const check = await pool.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [req.params.id, req.decoded.saas_id]);
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, status, last_login, created_at
       FROM tenant_users WHERE tenant_id=$1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/saas-admin/tenants/:id/limits
router.patch('/tenants/:id/limits', saasAdminAuth, async (req, res) => {
  const { max_users, plan_type } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tenant_companies SET max_users=$1, plan_type=$2 WHERE id=$3 AND saas_app_id=$4 RETURNING *`,
      [max_users, plan_type, req.params.id, req.decoded.saas_id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/saas-admin/analytics
router.get('/analytics', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.id, tc.company_name, tc.domain, tc.status, tc.plan_type, tc.max_users,
         COUNT(DISTINCT tu.id) as user_count,
         COUNT(DISTINCT e.id) as email_count
       FROM tenant_companies tc
       LEFT JOIN tenant_users tu ON tu.tenant_id::text = tc.id::text AND tu.status='active'
       LEFT JOIN emails e ON e.tenant_id::text = tc.id::text
       WHERE tc.saas_app_id = $1
       GROUP BY tc.id ORDER BY user_count DESC`,
      [req.decoded.saas_id]
    );
    const rows = result.rows;
    const totals = {
      total_tenants: rows.length,
      active_tenants: rows.filter(r => r.status === 'active').length,
      total_users: rows.reduce((s, r) => s + parseInt(r.user_count), 0),
      total_emails: rows.reduce((s, r) => s + parseInt(r.email_count), 0)
    };
    res.json({ success: true, data: { tenants: rows, totals } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/saas-admin/branding
router.get('/branding', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saas_branding WHERE saas_id=$1', [req.decoded.saas_id]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/saas-admin/branding
router.put('/branding', saasAdminAuth, async (req, res) => {
  const { platform_name, tagline, primary_color, secondary_color, custom_domain, support_email } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO saas_branding (saas_id, platform_name, tagline, primary_color, secondary_color, custom_domain, support_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (saas_id) DO UPDATE SET
         platform_name=$2, tagline=$3, primary_color=$4, secondary_color=$5,
         custom_domain=$6, support_email=$7, updated_at=NOW()
       RETURNING *`,
      [req.decoded.saas_id, platform_name, tagline, primary_color, secondary_color, custom_domain, support_email]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/branding/logo
router.post('/branding/logo', saasAdminAuth, async (req, res) => {
  const { logo_base64, type = 'logo' } = req.body;
  if (!logo_base64) return res.status(400).json({ success: false, error: 'logo_base64 required' });
  try {
    const field = type === 'favicon' ? 'favicon_url' : 'logo_url';
    const result = await pool.query(
      `INSERT INTO saas_branding (saas_id, ${field}) VALUES ($1,$2)
       ON CONFLICT (saas_id) DO UPDATE SET ${field}=$2, updated_at=NOW()
       RETURNING ${field}`,
      [req.decoded.saas_id, logo_base64]
    );
    res.json({ success: true, data: { url: result.rows[0][field] } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/2fa/setup
router.post('/2fa/setup', saasAdminAuth, async (req, res) => {
  const speakeasy = require('speakeasy');
  const QRCode = require('qrcode');
  try {
    const secret = speakeasy.generateSecret({ name: `SSGzone SaaS (${req.decoded.email})`, length: 20 });
    await pool.query('UPDATE saas_admin_users SET totp_secret=$1 WHERE id=$2', [secret.base32, req.decoded.id]);
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ success: true, data: { secret: secret.base32, qr_code: qrDataUrl } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/2fa/enable
router.post('/2fa/enable', saasAdminAuth, async (req, res) => {
  const speakeasy = require('speakeasy');
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'token required' });
  try {
    const result = await pool.query('SELECT totp_secret FROM saas_admin_users WHERE id=$1', [req.decoded.id]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) return res.status(400).json({ success: false, error: 'Run /2fa/setup first' });
    const valid = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    if (!valid) return res.status(400).json({ success: false, error: 'Invalid token' });
    await pool.query('UPDATE saas_admin_users SET totp_enabled=true WHERE id=$1', [req.decoded.id]);
    res.json({ success: true, message: '2FA enabled' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/2fa/disable
router.post('/2fa/disable', saasAdminAuth, async (req, res) => {
  try {
    await pool.query('UPDATE saas_admin_users SET totp_enabled=false, totp_secret=NULL WHERE id=$1', [req.decoded.id]);
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/saas-admin/2fa/status
router.get('/2fa/status', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT totp_enabled FROM saas_admin_users WHERE id=$1', [req.decoded.id]);
    res.json({ success: true, data: { enabled: result.rows[0]?.totp_enabled || false } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/2fa/verify (no auth)
router.post('/2fa/verify', async (req, res) => {
  const speakeasy = require('speakeasy');
  const { temp_token, totp_token } = req.body;
  if (!temp_token || !totp_token) return res.status(400).json({ success: false, error: 'temp_token and totp_token required' });
  try {
    let decoded;
    try { decoded = jwt.verify(temp_token, JWT_SECRET); }
    catch { return res.status(401).json({ success: false, error: 'Invalid or expired temp token' }); }
    if (decoded.type !== 'saas_admin_2fa_pending') return res.status(401).json({ success: false, error: 'Invalid token type' });
    const result = await pool.query(
      `SELECT sau.*, sa.saas_name, sa.saas_slug, sa.id as saas_id
       FROM saas_admin_users sau JOIN saas_applications sa ON sa.id = sau.saas_app_id
       WHERE sau.id=$1 AND sau.is_active=true`,
      [decoded.adminId]
    );
    if (!result.rows.length) return res.status(401).json({ success: false, error: 'Admin not found' });
    const user = result.rows[0];
    const valid = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: totp_token, window: 1 });
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid 2FA code' });
    const permsResult = await pool.query('SELECT feature_key, is_enabled FROM saas_feature_permissions WHERE saas_id=$1', [user.saas_id]);
    const permissions = {};
    permsResult.rows.forEach(r => { permissions[r.feature_key] = r.is_enabled; });
    const token = jwt.sign(
      { type: 'saas_admin', id: user.id, adminId: user.id, saas_id: user.saas_id, saas_slug: user.saas_slug, email: user.email, permissions },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ success: true, data: { token, admin: { id: user.id, email: user.email, name: user.name, saas_id: user.saas_id, saas_name: user.saas_name, saas_slug: user.saas_slug, type: 'saas_admin', permissions } } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/saas-admin/tenants — SaaS Admin creates tenant under their saas_id
router.post('/tenants', saasAdminAuth, async (req, res) => {
  const { company_name, slug, admin_name, max_users } = req.body;
  if (!company_name || !slug || !admin_name) return res.status(400).json({ success: false, error: 'company_name, slug, admin_name required' });
  try {
    const saasResult = await pool.query('SELECT saas_slug FROM saas_applications WHERE id=$1', [req.decoded.saas_id]);
    if (!saasResult.rows.length) return res.status(400).json({ success: false, error: 'SaaS app not found' });
    const saasSlug = saasResult.rows[0].saas_slug;
    const domain = `${slug}.${saasSlug}.ssgzone.in`;
    const tenantAdminEmail = `admin@${domain}`;
    const tenantResult = await pool.query(
      `INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, company_name, company_slug, domain, admin_name, admin_email, max_users, created_at`,
      [req.decoded.saas_id, company_name, slug, domain, admin_name, tenantAdminEmail, max_users || 50]
    );
    const tenant = tenantResult.rows[0];
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    await pool.query(
      `INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash)
       VALUES ($1,'admin',$2,$3,$4,'admin',$5)`,
      [tenant.id, tenantAdminEmail, admin_name.split(' ')[0], admin_name.split(' ').slice(1).join(' ') || 'Admin', hashedPassword]
    );
    await pool.query('INSERT INTO tenant_communication_settings (tenant_id) VALUES ($1)', [tenant.id]);
    res.json({ success: true, data: { ...tenant, admin_credentials: { username: 'admin', password: defaultPassword, login_url: `https://${domain}/admin` } } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Tenant slug already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

