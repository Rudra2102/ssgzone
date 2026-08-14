const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../services/DatabaseService');

// ============================================
// HELPERS
// ============================================

function generateTemporaryPassword() {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  return Array.from(crypto.randomBytes(12))
    .map(b => charset[b % charset.length])
    .join('');
}

async function createSsoToken(userId, tenantId, saasAppId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await db.query(
    `INSERT INTO sso_tokens (token, user_id, tenant_id, saas_app_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [token, userId, tenantId, saasAppId, expiresAt]
  );
  return token;
}

async function validateSaasCredentials(saas_app_id, saas_app_secret) {
  const result = await db.query(
    'SELECT * FROM saas_applications WHERE id = $1 AND api_secret = $2 AND status = $3',
    [saas_app_id, saas_app_secret, 'active']
  );
  return result.rows[0] || null;
}

async function logIntegrationAction(action, details) {
  try {
    await db.query(
      `INSERT INTO integration_logs (action, details, created_at) VALUES ($1, $2, NOW())`,
      [action, JSON.stringify(details)]
    );
  } catch {}
}

// ============================================
// 1. CREATE TENANT (SaaS Company)
// ============================================
router.post('/create-tenant', async (req, res) => {
  try {
    const { saas_app_id, saas_app_secret, tenant_data } = req.body;

    const saasApp = await validateSaasCredentials(saas_app_id, saas_app_secret);
    if (!saasApp) {
      return res.status(401).json({ success: false, error: 'Invalid SaaS credentials' });
    }

    const { company_name, company_slug, admin_email, admin_name } = tenant_data || {};
    if (!company_name || !company_slug || !admin_email || !admin_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: company_name, company_slug, admin_email, admin_name'
      });
    }

    const existing = await db.query(
      'SELECT id FROM tenant_companies WHERE company_slug = $1',
      [company_slug]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Tenant with this slug already exists' });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const tenantResult = await db.query(
      `INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, admin_email, admin_name, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW()) RETURNING *`,
      [saas_app_id, company_name, company_slug, admin_email, admin_name]
    );
    const tenant = tenantResult.rows[0];

    const userResult = await db.query(
      `INSERT INTO tenant_users (tenant_id, username, email, password_hash, first_name, last_name, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin', 'active', NOW())
       RETURNING id, email, username`,
      [
        tenant.id,
        company_slug + '_admin',
        admin_email,
        passwordHash,
        admin_name.split(' ')[0],
        admin_name.split(' ').slice(1).join(' ') || ''
      ]
    );
    const user = userResult.rows[0];

    const ssoToken = await createSsoToken(user.id, tenant.id, saas_app_id);

    await logIntegrationAction('tenant_created', { saas_app_id, tenant_id: tenant.id, admin_email });

    return res.json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant_id: tenant.id,
        company_name: tenant.company_name,
        company_slug: tenant.company_slug,
        admin_email: user.email,
        admin_username: user.username,
        temporary_password: tempPassword,
        sso_token: ssoToken,
        sso_token_expires_in: '15 minutes',
        login_url: `https://ssgzone.in/sso?token=${ssoToken}`
      }
    });

  } catch (error) {
    console.error('Error creating tenant:', error);
    return res.status(500).json({ success: false, error: 'Failed to create tenant', details: error.message });
  }
});

// ============================================
// 2. CREATE USER (Employee)
// ============================================
router.post('/create-user', async (req, res) => {
  try {
    const { saas_app_id, saas_app_secret, tenant_slug, user_data } = req.body;

    const saasApp = await validateSaasCredentials(saas_app_id, saas_app_secret);
    if (!saasApp) {
      return res.status(401).json({ success: false, error: 'Invalid SaaS credentials' });
    }

    const tenantResult = await db.query(
      'SELECT * FROM tenant_companies WHERE company_slug = $1',
      [tenant_slug]
    );
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    const tenant = tenantResult.rows[0];

    const { email, first_name, last_name } = user_data || {};
    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, first_name, last_name'
      });
    }

    const existingUser = await db.query(
      'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
      [email, tenant.id]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User with this email already exists in this tenant' });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const username = email.split('@')[0] + '_' + crypto.randomBytes(3).toString('hex');

    const userResult = await db.query(
      `INSERT INTO tenant_users (tenant_id, username, email, password_hash, first_name, last_name, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'user', 'active', NOW())
       RETURNING id, email, username`,
      [tenant.id, username, email, passwordHash, first_name, last_name]
    );
    const user = userResult.rows[0];

    const ssoToken = await createSsoToken(user.id, tenant.id, saas_app_id);

    await logIntegrationAction('user_created', { saas_app_id, tenant_id: tenant.id, user_email: email });

    return res.json({
      success: true,
      message: 'User created successfully',
      data: {
        user_id: user.id,
        email: user.email,
        username: user.username,
        temporary_password: tempPassword,
        sso_token: ssoToken,
        sso_token_expires_in: '15 minutes',
        login_url: `https://ssgzone.in/sso?token=${ssoToken}`
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, error: 'Failed to create user', details: error.message });
  }
});

