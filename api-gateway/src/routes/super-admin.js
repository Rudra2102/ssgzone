const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Super admin routes working', timestamp: new Date().toISOString() });
});

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'academy'
});

// Super Admin Authentication
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password: '***' });
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Find super admin or platform employee
    let isEmployee = false;
    let result = await db.query(
      'SELECT * FROM super_admins WHERE username = $1 AND status = $2',
      [username, 'active']
    );
    if (result.rows.length === 0) {
      result = await db.query(
        'SELECT id::text as id, username, email, full_name, password_hash, role, status, NULL::boolean as totp_enabled, NULL as totp_secret FROM platform_admins WHERE username = $1 AND status = $2',
        [username, 'active']
      );
      isEmployee = result.rows.length > 0;
    }
    
    console.log('Database result:', result.rows.length > 0 ? 'User found' : 'User not found');
    
    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    console.log('Comparing password with hash');
    console.log('Retrieved hash:', admin.password_hash);
    console.log('Hash length:', admin.password_hash.length);
    // Fix escaped backslashes in hash
    const cleanHash = admin.password_hash.replace(/\\/g, '');
    console.log('Cleaned hash:', cleanHash);
    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, cleanHash);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Update last login (column doesn't exist yet)
    // await db.query(
    //   'UPDATE super_admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    //   [admin.id]
    // );
    
    // super_admins table has no role column — force it
    if (!isEmployee) admin.role = 'super_admin';

    // Check if 2FA is enabled
    if (admin.totp_enabled) {
      const tempToken = jwt.sign(
        { type: 'super_admin_2fa_pending', adminId: admin.id },
        process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'),
        { expiresIn: '5m' }
      );
      return res.json({ success: true, requires_2fa: true, temp_token: tempToken });
    }

    // Generate JWT token
    const token = jwt.sign(
      { type: 'super_admin', adminId: admin.id, username: admin.username, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'),
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, role: admin.role, type: 'super_admin' }
      }
    });
    
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Role-based access control for platform employees
const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.admin?.role;
  if (role === 'super_admin') return next();
  if (allowedRoles.length === 0) return res.status(403).json({ success: false, error: 'Super admin only' });
  if (allowedRoles.includes(role)) return next();
  return res.status(403).json({ success: false, error: 'Insufficient permissions for your role' });
};

// Super Admin Authentication Middleware
const superAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'));
    
    if (decoded.type !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin access required'
      });
    }
    
    // Verify admin still exists and is active (check both tables)
    let result = await db.query(
      'SELECT id, username, email FROM super_admins WHERE id = $1 AND status = $2',
      [decoded.adminId, 'active']
    );
    if (result.rows.length === 0) {
      result = await db.query(
        'SELECT id::text as id, username, email FROM platform_admins WHERE id = $1 AND status = $2',
        [decoded.adminId, 'active']
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    req.admin = {
      ...decoded,
      ...result.rows[0]
    };
    
    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Dashboard Stats
router.get('/dashboard/stats', superAdminAuth, async (req, res) => {
  try {
    // Get real data from database
    const saasAppsQuery = 'SELECT COUNT(*) as count FROM saas_applications WHERE status = $1';
    const tenantsQuery = 'SELECT COUNT(*) as count FROM tenant_companies WHERE status = $1';
    const usersQuery = 'SELECT COUNT(*) as count FROM tenant_users WHERE status = $1';
    const emailsTodayQuery = `SELECT COUNT(*) as count FROM email_queue WHERE DATE(created_at) = CURRENT_DATE`;
    const adminsQuery = 'SELECT COUNT(*) as count FROM platform_admins WHERE status = $1';
    
    const [saasApps, tenants, users, emailsToday, admins] = await Promise.all([
      db.query(saasAppsQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(tenantsQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(usersQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(emailsTodayQuery).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(adminsQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] }))
    ]);
    
    const stats = {
      totalSaasApps: parseInt(saasApps.rows[0].count) || 0,
      totalTenants: parseInt(tenants.rows[0].count) || 0,
      totalUsers: parseInt(users.rows[0].count) || 0,
      emailsToday: parseInt(emailsToday.rows[0].count) || 0,
      activeUsers: parseInt(users.rows[0].count) || 0,
      totalAdmins: parseInt(admins.rows[0].count) || 0,
      storageUsed: 0,
      systemHealth: 99.9
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
});

// Get SaaS Applications
router.get('/saas-apps', superAdminAuth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        sa.id, sa.saas_name as name, sa.saas_slug as slug, sa.status, sa.permissions, sa.created_at,
        COUNT(tc.id) as tenant_count
      FROM saas_applications sa
      LEFT JOIN tenant_companies tc ON sa.id = tc.saas_app_id
      GROUP BY sa.id, sa.saas_name, sa.saas_slug, sa.status, sa.permissions, sa.created_at
      ORDER BY sa.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get SaaS apps error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SaaS applications'
    });
  }
});

// Get Single SaaS Application with API Keys
router.get('/saas-apps/:id', superAdminAuth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        sa.id, sa.saas_name as name, sa.saas_slug as slug, sa.status, 
        sa.permissions, sa.api_key, sa.api_secret, sa.created_at,
        COUNT(tc.id) as tenant_count
      FROM saas_applications sa
      LEFT JOIN tenant_companies tc ON sa.id = tc.saas_app_id
      WHERE sa.id = $1
      GROUP BY sa.id, sa.saas_name, sa.saas_slug, sa.status, 
               sa.permissions, sa.api_key, sa.api_secret, sa.created_at
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SaaS application not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get SaaS app error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SaaS application'
    });
  }
});

