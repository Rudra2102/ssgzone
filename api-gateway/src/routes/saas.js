const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const router = express.Router();

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'academy'
});

// SaaS API Key Authentication Middleware
const saasAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required. Provide via X-API-Key header or Authorization: Bearer token'
      });
    }
    
    // Find SaaS application by API key
    const result = await db.query(
      'SELECT id, saas_name as name, saas_slug as slug, api_key, status FROM saas_applications WHERE api_key = $1',
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    const saasApp = result.rows[0];
    
    if (saasApp.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'SaaS application is not active'
      });
    }
    
    req.saasApp = saasApp;
    next();
  } catch (error) {
    console.error('SaaS auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Register new SaaS application (Public endpoint - for initial registration)
router.post('/auth/register', async (req, res) => {
  try {
    const { name, slug, description, webhook_url, contact_email } = req.body;
    
    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Name and slug are required'
      });
    }
    
    // Check if slug already exists
    const existingApp = await db.query(
      'SELECT id FROM saas_applications WHERE slug = $1',
      [slug]
    );
    
    if (existingApp.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'SaaS application with this slug already exists'
      });
    }
    
    // Generate API credentials
    const apiKey = `ssg_live_${slug}_${Date.now()}`;
    const apiSecret = `ssg_secret_${slug}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const webhookSecret = webhook_url ? `whk_${slug}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}` : null;
    
    // Default permissions
    const defaultPermissions = {
      email: true,
      chat: true,
      whatsapp: false,
      calendar: false,
      notifications: true,
      file_storage: true
    };
    
    const result = await db.query(`
      INSERT INTO saas_applications (name, slug, description, webhook_url, domain_prefix, api_key, api_secret, webhook_secret, permissions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, slug, description, api_key, api_secret, webhook_secret, permissions, status, created_at
    `, [name, slug, description, webhook_url, slug, apiKey, apiSecret, webhookSecret, JSON.stringify(defaultPermissions), 'pending']);
    
    const saasApp = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'SaaS application registered successfully. Status is pending - awaiting SuperAdmin approval.',
      data: {
        id: saasApp.id,
        name: saasApp.name,
        slug: saasApp.slug,
        api_key: saasApp.api_key,
        api_secret: saasApp.api_secret,
        webhook_secret: saasApp.webhook_secret,
        status: saasApp.status,
        note: 'Store these credentials securely. They will not be shown again.'
      }
    });
  } catch (error) {
    console.error('SaaS registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register SaaS application'
    });
  }
});

// Provision Tenant (Create tenant from external SaaS)
router.post('/tenants/provision', saasAuth, async (req, res) => {
  try {
    const { company_name, slug, admin_name, admin_email, max_users, metadata } = req.body;
    
    // Validate required fields
    if (!company_name || !slug || !admin_name) {
      return res.status(400).json({
        success: false,
        error: 'company_name, slug, and admin_name are required'
      });
    }
    
    // Check if slug already exists
    const existingTenant = await db.query(
      'SELECT id FROM tenant_companies WHERE company_slug = $1',
      [slug]
    );
    
    if (existingTenant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Tenant with slug '${slug}' already exists`
      });
    }
    
    const saasSlug = req.saasApp.slug;
    const domain = `${slug}.${saasSlug}.ssgzone.in`;
    const tenantAdminEmail = admin_email || `admin@${domain}`;

    // Create tenant company
    const tenantResult = await db.query(`
      INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, company_name, company_slug, domain, admin_name, admin_email, max_users, created_at
    `, [req.saasApp.id, company_name, slug, domain, admin_name, tenantAdminEmail, max_users || 500]);
    
    const tenant = tenantResult.rows[0];
    
    // Create default admin user
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await db.query(`
      INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [tenant.id, 'admin', tenantAdminEmail, admin_name.split(' ')[0], admin_name.split(' ').slice(1).join(' ') || 'Admin', 'admin', hashedPassword, 'active']);
    
    // Create default communication settings
    await db.query(`
      INSERT INTO tenant_communication_settings (tenant_id, settings)
      VALUES ($1, $2)
    `, [tenant.id, JSON.stringify({email_enabled: true, chat_enabled: true, whatsapp_enabled: false, notifications_enabled: true})]);
    
    // Send webhook notification if configured
    if (req.saasApp.webhook_url) {
      // TODO: Implement webhook notification
      console.log('Webhook notification:', {
        event: 'tenant.created',
        tenant_id: tenant.id,
        webhook_url: req.saasApp.webhook_url
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Tenant provisioned successfully',
      data: {
        tenant_id: tenant.id,
        company_name: tenant.company_name,
        slug: tenant.company_slug,
        domain: tenant.domain,
        admin_email: tenant.admin_email,
        admin_credentials: {
          username: 'admin',
          password: defaultPassword,
          login_url: `https://${domain}/admin`
        },
        created_at: tenant.created_at
      }
    });
  } catch (error) {
    console.error('Tenant provision error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provision tenant'
    });
  }
});