// ============================================
// 3. SSO TOKEN LOGIN
// ============================================
router.post('/token-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'token required' });
    }

    const tokenRow = await db.query(
      `SELECT * FROM sso_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    if (!tokenRow.rows.length) {
      return res.status(401).json({ success: false, error: 'Invalid or expired SSO token' });
    }

    const t = tokenRow.rows[0];
    await db.query(`UPDATE sso_tokens SET used_at = NOW() WHERE id = $1`, [t.id]);

    const userResult = await db.query(
      `SELECT tu.*, tc.company_name, tc.company_slug, tc.saas_app_id
       FROM tenant_users tu
       JOIN tenant_companies tc ON tc.id = tu.tenant_id
       WHERE tu.id = $1 AND tu.status = 'active'`,
      [t.user_id]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];
    const sessionToken = jwt.sign(
      { type: 'user', id: user.id, tenant_id: user.tenant_id, saas_id: user.saas_app_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          tenant_id: user.tenant_id,
          company_name: user.company_name,
          company_slug: user.company_slug
        }
      }
    });

  } catch (error) {
    console.error('Error in token login:', error);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

// ============================================
// 4. EMAIL RELAY
// ============================================
router.post('/email/send', async (req, res) => {
  const nodemailer = require('nodemailer');
  try {
    const { api_key, api_secret, to, subject, html, text, from_name, from_email, attachments } = req.body;
    if (!api_key || !api_secret)
      return res.status(401).json({ success: false, error: 'api_key and api_secret required' });
    if (!to || !subject || (!html && !text))
      return res.status(400).json({ success: false, error: 'to, subject, and html or text required' });

    // Validate — check direct_client_api_keys first, then saas_applications
    let clientName = null;
    let allowedDomains = null;
    const keyRow = await db.query(
      `SELECT k.*, dc.company_name, dc.allowed_domains FROM direct_client_api_keys k
       JOIN direct_clients dc ON dc.id = k.direct_client_id
       WHERE k.api_key=$1 AND k.api_secret=$2 AND k.status='active' AND dc.status='active'`,
      [api_key, api_secret]
    ).catch(() => ({ rows: [] }));

    if (keyRow.rows.length > 0) {
      clientName = keyRow.rows[0].company_name;
      allowedDomains = keyRow.rows[0].allowed_domains;
      // Update last_used_at
      db.query('UPDATE direct_client_api_keys SET last_used_at=NOW() WHERE id=$1', [keyRow.rows[0].id]).catch(() => {});
    } else {
      const saasRow = await db.query(
        `SELECT saas_name FROM saas_applications WHERE api_key=$1 AND api_secret=$2 AND status='active'`,
        [api_key, api_secret]
      );
      if (!saasRow.rows.length)
        return res.status(401).json({ success: false, error: 'Invalid API credentials' });
      clientName = saasRow.rows[0].saas_name;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    // Validate from_email domain if allowed_domains is set
    if (allowedDomains && allowedDomains.length > 0 && from_email) {
      const fromDomain = from_email.split('@')[1];
      if (!allowedDomains.includes(fromDomain)) {
        return res.status(403).json({ success: false, error: `from_email domain not allowed. Allowed: ${allowedDomains.join(', ')}` });
      }
    }

    if (attachments?.length) console.log('[ATTACH DEBUG]', JSON.stringify(attachments[0]).substring(0, 200));
    await transporter.sendMail({
      from: `"${from_name || clientName}" <${from_email || process.env.SMTP_USER}>`,
      to, subject,
      html: html || text,
      text: text || (html || '').replace(/<[^>]*>/g, ''),
      attachments: Array.isArray(attachments) ? attachments.map(a => {
        const raw = typeof a.content === 'string' && a.content.includes(',') ? a.content.split(',')[1] : a.content;
        return { filename: a.filename, content: raw, encoding: 'base64', contentType: a.contentType || a.mimetype };
      }) : []
    });

    res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    console.error('Relay email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