// Create SaaS Application
router.post('/saas-apps', superAdminAuth, requireRole(), async (req, res) => {
  try {
    const { saas_name, saas_slug, description, webhook_url, permissions } = req.body;
    
    const defaultPermissions = permissions || {
      email: true, chat: true, whatsapp: false,
      calendar: false, notifications: true, file_storage: true
    };
    
    const apiKey = `ssg_live_${saas_slug}_${Date.now()}`;
    const apiSecret = `ssg_secret_${saas_slug}_${Math.random().toString(36).substring(2)}`;
    
    const result = await db.query(`
      INSERT INTO saas_applications (saas_name, saas_slug, api_key, api_secret, permissions, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, saas_name as name, saas_slug as slug, api_key, api_secret, created_at
    `, [saas_name, saas_slug, apiKey, apiSecret, JSON.stringify(defaultPermissions)]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create SaaS app error:', error);
    if (error.code === '23505') {
      res.status(400).json({
        success: false,
        error: 'SaaS application with this slug already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create SaaS application'
      });
    }
  }
});

// Update SaaS Application
router.put('/saas-apps/:id', superAdminAuth, requireRole(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;
    
    const result = await db.query(`
      UPDATE saas_applications 
      SET saas_name=$1, permissions=$2, updated_at=NOW()
      WHERE id=$3
      RETURNING id, saas_name as name, saas_slug as slug, permissions, api_key, api_secret, created_at
    `, [name, permissions ? JSON.stringify(permissions) : null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SaaS application not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update SaaS app error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update SaaS application'
    });
  }
});

// Delete SaaS Application
router.delete('/saas-apps/:id', superAdminAuth, requireRole(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are any tenants using this SaaS app
    const tenantCheck = await db.query(
      'SELECT COUNT(*) as count FROM tenant_companies WHERE saas_app_id = $1',
      [id]
    );
    
    if (parseInt(tenantCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete SaaS application with existing tenants'
      });
    }
    
    const result = await db.query(
      'DELETE FROM saas_applications WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SaaS application not found'
      });
    }
    
    res.json({
      success: true,
      message: 'SaaS application deleted successfully'
    });
  } catch (error) {
    console.error('Delete SaaS app error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete SaaS application'
    });
  }
});

// Get Tenants
router.get('/tenants', superAdminAuth, requireRole('admin', 'support', 'sales'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        tc.id, tc.company_name, tc.company_slug, tc.domain, tc.admin_name, tc.admin_email,
        tc.max_users, tc.plan_type, tc.status, tc.created_at,
        sa.saas_name as saas_app_name,
        COUNT(tu.id) as user_count
      FROM tenant_companies tc
      LEFT JOIN saas_applications sa ON tc.saas_app_id = sa.id
      LEFT JOIN tenant_users tu ON tc.id = tu.tenant_id AND tu.status = 'active'
      GROUP BY tc.id, tc.company_name, tc.company_slug, tc.domain, tc.admin_name, tc.admin_email,
               tc.max_users, tc.plan_type, tc.status, tc.created_at, sa.saas_name
      ORDER BY tc.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants'
    });
  }
});

// Create Tenant
router.post('/tenants', superAdminAuth, requireRole(), async (req, res) => {
  try {
    const { company_name, slug, saas_app_id, admin_name, admin_email, max_users } = req.body;
    
    // Get SaaS app details
    const saasAppResult = await db.query('SELECT slug FROM saas_applications WHERE id = $1', [saas_app_id]);
    if (saasAppResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SaaS application ID'
      });
    }
    
    const saasSlug = saasAppResult.rows[0].slug;
    const domain = `${slug}.${saasSlug}.ssgzone.in`;
    const tenantAdminEmail = `admin@${domain}`;
    
    // Create tenant company
    const tenantResult = await db.query(`
      INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, company_name, company_slug, domain, admin_name, admin_email, max_users, created_at
    `, [saas_app_id, company_name, slug, domain, admin_name, tenantAdminEmail, max_users]);
    
    const tenant = tenantResult.rows[0];
    
    // Create default admin user
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await db.query(`
      INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [tenant.id, 'admin', tenantAdminEmail, admin_name.split(' ')[0], admin_name.split(' ').slice(1).join(' '), 'admin', hashedPassword]);
    
    // Create default communication settings
    await db.query(`
      INSERT INTO tenant_communication_settings (tenant_id)
      VALUES ($1)
    `, [tenant.id]);
    
    res.json({
      success: true,
      data: {
        ...tenant,
        admin_credentials: {
          username: 'admin',
          password: defaultPassword,
          login_url: `https://${domain}/admin`
        }
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        error: 'Tenant with this slug already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create tenant'
      });
    }
  }
});