// Provision User (Create user for a tenant from external SaaS)
router.post('/users/provision', saasAuth, async (req, res) => {
  try {
    const { tenant_id, username, email, first_name, last_name, role, department_id, metadata } = req.body;
    
    // Validate required fields
    if (!tenant_id || !username || !email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id, username, email, first_name, and last_name are required'
      });
    }
    
    // Verify tenant belongs to this SaaS app
    const tenantCheck = await db.query(
      'SELECT id FROM tenant_companies WHERE id = $1 AND saas_app_id = $2',
      [tenant_id, req.saasApp.id]
    );
    
    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found or does not belong to your SaaS application'
      });
    }
    
    // Check if username or email already exists
    const existingUser = await db.query(
      'SELECT id FROM tenant_users WHERE (username = $1 OR email = $2) AND tenant_id = $3',
      [username, email, tenant_id]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `User with username '${username}' or email '${email}' already exists`
      });
    }
    
    // Generate default password
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const userResult = await db.query(`
      INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, first_name, last_name, role, status, created_at
    `, [tenant_id, username, email, first_name, last_name, role || 'user', hashedPassword, 'active']);
    
    const user = userResult.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'User provisioned successfully',
      data: {
        user_id: user.id,
        username: user.username,
        email: user.email,
        default_password: defaultPassword,
        role: user.role,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('User provision error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provision user'
    });
  }
});

// Sync Companies (Get all tenants for this SaaS app)
router.get('/sync/companies', saasAuth, async (req, res) => {
  try {
    const { page = 1, limit = 100, status = 'active' } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await db.query(`
      SELECT 
        tc.id, tc.company_name, tc.company_slug, tc.domain, tc.admin_name, tc.admin_email,
        tc.max_users, tc.status, tc.created_at, tc.updated_at,
        COUNT(tu.id) as user_count
      FROM tenant_companies tc
      LEFT JOIN tenant_users tu ON tc.id = tu.tenant_id AND tu.status = 'active'
      WHERE tc.saas_app_id = $1 AND tc.status = $2
      GROUP BY tc.id
      ORDER BY tc.created_at DESC
      LIMIT $3 OFFSET $4
    `, [req.saasApp.id, status, limit, offset]);
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM tenant_companies WHERE saas_app_id = $1 AND status = $2',
      [req.saasApp.id, status]
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: {
        companies: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Sync companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync companies'
    });
  }
});

