const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const sesTransporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASS
  }
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
    
    // Find super admin
    const result = await db.query(
      'SELECT * FROM super_admins WHERE username = $1 AND status = $2',
      [username, 'active']
    );
    
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
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        type: 'super_admin',
        adminId: admin.id, 
        username: admin.username,
        email: admin.email
      },
      process.env.JWT_SECRET || 'super-admin-secret',
      { expiresIn: '8h' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          full_name: admin.full_name,
          type: 'super_admin'
        }
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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
    
    if (decoded.type !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin access required'
      });
    }
    
    // Verify admin still exists and is active
    const result = await db.query(
      'SELECT id, username, email FROM super_admins WHERE id = $1 AND status = $2',
      [decoded.adminId, 'active']
    );
    
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
    
    const [saasApps, tenants, users, emailsToday] = await Promise.all([
      db.query(saasAppsQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(tenantsQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(usersQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(emailsTodayQuery).catch(() => ({ rows: [{ count: 0 }] }))
    ]);
    
    const stats = {
      totalSaasApps: parseInt(saasApps.rows[0].count) || 0,
      totalTenants: parseInt(tenants.rows[0].count) || 0,
      totalUsers: parseInt(users.rows[0].count) || 0,
      emailsToday: parseInt(emailsToday.rows[0].count) || 0,
      activeUsers: parseInt(users.rows[0].count) || 0,
      storageUsed: 0, // Will implement when storage tracking is added
      systemHealth: 99.9 // Will implement real health check
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
router.get('/saas-apps', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        sa.id, sa.saas_name as name, sa.saas_slug as slug, sa.status, sa.created_at,
        COUNT(tc.id) as tenant_count
      FROM saas_applications sa
      LEFT JOIN tenant_companies tc ON sa.id = tc.saas_app_id
      GROUP BY sa.id, sa.saas_name, sa.saas_slug, sa.status, sa.created_at
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
router.get('/saas-apps/:id', superAdminAuth, async (req, res) => {
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
      GROUP BY sa.id, sa.saas_name, sa.saas_slug, sa.status, sa.created_at, 
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
router.post('/saas-apps', superAdminAuth, async (req, res) => {
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
router.put('/saas-apps/:id', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, webhook_url, permissions } = req.body;
    
    const result = await db.query(`
      UPDATE saas_applications 
      SET name = $1, description = $2, webhook_url = $3, permissions = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, slug, description, webhook_url, permissions, api_key, api_secret, created_at
    `, [name, description, webhook_url, permissions ? JSON.stringify(permissions) : null, id]);
    
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
router.delete('/saas-apps/:id', superAdminAuth, async (req, res) => {
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
router.get('/tenants', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        tc.id, tc.company_name, tc.company_slug, tc.domain, tc.admin_name, tc.admin_email,
        tc.max_users, tc.plan_type, tc.status, tc.created_at,
        sa.name as saas_app_name,
        COUNT(tu.id) as user_count
      FROM tenant_companies tc
      LEFT JOIN saas_applications sa ON tc.saas_app_id = sa.id
      LEFT JOIN tenant_users tu ON tc.id = tu.tenant_id AND tu.status = 'active'
      GROUP BY tc.id, tc.company_name, tc.company_slug, tc.domain, tc.admin_name, tc.admin_email,
               tc.max_users, tc.plan_type, tc.status, tc.created_at, sa.name
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
router.post('/tenants', superAdminAuth, async (req, res) => {
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

// ==================== USERS ====================

// GET /users - All users with tenant info, search, filter, pagination
router.get('/users', superAdminAuth, async (req, res) => {
  try {
    const { search, tenant_id, saas_app_id, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];
    let idx = 1;

    if (search) {
      where.push(`(u.username ILIKE $${idx} OR u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (saas_app_id) {
      where.push(`tc.saas_app_id = $${idx}::uuid`);
      params.push(saas_app_id);
      idx++;
    }
    if (tenant_id) {
      where.push(`u.tenant_id = $${idx}::uuid`);
      params.push(tenant_id);
      idx++;
    }
    if (status) {
      where.push(`u.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.status,
             u.role, u.created_at, u.last_login,
             tc.company_name as tenant_name, tc.company_slug as tenant_slug,
             sa.saas_name as saas_name
      FROM tenant_users u
      LEFT JOIN tenant_companies tc ON u.tenant_id = tc.id
      LEFT JOIN saas_applications sa ON tc.saas_app_id = sa.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) FROM tenant_users u
      LEFT JOIN tenant_companies tc ON u.tenant_id = tc.id
      LEFT JOIN saas_applications sa ON tc.saas_app_id = sa.id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// PATCH /users/:id/status - Update user status
router.patch('/users/:id/status', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const result = await db.query(
      'UPDATE tenant_users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

// DELETE /users/:id - Delete user
router.delete('/users/:id', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM tenant_users WHERE id = $1 RETURNING id, username, email',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// ==================== EMAIL ====================

// POST /email/send - Send single email
router.post('/email/send', superAdminAuth, async (req, res) => {
  try {
    const { to_email, to_name, subject, body, tenant_id, template_id } = req.body;
    if (!to_email || !subject || !body)
      return res.status(400).json({ success: false, error: 'to_email, subject, body required' });

    let finalBody = body;
    if (template_id) {
      const tmpl = await db.query('SELECT body, subject FROM email_templates WHERE id = $1', [template_id]);
      if (tmpl.rows.length) finalBody = tmpl.rows[0].body;
    }

    const info = await sesTransporter.sendMail({
      from: `"${process.env.SES_FROM_NAME || 'SSGzone'}" <${process.env.SES_FROM_EMAIL || 'noreply@ssgzone.in'}>`,
      to: to_name ? `"${to_name}" <${to_email}>` : to_email,
      subject,
      html: finalBody
    });

    await db.query(
      `INSERT INTO email_logs (sent_by, recipient_email, recipient_name, tenant_id, subject, body, status, message_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7)`,
      [req.admin.adminId, to_email, to_name || null, tenant_id || null, subject, finalBody, info.messageId]
    );

    res.json({ success: true, message: 'Email sent', messageId: info.messageId });
  } catch (error) {
    await db.query(
      `INSERT INTO email_logs (sent_by, recipient_email, subject, body, status, error_message)
       VALUES ($1, $2, $3, $4, 'failed', $5)`,
      [req.admin.adminId, req.body.to_email, req.body.subject, req.body.body, error.message]
    ).catch(() => {});
    console.error('Send email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// POST /email/broadcast - Send to all tenants or all users
router.post('/email/broadcast', superAdminAuth, async (req, res) => {
  try {
    const { subject, body, target } = req.body; // target: 'tenants' | 'users' | 'all'
    if (!subject || !body) return res.status(400).json({ success: false, error: 'subject, body required' });

    let recipients = [];
    if (target === 'tenants') {
      const r = await db.query(`SELECT admin_email as email, admin_name as name, id as tenant_id FROM tenant_companies WHERE status = 'active' AND admin_email IS NOT NULL`);
      recipients = r.rows;
    } else {
      const r = await db.query(`SELECT u.email, CONCAT(u.first_name, ' ', u.last_name) as name, u.tenant_id FROM tenant_users u WHERE u.status = 'active'`);
      recipients = r.rows;
    }

    let sent = 0, failed = 0;
    for (const r of recipients) {
      try {
        const info = await sesTransporter.sendMail({
          from: `"${process.env.SES_FROM_NAME || 'SSGzone'}" <${process.env.SES_FROM_EMAIL || 'noreply@ssgzone.in'}>`,
          to: `"${r.name}" <${r.email}>`,
          subject, html: body
        });
        await db.query(
          `INSERT INTO email_logs (sent_by, recipient_email, recipient_name, tenant_id, subject, body, status, message_id)
           VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7)`,
          [req.admin.adminId, r.email, r.name, r.tenant_id || null, subject, body, info.messageId]
        );
        sent++;
      } catch (e) {
        await db.query(
          `INSERT INTO email_logs (sent_by, recipient_email, subject, body, status, error_message) VALUES ($1, $2, $3, $4, 'failed', $5)`,
          [req.admin.adminId, r.email, subject, body, e.message]
        ).catch(() => {});
        failed++;
      }
    }
    res.json({ success: true, message: `Broadcast complete`, sent, failed, total: recipients.length });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ success: false, error: 'Broadcast failed' });
  }
});

// GET /email/sent - Sent email logs
router.get('/email/sent', superAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const offset = (page - 1) * limit;
    let where = [], params = [], idx = 1;

    if (status) { where.push(`el.status = $${idx++}`); params.push(status); }
    if (search) { where.push(`(el.recipient_email ILIKE $${idx} OR el.subject ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await db.query(`
      SELECT el.id, el.recipient_email, el.recipient_name, el.subject, el.status,
             el.message_id, el.error_message, el.sent_at,
             tc.company_name as tenant_name, sa.username as sent_by_name
      FROM email_logs el
      LEFT JOIN tenant_companies tc ON el.tenant_id = tc.id
      LEFT JOIN super_admins sa ON el.sent_by = sa.id
      ${whereClause}
      ORDER BY el.sent_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM email_logs el ${whereClause}`, params
    );

    res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page) });
  } catch (error) {
    console.error('Get sent emails error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch email logs' });
  }
});

// ==================== EMAIL TEMPLATES ====================

// GET /email/templates
router.get('/email/templates', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, subject, created_at, updated_at FROM email_templates ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// POST /email/templates
router.post('/email/templates', superAdminAuth, async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) return res.status(400).json({ success: false, error: 'name, subject, body required' });
    const result = await db.query(
      `INSERT INTO email_templates (name, subject, body, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, subject, body, req.admin.adminId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// PUT /email/templates/:id
router.put('/email/templates/:id', superAdminAuth, async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    const result = await db.query(
      `UPDATE email_templates SET name=$1, subject=$2, body=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [name, subject, body, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// DELETE /email/templates/:id
router.delete('/email/templates/:id', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM email_templates WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

module.exports = router;