// Get Profile
router.get('/profile', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, created_at, last_login FROM super_admins WHERE id = $1',
      [req.admin.adminId]
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Regenerate API Keys for SaaS App
router.post('/saas-apps/:id/regenerate-keys', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current SaaS app
    const saasApp = await db.query('SELECT slug, webhook_url FROM saas_applications WHERE id = $1', [id]);
    
    if (saasApp.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SaaS application not found'
      });
    }
    
    const { slug, webhook_url } = saasApp.rows[0];
    
    // Generate new API credentials
    const newApiKey = `ssg_live_${slug}_${Date.now()}`;
    const newApiSecret = `ssg_secret_${slug}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newWebhookSecret = webhook_url ? `whk_${slug}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}` : null;
    
    // Update in database
    const result = await db.query(`
      UPDATE saas_applications 
      SET api_key = $1, api_secret = $2, webhook_secret = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, slug, api_key, api_secret, webhook_secret
    `, [newApiKey, newApiSecret, newWebhookSecret, id]);
    
    res.json({
      success: true,
      message: 'API keys regenerated successfully',
      data: result.rows[0],
      warning: 'Old API keys are now invalid. Update your application with new credentials.'
    });
  } catch (error) {
    console.error('Regenerate keys error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API keys'
    });
  }
});

// Logout
router.post('/auth/logout', superAdminAuth, async (req, res) => {
  try {
    // In a production system, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Bulk Create Tenants
router.post('/tenants/bulk-create', superAdminAuth, async (req, res) => {
  try {
    const { tenants } = req.body;
    
    if (!Array.isArray(tenants) || tenants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tenants array is required and must not be empty'
      });
    }
    
    const results = {
      success: [],
      failed: [],
      total: tenants.length
    };
    
    for (const tenant of tenants) {
      try {
        const { company_name, slug, saas_app_id, admin_name, admin_email, max_users } = tenant;
        
        // Validate required fields
        if (!company_name || !slug || !saas_app_id || !admin_name) {
          results.failed.push({
            tenant,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Check if slug already exists
        const existingTenant = await db.query(
          'SELECT id FROM tenant_companies WHERE company_slug = $1',
          [slug]
        );
        
        if (existingTenant.rows.length > 0) {
          results.failed.push({
            tenant,
            error: `Tenant with slug '${slug}' already exists`
          });
          continue;
        }
        
        // Get SaaS app details
        const saasAppResult = await db.query('SELECT slug FROM saas_applications WHERE id = $1', [saas_app_id]);
        if (saasAppResult.rows.length === 0) {
          results.failed.push({
            tenant,
            error: 'Invalid SaaS application ID'
          });
          continue;
        }
        
        const saasSlug = saasAppResult.rows[0].slug;
        const domain = `${slug}.${saasSlug}.ssgzone.in`;
        const tenantAdminEmail = `admin@${domain}`;
        
        // Create tenant company
        const tenantResult = await db.query(`
          INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, company_name, company_slug, domain, admin_name, admin_email, max_users, created_at
        `, [saas_app_id, company_name, slug, domain, admin_name, tenantAdminEmail, max_users || 50]);
        
        const newTenant = tenantResult.rows[0];
        
        // Create default admin user
        const defaultPassword = 'Welcome@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        await db.query(`
          INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [newTenant.id, 'admin', tenantAdminEmail, admin_name.split(' ')[0], admin_name.split(' ').slice(1).join(' ') || 'Admin', 'admin', hashedPassword]);
        
        // Create default communication settings
        await db.query(`
          INSERT INTO tenant_communication_settings (tenant_id)
          VALUES ($1)
        `, [newTenant.id]);
        
        results.success.push({
          ...newTenant,
          admin_credentials: {
            username: 'admin',
            password: defaultPassword,
            login_url: `https://${domain}/admin`
          }
        });
      } catch (error) {
        console.error('Error creating tenant:', error);
        results.failed.push({
          tenant,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Bulk create tenants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk create tenants'
    });
  }
});