// Sync Users (Get all users for a tenant)
router.get('/sync/users', saasAuth, async (req, res) => {
  try {
    const { tenant_id, page = 1, limit = 100, status = 'active' } = req.query;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id query parameter is required'
      });
    }
    
    // Verify tenant belongs to this SaaS app
    const tenantCheck = await db.query(
      'SELECT id FROM tenant_companies WHERE id = $1 AND saas_app_id = $2',
      [tenant_id, req.saasApp.id]
    );
    
    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found or does not belong to your SaaS application'
      });
    }
    
    const offset = (page - 1) * limit;
    
    const result = await db.query(`
      SELECT 
        tu.id, tu.username, tu.email, tu.first_name, tu.last_name, tu.role, tu.status,
        tu.created_at, tu.updated_at,
        d.name as department_name
      FROM tenant_users tu
      LEFT JOIN departments d ON tu.department_id = d.id
      WHERE tu.tenant_id = $1 AND tu.status = $2
      ORDER BY tu.created_at DESC
      LIMIT $3 OFFSET $4
    `, [tenant_id, status, limit, offset]);
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM tenant_users WHERE tenant_id = $1 AND status = $2',
      [tenant_id, status]
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Sync users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync users'
    });
  }
});

// Get SaaS Application Info (authenticated)
router.get('/info', saasAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.saasApp.id,
        name: req.saasApp.name,
        slug: req.saasApp.slug,
        permissions: req.saasApp.permissions,
        status: req.saasApp.status,
        webhook_url: req.saasApp.webhook_url
      }
    });
  } catch (error) {
    console.error('Get info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application info'
    });
  }
});

// Health Check (Public)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SaaS Integration API is healthy',
    timestamp: new Date().toISOString()
  });
});

// SSO Token Generation - PEMS calls this to get a short-lived token
router.post('/sso/generate', saasAuth, async (req, res) => {
  try {
    const { email, tenant_slug } = req.body;
    if (!email || !tenant_slug) {
      return res.status(400).json({ success: false, error: 'email and tenant_slug required' });
    }

    // Verify user exists in this tenant
    const tenantResult = await db.query(
      'SELECT id FROM tenant_companies WHERE company_slug = $1 AND saas_app_id = $2',
      [tenant_slug, req.saasApp.id]
    );
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    const tenantId = tenantResult.rows[0].id;

    const userResult = await db.query(
      'SELECT id, email, first_name, last_name FROM tenant_users WHERE email = $1 AND tenant_id = $2 AND status = $3',
      [email, tenantId, 'active']
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Generate short-lived SSO token (15 minutes)
    const jwt = require('jsonwebtoken');
    const ssoToken = jwt.sign(
      { userId: user.id, email: user.email, tenantId, tenantSlug: tenant_slug, sso: true },
      process.env.JWT_SECRET || 'webmail-secret',
      { expiresIn: '15m' }
    );

    res.json({ success: true, token: ssoToken, email: user.email });
  } catch (error) {
    console.error('SSO generate error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate SSO token' });
  }
});

// SSO Token Verify - SSGzone frontend calls this to auto-login
router.post('/sso/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'token required' });

    const result = await db.query(
      `SELECT st.*, tu.email, tu.first_name, tu.last_name, tu.role,
              tc.saas_app_id, tc.company_slug
       FROM sso_tokens st
       JOIN tenant_users tu ON tu.id = st.user_id
       JOIN tenant_companies tc ON tc.id = st.tenant_id
       WHERE st.token = $1 AND st.used_at IS NULL AND st.expires_at > NOW()`,
      [token]
    );

    if (!result.rows.length) return res.status(401).json({ success: false, error: 'Invalid or expired SSO token' });

    const row = result.rows[0];
    await db.query('UPDATE sso_tokens SET used_at = NOW() WHERE token = $1', [token]);

    const sessionToken = jwt.sign(
      { type: 'user', id: row.user_id, tenant_id: row.tenant_id, saas_id: row.saas_app_id, email: row.email, role: row.role },
      process.env.JWT_SECRET || 'super-admin-secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: {
        token: sessionToken,
        redirect_to: row.redirect_to || null,
        user: { id: row.user_id, email: row.email, full_name: `${row.first_name} ${row.last_name}`, role: row.role, tenant_id: row.tenant_id, saas_id: row.saas_app_id, type: 'user' }
      }
    });
  } catch (error) {
    console.error('SSO verify error:', error);
    res.status(401).json({ success: false, error: 'Invalid or expired SSO token' });
  }
});

module.exports = router;