// Bulk Create Users
router.post('/users/bulk-create', superAdminAuth, async (req, res) => {
  try {
    const { tenant_id, users } = req.body;
    
    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Users array is required and must not be empty'
      });
    }
    
    // Verify tenant exists
    const tenantCheck = await db.query('SELECT id FROM tenant_companies WHERE id = $1', [tenant_id]);
    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    const results = {
      success: [],
      failed: [],
      total: users.length
    };
    
    for (const user of users) {
      try {
        const { username, email, first_name, last_name, role, department_id } = user;
        
        // Validate required fields
        if (!username || !email || !first_name || !last_name) {
          results.failed.push({
            user,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Check if username or email already exists
        const existingUser = await db.query(
          'SELECT id FROM tenant_users WHERE (username = $1 OR email = $2) AND tenant_id = $3',
          [username, email, tenant_id]
        );
        
        if (existingUser.rows.length > 0) {
          results.failed.push({
            user,
            error: `User with username '${username}' or email '${email}' already exists`
          });
          continue;
        }
        
        // Generate default password
        const defaultPassword = 'Welcome@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const userResult = await db.query(`
          INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, department_id, password_hash, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, username, email, first_name, last_name, role, status, created_at
        `, [tenant_id, username, email, first_name, last_name, role || 'user', department_id || null, hashedPassword, 'active']);
        
        results.success.push({
          ...userResult.rows[0],
          default_password: defaultPassword
        });
      } catch (error) {
        console.error('Error creating user:', error);
        results.failed.push({
          user,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Bulk create users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk create users'
    });
  }
});

// Import Tenants from CSV
router.post('/tenants/import-csv', superAdminAuth, async (req, res) => {
  try {
    const { csv_data } = req.body;
    
    if (!csv_data || !Array.isArray(csv_data)) {
      return res.status(400).json({
        success: false,
        error: 'CSV data is required and must be an array'
      });
    }
    
    // Validate CSV headers
    const requiredHeaders = ['company_name', 'slug', 'saas_app_id', 'admin_name'];
    const firstRow = csv_data[0];
    
    if (!firstRow || typeof firstRow !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid CSV format'
      });
    }
    
    const missingHeaders = requiredHeaders.filter(header => !(header in firstRow));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`
      });
    }
    
    // Process CSV data using bulk create logic
    const tenants = csv_data.map(row => ({
      company_name: row.company_name,
      slug: row.slug,
      saas_app_id: row.saas_app_id,
      admin_name: row.admin_name,
      admin_email: row.admin_email || '',
      max_users: parseInt(row.max_users) || 50
    }));
    
    // Use the bulk create logic
    const results = {
      success: [],
      failed: [],
      total: tenants.length
    };
    
    for (const tenant of tenants) {
      try {
        const { company_name, slug, saas_app_id, admin_name, max_users } = tenant;
        
        // Validate required fields
        if (!company_name || !slug || !saas_app_id || !admin_name) {
          results.failed.push({
            tenant,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Check if slug already exists
        const existingTenant = await db.query(
          'SELECT id FROM tenant_companies WHERE company_slug = $1',
          [slug]
        );
        
        if (existingTenant.rows.length > 0) {
          results.failed.push({
            tenant,
            error: `Tenant with slug '${slug}' already exists`
          });
          continue;
        }
        
        // Get SaaS app details
        const saasAppResult = await db.query('SELECT slug FROM saas_applications WHERE id = $1', [saas_app_id]);
        if (saasAppResult.rows.length === 0) {
          results.failed.push({
            tenant,
            error: 'Invalid SaaS application ID'
          });
          continue;
        }
        
        const saasSlug = saasAppResult.rows[0].slug;
        const domain = `${slug}.${saasSlug}.ssgzone.in`;
        const tenantAdminEmail = `admin@${domain}`;
        
        // Create tenant company
        const tenantResult = await db.query(`
          INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, company_name, company_slug, domain, admin_name, admin_email, max_users, created_at
        `, [saas_app_id, company_name, slug, domain, admin_name, tenantAdminEmail, max_users]);
        
        const newTenant = tenantResult.rows[0];
        
        // Create default admin user
        const defaultPassword = 'Welcome@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        await db.query(`
          INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [newTenant.id, 'admin', tenantAdminEmail, admin_name.split(' ')[0], admin_name.split(' ').slice(1).join(' ') || 'Admin', 'admin', hashedPassword]);
        
        // Create default communication settings
        await db.query(`
          INSERT INTO tenant_communication_settings (tenant_id)
          VALUES ($1)
        `, [newTenant.id]);
        
        results.success.push({
          ...newTenant,
          admin_credentials: {
            username: 'admin',
            password: defaultPassword,
            login_url: `https://${domain}/admin`
          }
        });
      } catch (error) {
        console.error('Error creating tenant from CSV:', error);
        results.failed.push({
          tenant,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import CSV'
    });
  }
});

// Helper: detect if adminId belongs to platform_admins
const isEmployeeAdmin = async (adminId) => {
  const r = await db.query('SELECT id FROM super_admins WHERE id=$1', [adminId]);
  return r.rows.length === 0;
};

// POST /api/v1/super-admin/2fa/setup
router.post('/2fa/setup', superAdminAuth, async (req, res) => {
  const speakeasy = require('speakeasy');
  const QRCode = require('qrcode');
  try {
    const secret = speakeasy.generateSecret({ name: `SSGzone (${req.admin.username})`, length: 20 });
    const table = (await isEmployeeAdmin(req.admin.adminId)) ? 'platform_admins' : 'super_admins';
    await db.query(`UPDATE ${table} SET totp_secret=$1 WHERE id=$2`, [secret.base32, req.admin.adminId]);
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ success: true, data: { secret: secret.base32, qr_code: qrDataUrl } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/super-admin/2fa/enable
router.post('/2fa/enable', superAdminAuth, async (req, res) => {
  const speakeasy = require('speakeasy');
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'token required' });
  try {
    const table = (await isEmployeeAdmin(req.admin.adminId)) ? 'platform_admins' : 'super_admins';
    const result = await db.query(`SELECT totp_secret FROM ${table} WHERE id=$1`, [req.admin.adminId]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) return res.status(400).json({ success: false, error: 'Run /2fa/setup first' });
    const valid = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    if (!valid) return res.status(400).json({ success: false, error: 'Invalid token' });
    await db.query(`UPDATE ${table} SET totp_enabled=true WHERE id=$1`, [req.admin.adminId]);
    res.json({ success: true, message: '2FA enabled' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/super-admin/2fa/disable
router.post('/2fa/disable', superAdminAuth, async (req, res) => {
  try {
    const table = (await isEmployeeAdmin(req.admin.adminId)) ? 'platform_admins' : 'super_admins';
    await db.query(`UPDATE ${table} SET totp_enabled=false, totp_secret=NULL WHERE id=$1`, [req.admin.adminId]);
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/super-admin/2fa/verify
router.post('/2fa/verify', async (req, res) => {
  const speakeasy = require('speakeasy');
  const { temp_token, totp_token } = req.body;
  if (!temp_token || !totp_token) return res.status(400).json({ success: false, error: 'temp_token and totp_token required' });
  try {
    let decoded;
    try { decoded = jwt.verify(temp_token, process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret')); }
    catch { return res.status(401).json({ success: false, error: 'Invalid or expired temp token' }); }
    if (decoded.type !== 'super_admin_2fa_pending') return res.status(401).json({ success: false, error: 'Invalid token type' });
    let admin = (await db.query('SELECT * FROM super_admins WHERE id=$1 AND status=$2', [decoded.adminId, 'active'])).rows[0];
    let isEmployee = false;
    if (!admin) {
      admin = (await db.query('SELECT id::text as id, username, email, full_name, totp_secret, role FROM platform_admins WHERE id=$1 AND status=$2', [decoded.adminId, 'active'])).rows[0];
      isEmployee = true;
    }
    if (!admin) return res.status(401).json({ success: false, error: 'Admin not found' });
    const valid = speakeasy.totp.verify({ secret: admin.totp_secret, encoding: 'base32', token: totp_token, window: 1 });
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid 2FA code' });
    const role = isEmployee ? admin.role : 'super_admin';
    const token = jwt.sign(
      { type: 'super_admin', adminId: admin.id, username: admin.username, email: admin.email, role },
      process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'),
      { expiresIn: '8h' }
    );
    res.json({ success: true, data: { token, admin: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, role, type: 'super_admin' } } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/super-admin/2fa/status
router.get('/2fa/status', superAdminAuth, async (req, res) => {
  try {
    const table = (await isEmployeeAdmin(req.admin.adminId)) ? 'platform_admins' : 'super_admins';
    const result = await db.query(`SELECT totp_enabled FROM ${table} WHERE id=$1`, [req.admin.adminId]);
    res.json({ success: true, data: { enabled: result.rows[0]?.totp_enabled || false } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/v1/super-admin/users
router.get('/users', superAdminAuth, requireRole('admin', 'support'), async (req, res) => {
  try {
    const { limit = 100, search, tenant_id, saas_app_id, status } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) { params.push(`%${search}%`); where += ` AND (tu.first_name ILIKE $${params.length} OR tu.last_name ILIKE $${params.length} OR tu.email ILIKE $${params.length} OR tu.username ILIKE $${params.length})`; }
    if (tenant_id) { params.push(tenant_id); where += ` AND tu.tenant_id::text = $${params.length}`; }
    if (status) { params.push(status); where += ` AND tu.status = $${params.length}`; }
    if (saas_app_id) { params.push(saas_app_id); where += ` AND tc.saas_app_id::text = $${params.length}`; }
    params.push(parseInt(limit));
    const result = await db.query(`SELECT tu.id, tu.username, tu.email, tu.first_name, tu.last_name, tu.role, tu.status, tu.last_login, tu.created_at, tc.company_name as tenant_name, sa.saas_name as saas_name FROM tenant_users tu LEFT JOIN tenant_companies tc ON tu.tenant_id::text = tc.id::text LEFT JOIN saas_applications sa ON sa.id = tc.saas_app_id ${where} ORDER BY tu.created_at DESC LIMIT $${params.length}`, params);
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Support Tickets
router.get('/support-tickets', superAdminAuth, requireRole('admin', 'support', 'sales'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT st.*, tc.company_name as tenant_name FROM support_tickets st LEFT JOIN tenant_companies tc ON tc.id::text = st.tenant_id`;
    const params = [];
    if (status) { params.push(status); query += ` WHERE st.status=$1`; }
    query += ' ORDER BY st.created_at DESC LIMIT 100';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/support-tickets', superAdminAuth, requireRole('admin', 'support', 'sales'), async (req, res) => {
  try {
    const { subject, description, tenant_id, priority } = req.body;
    if (!subject) return res.status(400).json({ success: false, error: 'subject required' });
    const result = await db.query(
      `INSERT INTO support_tickets (subject, description, tenant_id, created_by, priority) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [subject, description, tenant_id || null, req.admin.username, priority || 'medium']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch('/support-tickets/:id/status', superAdminAuth, requireRole('admin', 'support', 'sales'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open','in_progress','resolved'].includes(status)) return res.status(400).json({ success: false, error: 'invalid status' });
    const result = await db.query(
      `UPDATE support_tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Change Password (employee profile)
router.patch('/profile/change-password', superAdminAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, error: 'current_password and new_password required' });

    // Try super_admins first, then platform_admins
    let row = (await db.query('SELECT id, password_hash FROM super_admins WHERE id = $1', [req.admin.adminId])).rows[0];
    let table = 'super_admins';
    if (!row) {
      row = (await db.query('SELECT id, password_hash FROM platform_admins WHERE id = $1', [req.admin.adminId])).rows[0];
      table = 'platform_admins';
    }
    if (!row) return res.status(404).json({ success: false, error: 'User not found' });

    const cleanHash = row.password_hash.replace(/\\/g, '');
    const valid = await bcrypt.compare(current_password, cleanHash);
    if (!valid) return res.status(400).json({ success: false, error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(new_password, 10);
    await db.query(`UPDATE ${table} SET password_hash=$1, updated_at=NOW() WHERE id=$2`, [newHash, row.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /admins — list platform employees
router.get('/admins', superAdminAuth, requireRole(), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, full_name, role, status, created_at, last_login FROM platform_admins ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /admins — create platform employee with welcome email
router.post('/admins', superAdminAuth, requireRole(), async (req, res) => {
  try {
    const { username, email, full_name, role, password } = req.body;
    if (!username || !email || !role) return res.status(400).json({ success: false, error: 'username, email, role required' });
    const plainPassword = password || 'Welcome@123';
    const hash = await bcrypt.hash(plainPassword, 10);
    const result = await db.query(
      `INSERT INTO platform_admins (username, email, full_name, role, password_hash, status, created_by)
       VALUES ($1,$2,$3,$4,$5,'active',$6) RETURNING id, username, email, full_name, role, status, created_at`,
      [username, email, full_name || username, role, hash, req.admin.adminId]
    );
    const newAdmin = result.rows[0];
    // Send welcome email (best-effort)
    if (email) {
      mailer.sendMail({
        from: `"SSGzone" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your SSGzone Employee Account',
        html: `<h2>Welcome to SSGzone</h2>
               <p>Your employee account has been created.</p>
               <p><strong>Username:</strong> ${username}</p>
               <p><strong>Password:</strong> ${plainPassword}</p>
               <p><strong>Role:</strong> ${role}</p>
               <p>Login at: <a href="https://mail.ssgzone.in">https://mail.ssgzone.in</a></p>
               <p>Please change your password after first login.</p>`
      }).catch(e => console.error('Welcome email failed:', e.message));
    }
    res.json({ success: true, data: newAdmin });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Username or email already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /admins/:id
router.put('/admins/:id', superAdminAuth, requireRole(), async (req, res) => {
  const { full_name, role, status } = req.body;
  try {
    const result = await db.query(
      `UPDATE platform_admins SET full_name=COALESCE($1,full_name), role=COALESCE($2,role), status=COALESCE($3,status), updated_at=NOW() WHERE id=$4 RETURNING id, username, email, full_name, role, status`,
      [full_name, role, status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Admin not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /admins/:id/reset-password
router.patch('/admins/:id/reset-password', superAdminAuth, requireRole(), async (req, res) => {
  const { new_password } = req.body;
  if (!new_password) return res.status(400).json({ success: false, error: 'new_password required' });
  try {
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE platform_admins SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.params.id]);
    res.json({ success: true, message: 'Password reset' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /admins/:id
router.delete('/admins/:id', superAdminAuth, requireRole(), async (req, res) => {
  try {
    await db.query('DELETE FROM platform_admins WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /tenants/:id
router.delete('/tenants/:id', superAdminAuth, requireRole(), async (req, res) => {
  try {
    await db.query('DELETE FROM tenant_users WHERE tenant_id=$1', [req.params.id]);
    await db.query('DELETE FROM tenant_companies WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Tenant deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /users/:id/status
router.patch('/users/:id/status', superAdminAuth, requireRole('admin', 'support'), async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ success: false, error: 'invalid status' });
  try {
    await db.query('UPDATE tenant_users SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /users/:id
router.delete('/users/:id', superAdminAuth, requireRole(), async (req, res) => {
  try {
    await db.query('DELETE FROM tenant_users WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /tenants/:id/status
router.patch('/tenants/:id/status', superAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ success: false, error: 'invalid status' });
    const result = await db.query(
      'UPDATE tenant_companies SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /mailboxes
router.get('/mailboxes', superAdminAuth, async (req, res) => {
  try {
    const { tenant_id, search } = req.query;
    const result = await db.query(`
      SELECT tu.id, tu.email, tu.first_name, tu.last_name, tu.role, tu.status,
        tu.tenant_id, tc.company_name as tenant_name, tc.domain
      FROM tenant_users tu
      LEFT JOIN tenant_companies tc ON tc.id::text = tu.tenant_id::text
      WHERE ($1::text IS NULL OR tu.tenant_id::text = $1)
        AND ($2::text IS NULL OR tu.email ILIKE '%'||$2||'%')
      ORDER BY tu.created_at DESC LIMIT 200
    `, [tenant_id || null, search || null]);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /mailboxes/:id/status
router.patch('/mailboxes/:id/status', superAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ success: false, error: 'invalid status' });
    const result = await db.query(
      'UPDATE tenant_users SET status=$1 WHERE id=$2 RETURNING id, email, status',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /aliases
router.get('/aliases', superAdminAuth, async (req, res) => {
  try {
    const { mailbox_id } = req.query;
    const result = await db.query(
      `SELECT * FROM email_aliases WHERE ($1::text IS NULL OR mailbox_id::text = $1) ORDER BY created_at DESC`,
      [mailbox_id || null]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /aliases
router.post('/aliases', superAdminAuth, async (req, res) => {
  try {
    const { mailbox_id, alias_email } = req.body;
    if (!mailbox_id || !alias_email) return res.status(400).json({ success: false, error: 'mailbox_id and alias_email required' });
    const result = await db.query(
      'INSERT INTO email_aliases (mailbox_id, alias_email) VALUES ($1,$2) RETURNING *',
      [mailbox_id, alias_email]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Alias already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /aliases/:id
router.delete('/aliases/:id', superAdminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM email_aliases WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET/PUT /saas-apps/:id/features
router.get('/saas-apps/:id/features', superAdminAuth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const result = await db.query('SELECT feature_key, is_enabled FROM saas_feature_permissions WHERE saas_id=$1', [req.params.id]);
    const map = {};
    result.rows.forEach(r => { map[r.feature_key] = r.is_enabled; });
    res.json({ success: true, data: map });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/saas-apps/:id/features', superAdminAuth, requireRole(), async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const [feature_key, is_enabled] of Object.entries(req.body)) {
      await client.query(
        `INSERT INTO saas_feature_permissions (saas_id, feature_key, is_enabled) VALUES ($1,$2,$3)
         ON CONFLICT (saas_id, feature_key) DO UPDATE SET is_enabled=$3, updated_at=NOW()`,
        [req.params.id, feature_key, is_enabled]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ success: false, error: err.message }); }
  finally { client.release(); }
});

// GET/PUT /branding, POST /branding/logo, POST /branding/favicon
router.get('/branding', async (req, res) => {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS platform_branding (id SERIAL PRIMARY KEY, platform_name TEXT, tagline TEXT, primary_color TEXT, secondary_color TEXT, sidebar_color TEXT, header_color TEXT, sidebar_text_color TEXT, header_text_color TEXT, font_family TEXT, font_size TEXT, from_name TEXT, from_email TEXT, email_footer TEXT, admin_alert_email TEXT, default_max_users INT DEFAULT 100, default_mailbox_quota INT DEFAULT 1024, session_timeout INT DEFAULT 480, password_min_length INT DEFAULT 8, logo_url TEXT, favicon_url TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`);
    const result = await db.query('SELECT * FROM platform_branding LIMIT 1');
    res.json({ success: true, data: result.rows[0] || {} });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/branding', superAdminAuth, requireRole(), async (req, res) => {
  const fields = ['platform_name','tagline','primary_color','secondary_color','sidebar_color','header_color','sidebar_text_color','header_text_color','font_family','font_size','from_name','from_email','email_footer','admin_alert_email','default_max_users','default_mailbox_quota','session_timeout','password_min_length'];
  const vals = fields.map(f => req.body[f] ?? null);
  try {
    const existing = await db.query('SELECT id FROM platform_branding LIMIT 1');
    let result;
    if (existing.rows.length) {
      const sets = fields.map((f, i) => `${f}=$${i + 1}`).join(',');
      result = await db.query(`UPDATE platform_branding SET ${sets}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING *`, [...vals, existing.rows[0].id]);
    } else {
      result = await db.query(
        `INSERT INTO platform_branding (${fields.join(',')}) VALUES (${fields.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`,
        vals
      );
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/branding/logo', superAdminAuth, requireRole(), async (req, res) => {
  const multer = require('multer');
  const upload = multer({ dest: '/opt/ssgzone/uploads/branding/' }).single('logo');
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const logo_url = `/uploads/branding/${req.file.filename}`;
    await db.query('UPDATE platform_branding SET logo_url=$1 WHERE id=(SELECT id FROM platform_branding LIMIT 1)', [logo_url]);
    res.json({ success: true, data: { logo_url } });
  });
});

router.post('/branding/favicon', superAdminAuth, requireRole(), async (req, res) => {
  const multer = require('multer');
  const upload = multer({ dest: '/opt/ssgzone/uploads/branding/' }).single('favicon');
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const favicon_url = `/uploads/branding/${req.file.filename}`;
    await db.query('UPDATE platform_branding SET favicon_url=$1 WHERE id=(SELECT id FROM platform_branding LIMIT 1)', [favicon_url]);
    res.json({ success: true, data: { favicon_url } });
  });
});

// Tenant domain routes
router.get('/tenants/:id/domain/status', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT domain, dns_verified FROM tenant_companies WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const { domain, dns_verified } = result.rows[0];
    res.json({ success: true, data: { custom_domain: domain, domain_status: dns_verified ? 'verified' : domain ? 'pending' : null } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/tenants/:id/domain/setup', superAdminAuth, requireRole(), async (req, res) => {
  const { custom_domain } = req.body;
  if (!custom_domain) return res.status(400).json({ success: false, error: 'custom_domain required' });
  try {
    await db.query('UPDATE tenant_companies SET domain=$1, dns_verified=false WHERE id=$2', [custom_domain, req.params.id]);
    res.json({ success: true, data: { custom_domain, domain_status: 'pending', verification: { value: `ssgzone-verify=${require('crypto').randomBytes(8).toString('hex')}` } } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/tenants/:id/domain/verify', superAdminAuth, requireRole(), async (req, res) => {
  const dns = require('dns').promises;
  try {
    const result = await db.query('SELECT domain FROM tenant_companies WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const domain = result.rows[0].domain;
    let mxOk = false, spfOk = false;
    try { const mx = await dns.resolveMx(domain); mxOk = mx.some(r => r.exchange.includes('ssgzone.in')); } catch {}
    try { const txt = await dns.resolveTxt(domain); spfOk = txt.flat().join(' ').includes('ssgzone.in'); } catch {}
    if (mxOk && spfOk) {
      await db.query('UPDATE tenant_companies SET dns_verified=true WHERE id=$1', [req.params.id]);
      res.json({ success: true, data: { verified: true } });
    } else {
      res.json({ success: false, error: `DNS not ready. MX: ${mxOk ? '✅' : '❌'}, SPF: ${spfOk ? '✅' : '❌'}` });
    }
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/tenants/:id/domain', superAdminAuth, requireRole(), async (req, res) => {
  try {
    await db.query('UPDATE tenant_companies SET dns_verified=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/super-admin/tenants/:id/verify-dns
router.post('/tenants/:id/verify-dns', superAdminAuth, async (req, res) => {
  const dns = require('dns').promises;
  try {
    const result = await db.query('SELECT domain FROM tenant_companies WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const domain = result.rows[0].domain;
    const checks = { mx: false, spf: false, dmarc: false };
    try { const mx = await dns.resolveMx(domain); checks.mx = mx.some(r => r.exchange.includes('ssgzone.in')); } catch {}
    try { const txt = await dns.resolveTxt(domain); checks.spf = txt.flat().join(' ').includes('include:ssgzone.in'); } catch {}
    try { const dmarc = await dns.resolveTxt(`_dmarc.${domain}`); checks.dmarc = dmarc.flat().join(' ').includes('v=DMARC1'); } catch {}
    const allPassed = Object.values(checks).every(Boolean);
    if (allPassed) await db.query('UPDATE tenant_companies SET dns_verified=true WHERE id=$1', [req.params.id]);
    res.json({ success: true, data: { domain, checks, all_passed: allPassed } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Email routes
router.get('/email/sent', superAdminAuth, requireRole('admin', 'support'), async (req, res) => {
  const { limit = 50, search, status, email_type } = req.query;
  const params = [];
  let where = 'WHERE 1=1';
  if (search) { params.push(`%${search}%`); where += ` AND (e.subject ILIKE $${params.length} OR e.to_email ILIKE $${params.length})`; }
  if (status) { params.push(status); where += ` AND e.status = $${params.length}`; }
  if (email_type) { params.push(email_type); where += ` AND e.email_type = $${params.length}`; }
  params.push(parseInt(limit));
  try {
    const result = await db.query(
      `SELECT e.id, e.to_email as recipient_email, e.subject, e.email_type as email_category, e.created_at as sent_at,
              tc.company_name as tenant_name
       FROM emails e
       LEFT JOIN tenant_companies tc ON tc.id::text = e.tenant_id
       ${where}
       ORDER BY e.created_at DESC LIMIT $${params.length}`,
      params
    );
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/email/send', superAdminAuth, requireRole(), async (req, res) => {
  const { to_email, to_name, subject, body, tenant_id } = req.body;
  if (!to_email || !subject || !body) return res.status(400).json({ success: false, error: 'to_email, subject, body required' });
  try {
    await mailer.sendMail({
      from: `"SSGzone" <${process.env.SMTP_USER}>`,
      to: to_name ? `"${to_name}" <${to_email}>` : to_email,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, '')
    });
    res.json({ success: true, message: 'Email sent' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/email/broadcast', superAdminAuth, requireRole(), async (req, res) => {
  const { subject, body, target } = req.body;
  if (!subject || !body) return res.status(400).json({ success: false, error: 'subject and body required' });
  try {
    let rows;
    if (target === 'users') {
      rows = (await db.query(`SELECT DISTINCT email FROM tenant_users WHERE status='active' AND email IS NOT NULL`)).rows;
    } else {
      rows = (await db.query(`SELECT DISTINCT admin_email as email FROM tenant_companies WHERE status='active' AND admin_email IS NOT NULL`)).rows;
    }
    let sent = 0, failed = 0;
    for (const row of rows) {
      try {
        await mailer.sendMail({ from: `"SSGzone" <${process.env.SMTP_USER}>`, to: row.email, subject, html: body, text: body.replace(/<[^>]*>/g, '') });
        sent++;
      } catch { failed++; }
    }
    res.json({ success: true, sent, failed, total: rows.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/email/templates', superAdminAuth, requireRole('admin', 'support', 'sales'), async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM email_templates WHERE is_active=true ORDER BY category, name`);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/email/templates', superAdminAuth, requireRole(), async (req, res) => {
  const { name, subject, body, category = 'general' } = req.body;
  if (!name || !subject || !body) return res.status(400).json({ success: false, error: 'name, subject, body required' });
  try {
    const result = await db.query(
      `INSERT INTO email_templates (name, subject, html_body, category, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, subject, body, category, req.admin.adminId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/email/templates/:id', superAdminAuth, requireRole(), async (req, res) => {
  const { name, subject, body, category } = req.body;
  try {
    const result = await db.query(
      `UPDATE email_templates SET name=$1, subject=$2, html_body=$3, category=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [name, subject, body, category, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/email/templates/:id', superAdminAuth, requireRole(), async (req, res) => {
  try {
    await db.query(`UPDATE email_templates SET is_active=false WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /security/stats
router.get('/security/stats', superAdminAuth, requireRole(), async (req, res) => {
  try {
    const sa = await db.query('SELECT COUNT(*) FILTER (WHERE totp_enabled=true) as enabled, COUNT(*) as total FROM super_admins');
    const pa = await db.query('SELECT COUNT(*) FILTER (WHERE totp_enabled=true) as enabled, COUNT(*) as total FROM platform_admins');
    res.json({ success: true, data: { admins_2fa_enabled: parseInt(sa.rows[0].enabled), admins_total: parseInt(sa.rows[0].total), employees_2fa_enabled: parseInt(pa.rows[0].enabled), employees_total: parseInt(pa.rows[0].total) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /audit-logs
router.get('/audit-logs', superAdminAuth, requireRole('admin', 'support'), async (req, res) => {
  try {
    const { page = 1, limit = 25, actor_id, action, tenant_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE 1=1';
    if (actor_id) { params.push(actor_id); where += ` AND actor_id::text = $${params.length}`; }
    if (action) { params.push(`%${action}%`); where += ` AND action ILIKE $${params.length}`; }
    if (tenant_id) { params.push(tenant_id); where += ` AND tenant_id::text = $${params.length}`; }
    const countResult = await db.query(`SELECT COUNT(*) FROM audit_logs ${where}`, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT id, actor_id, actor_type, action, target_type, target_id, tenant_id, ip_address, details, created_at
       FROM audit_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ success: true, data: result.rows, total, page: parseInt(page) });
  } catch (err) {
    if (err.code === '42P01') return res.json({ success: true, data: [], total: 0, message: 'Audit log table not yet created' });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;