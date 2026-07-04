const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for branding uploads
const brandingStorage = multer.diskStorage({
  destination: '/opt/ssgzone/uploads/branding/',
  filename: (req, file, cb) => cb(null, `branding_${Date.now()}${path.extname(file.originalname)}`)
});
const uploadBranding = multer({ storage: brandingStorage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only images allowed'));
}});

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
    const emailsTodayQuery = `SELECT COUNT(*) as count FROM email_logs WHERE DATE(sent_at) = CURRENT_DATE AND status = 'sent'`;
    const adminsQuery = `SELECT COUNT(*) as count FROM platform_admins WHERE status = 'active'`;
    
    const [saasApps, tenants, users, emailsToday, admins] = await Promise.all([
      db.query(saasAppsQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(tenantsQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(usersQuery, ['active']).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(emailsTodayQuery).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(adminsQuery).catch(() => ({ rows: [{ count: 0 }] }))
    ]);
    
    const stats = {
      totalSaasApps: parseInt(saasApps.rows[0].count) || 0,
      totalTenants: parseInt(tenants.rows[0].count) || 0,
      totalUsers: parseInt(users.rows[0].count) || 0,
      emailsToday: parseInt(emailsToday.rows[0].count) || 0,
      activeUsers: parseInt(users.rows[0].count) || 0,
      totalAdmins: parseInt(admins.rows[0].count) || 0,
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

// ==================== EMAIL HELPERS ====================

// Get platform branding/settings from DB
const getPlatformSettings = async () => {
  try {
    const result = await db.query('SELECT * FROM platform_branding ORDER BY id LIMIT 1');
    return result.rows[0] || {};
  } catch (e) { return {}; }
};

const replaceVars = (text, vars) => {
  if (!text) return text;
  return Object.entries(vars).reduce((t, [k, v]) => t.replace(new RegExp(`{{${k}}}`, 'g'), v || ''), text);
};

const sendTemplateEmail = async (slug, from, to, vars, tenantId = null) => {
  try {
    const settings = await getPlatformSettings();
    const tmpl = await db.query(
      `SELECT subject, html_content FROM email_templates WHERE slug=$1 AND is_system=TRUE LIMIT 1`, [slug]
    );
    let subject, html;
    if (tmpl.rows.length) {
      subject = replaceVars(tmpl.rows[0].subject, vars);
      let body = replaceVars(tmpl.rows[0].html_content, vars);
      const footer = settings.email_footer || 'Powered by SSGzone';
      html = `${body}<hr style="margin-top:30px"><p style="font-size:11px;color:#999">${footer}</p>`;
    } else {
      subject = vars.subject || 'Notification from SSGzone';
      html = `<p>${JSON.stringify(vars)}</p>`;
    }
    const info = await sesTransporter.sendMail({ from, to, subject, html });
    await db.query(
      `INSERT INTO email_logs (recipient_email, tenant_id, subject, body, status, message_id, email_type)
       VALUES ($1, $2, $3, $4, 'sent', $5, 'auto')`,
      [to, tenantId, subject, html, info.messageId]
    ).catch(() => {});
  } catch (e) {
    console.error(`Template email [${slug}] failed:`, e.message);
    await db.query(
      `INSERT INTO email_logs (recipient_email, tenant_id, subject, body, status, error_message, email_type)
       VALUES ($1, $2, $3, $4, 'failed', $5, 'auto')`,
      [to, tenantId, slug, e.message, e.message]
    ).catch(() => {});
  }
};

const sendAutoEmail = async (from, to, subject, html, tenantId = null) => {
  try {
    const info = await sesTransporter.sendMail({ from, to, subject, html });
    await db.query(
      `INSERT INTO email_logs (recipient_email, tenant_id, subject, body, status, message_id, email_type)
       VALUES ($1, $2, $3, $4, 'sent', $5, 'auto')`,
      [to, tenantId, subject, html, info.messageId]
    ).catch(() => {});
  } catch (e) {
    console.error('Auto email failed:', e.message);
    await db.query(
      `INSERT INTO email_logs (recipient_email, tenant_id, subject, body, status, error_message, email_type)
       VALUES ($1, $2, $3, $4, 'failed', $5, 'auto')`,
      [to, tenantId, subject, html, e.message]
    ).catch(() => {});
  }
};

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

// GET /saas-apps/:id/features
router.get('/saas-apps/:id/features', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM saas_features WHERE saas_app_id=$1', [req.params.id]);
    res.json({ success: true, data: result.rows[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /saas-apps/:id/features
router.put('/saas-apps/:id/features', superAdminAuth, async (req, res) => {
  try {
    const { email, chat, drive, video, notifications, whatsapp, custom_domain, max_users, max_storage_gb } = req.body;
    const result = await db.query(`
      INSERT INTO saas_features (saas_app_id, email, chat, drive, video, notifications, whatsapp, custom_domain, max_users, max_storage_gb)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (saas_app_id) DO UPDATE SET
        email=$2, chat=$3, drive=$4, video=$5, notifications=$6, whatsapp=$7,
        custom_domain=$8, max_users=$9, max_storage_gb=$10, updated_at=NOW()
      RETURNING *
    `, [req.params.id, email??true, chat??false, drive??false, video??false, notifications??true, whatsapp??false, custom_domain??false, max_users??100, max_storage_gb??10]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE saas_applications SET saas_name=$1, updated_at=NOW() WHERE id=$2
       RETURNING id, saas_name as name, saas_slug as slug, status, created_at`,
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'SaaS application not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update SaaS app error:', error);
    res.status(500).json({ success: false, error: 'Failed to update SaaS application' });
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
        tc.max_users, tc.status, tc.created_at, tc.saas_app_id,
        sa.saas_name as saas_app_name,
        COUNT(tu.id) as user_count
      FROM tenant_companies tc
      LEFT JOIN saas_applications sa ON tc.saas_app_id = sa.id
      LEFT JOIN tenant_users tu ON tc.id = tu.tenant_id AND tu.status = 'active'
      GROUP BY tc.id, tc.company_name, tc.company_slug, tc.domain, tc.admin_name, tc.admin_email,
               tc.max_users, tc.status, tc.created_at, tc.saas_app_id, sa.saas_name
      ORDER BY tc.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
});

// PATCH /tenants/:id/status
router.patch('/tenants/:id/status', superAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'inactive'].includes(status))
      return res.status(400).json({ success: false, error: 'Invalid status' });
    const result = await db.query(
      'UPDATE tenant_companies SET status=$1 WHERE id=$2 RETURNING id, company_name, status',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update tenant status' });
  }
});

// DELETE /tenants/:id
router.delete('/tenants/:id', superAdminAuth, async (req, res) => {
  try {
    const userCheck = await db.query('SELECT COUNT(*) as count FROM tenant_users WHERE tenant_id=$1', [req.params.id]);
    if (parseInt(userCheck.rows[0].count) > 0)
      return res.status(400).json({ success: false, error: 'Cannot delete tenant with existing users' });
    const result = await db.query('DELETE FROM tenant_companies WHERE id=$1 RETURNING id, company_name', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, message: `Tenant ${result.rows[0].company_name} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete tenant' });
  }
});

// Create Tenant
router.post('/tenants', superAdminAuth, async (req, res) => {
  try {
    const { company_name, slug, saas_app_id, admin_name, admin_email, max_users } = req.body;
    
    // Get SaaS app details
    const saasAppResult = await db.query('SELECT saas_slug FROM saas_applications WHERE id = $1', [saas_app_id]);
    if (saasAppResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SaaS application ID'
      });
    }
    
    const saasSlug = saasAppResult.rows[0].saas_slug;
    const domain = `${slug}.${saasSlug}.ssgzone.in`;
    const tenantAdminEmail = admin_email || `admin@${domain}`;
    
    // Create tenant company
    const tenantResult = await db.query(`
      INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, company_name, company_slug, domain, admin_name, admin_email, max_users, created_at
    `, [saas_app_id, company_name, slug, domain, admin_name, tenantAdminEmail, max_users || 100]);
    
    const tenant = tenantResult.rows[0];
    
    // Create default admin user
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await db.query(`
      INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [tenant.id, 'admin', tenantAdminEmail, admin_name.split(' ')[0], admin_name.split(' ').slice(1).join(' ') || '', 'admin', hashedPassword]);
    
    // Create default communication settings
    await db.query(`INSERT INTO tenant_communication_settings (tenant_id) VALUES ($1)`, [tenant.id]);

    // Auto-provision admin mailbox in iRedMail
    try {
      const mailDomain = domain;
      const mailEmail = `admin@${mailDomain}`;
      const hashedMailPwd = hashMailPassword(defaultPassword);
      await vmailDb.query(
        `INSERT INTO domain (domain, description, transport, active) VALUES ($1, $2, 'dovecot', 1) ON CONFLICT (domain) DO UPDATE SET active=1`,
        [mailDomain, `Auto domain for tenant ${slug}`]
      );
      await vmailDb.query(`
        INSERT INTO mailbox (username, password, name, first_name, last_name, domain, storagebasedirectory, storagenode, maildir, quota, active)
        VALUES ($1, $2, $3, $4, '', $5, '/var/vmail', $6, $7, $8, 1) ON CONFLICT (username) DO NOTHING
      `, [mailEmail, hashedMailPwd, admin_name, admin_name.split(' ')[0], mailDomain, mailDomain, `${mailDomain}/admin/`, 1073741824]);
      await vmailDb.query(
        `INSERT INTO forwardings (address, forwarding, domain, dest_domain, is_forwarding, active) VALUES ($1, $1, $2, $2, 0, 1) ON CONFLICT DO NOTHING`,
        [mailEmail, mailDomain]
      );
    } catch (mailErr) {
      console.error('Auto-provision mailbox warning:', mailErr.message);
    }
    
    // Auto email to tenant admin via template
    sendTemplateEmail(
      'tenant_welcome',
      `"${saasSlug.toUpperCase()} Support" <noreply@${saasSlug}.ssgzone.in>`,
      tenantAdminEmail,
      { name: admin_name, saas_name: saasSlug.toUpperCase(), company: company_name, domain, username: 'admin', password: defaultPassword, login_url: `https://${domain}/admin` },
      tenant.id
    );

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

// PATCH /profile/change-password
router.patch('/profile/change-password', superAdminAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, error: 'current_password and new_password required' });
    const result = await db.query('SELECT password_hash FROM super_admins WHERE id=$1', [req.admin.adminId]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Admin not found' });
    const cleanHash = result.rows[0].password_hash.replace(/\\/g, '');
    const isValid = await bcrypt.compare(current_password, cleanHash);
    if (!isValid) return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE super_admins SET password_hash=$1 WHERE id=$2', [newHash, req.admin.adminId]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// GET /profile
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
        const saasAppResult = await db.query('SELECT saas_slug FROM saas_applications WHERE id = $1', [saas_app_id]);
        if (saasAppResult.rows.length === 0) {
          results.failed.push({
            tenant,
            error: 'Invalid SaaS application ID'
          });
          continue;
        }
        
        const saasSlug = saasAppResult.rows[0].saas_slug;
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
        const saasAppResult = await db.query('SELECT saas_slug FROM saas_applications WHERE id = $1', [saas_app_id]);
        if (saasAppResult.rows.length === 0) {
          results.failed.push({
            tenant,
            error: 'Invalid SaaS application ID'
          });
          continue;
        }
        
        const saasSlug = saasAppResult.rows[0].saas_slug;
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
          `INSERT INTO email_logs (recipient_email, recipient_name, tenant_id, subject, body, status, message_id, email_type)
           VALUES ($1, $2, $3, $4, $5, 'sent', $6, 'broadcast')`,
          [r.email, r.name, r.tenant_id || null, subject, body, info.messageId]
        );
        sent++;
      } catch (e) {
        await db.query(
          `INSERT INTO email_logs (recipient_email, subject, body, status, error_message, email_type) VALUES ($1, $2, $3, 'failed', $4, 'broadcast')`,
          [r.email, subject, body, e.message]
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
    const { page = 1, limit = 50, status, search, email_type } = req.query;
    const offset = (page - 1) * limit;
    let where = [], params = [], idx = 1;

    if (status) { where.push(`el.status = $${idx++}`); params.push(status); }
    if (search) { where.push(`(el.recipient_email ILIKE $${idx} OR el.subject ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (email_type) { where.push(`el.email_type = $${idx++}`); params.push(email_type); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await db.query(`
      SELECT el.id, el.recipient_email, el.recipient_name, el.subject, el.status,
             el.message_id, el.error_message, el.sent_at, el.email_type,
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
    const result = await db.query('SELECT id, name, slug, subject, html_content as body, category, is_system, is_active, variables, created_at, updated_at FROM email_templates ORDER BY is_system DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// POST /email/templates
router.post('/email/templates', superAdminAuth, async (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    if (!name || !subject || !body) return res.status(400).json({ success: false, error: 'name, subject, body required' });
    const result = await db.query(
      `INSERT INTO email_templates (tenant_id, name, subject, html_content, category) VALUES ('00000000-0000-0000-0000-000000000000', $1, $2, $3, $4) RETURNING id, name, subject, html_content as body, category, is_system, created_at`,
      [name, subject, body, category || 'general']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// PUT /email/templates/:id
router.put('/email/templates/:id', superAdminAuth, async (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    const result = await db.query(
      `UPDATE email_templates SET name=$1, subject=$2, html_content=$3, category=$4, updated_at=NOW() WHERE id=$5 RETURNING id, name, subject, html_content as body, category, is_system, updated_at`,
      [name, subject, body, category || 'general', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// DELETE /email/templates/:id — system templates cannot be deleted
router.delete('/email/templates/:id', superAdminAuth, async (req, res) => {
  try {
    const check = await db.query('SELECT is_system FROM email_templates WHERE id=$1', [req.params.id]);
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Template not found' });
    if (check.rows[0].is_system) return res.status(400).json({ success: false, error: 'System templates cannot be deleted' });
    await db.query('DELETE FROM email_templates WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// ==================== MAILBOX ====================

const vmailDb = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'vmail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'academy'
});

const hashMailPassword = (password) => {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(8);
  const hash = crypto.createHash('sha512').update(Buffer.from(password, 'utf8')).update(salt).digest();
  return `{SSHA512}${Buffer.concat([hash, salt]).toString('base64')}`;
};

// GET /mailbox/list
router.get('/mailbox/list', superAdminAuth, async (req, res) => {
  try {
    const { domain, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE active = 1';
    const params = [];
    if (domain) { where += ` AND domain = $1`; params.push(domain); }
    const result = await vmailDb.query(
      `SELECT username, name, first_name, last_name, domain, quota, active, created FROM mailbox ${where} ORDER BY created DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await vmailDb.query(`SELECT COUNT(*) FROM mailbox ${where}`, params);
    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (error) {
    console.error('List mailbox error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mailboxes' });
  }
});

// GET /mailbox/domains - Get valid domains for mailbox creation
router.get('/mailbox/domains', superAdminAuth, async (req, res) => {
  try {
    const result = await vmailDb.query('SELECT domain FROM domain WHERE active = 1 ORDER BY domain');
    res.json({ success: true, data: result.rows.map(r => r.domain) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch domains' });
  }
});

// POST /mailbox/create
router.post('/mailbox/create', superAdminAuth, async (req, res) => {
  try {
    const { username, domain = 'ssgzone.in', password, first_name, last_name, quota = 1024 } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'username and password required' });

    // Validate domain exists in vmail
    const domainCheck = await vmailDb.query('SELECT domain FROM domain WHERE domain = $1 AND active = 1', [domain]);
    if (!domainCheck.rows.length) return res.status(400).json({ success: false, error: `Domain '${domain}' is not registered. Only registered domains are allowed.` });

    const email = `${username}@${domain}`;
    const existing = await vmailDb.query('SELECT username FROM mailbox WHERE username = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ success: false, error: 'Mailbox already exists' });
    const hashedPwd = hashMailPassword(password);
    const maildir = username;
    await vmailDb.query(`
      INSERT INTO mailbox (username, password, name, first_name, last_name, domain, storagebasedirectory, storagenode, maildir, quota, active)
      VALUES ($1, $2, $3, $4, $5, $6, '/var/vmail', $7, $8, $9, 1)
    `, [email, hashedPwd, `${first_name || username} ${last_name || ''}`.trim(), first_name || username, last_name || '', domain, domain, maildir, quota * 1048576]);
    await vmailDb.query(
      `INSERT INTO forwardings (address, forwarding, domain, dest_domain, is_forwarding, active) VALUES ($1, $1, $2, $2, 0, 1) ON CONFLICT DO NOTHING`,
      [email, domain]
    );
    res.json({ success: true, data: { email, domain, quota, created: new Date() } });
  } catch (error) {
    console.error('Create mailbox error:', error);
    res.status(500).json({ success: false, error: 'Failed to create mailbox' });
  }
});

// PUT /mailbox/:email - Update name and quota
router.put('/mailbox/:email', superAdminAuth, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const { first_name, last_name, quota } = req.body;
    const name = `${first_name || ''} ${last_name || ''}`.trim();
    const result = await vmailDb.query(
      'UPDATE mailbox SET name=$1, first_name=$2, last_name=$3, quota=$4 WHERE username=$5 RETURNING username, name, quota',
      [name, first_name || '', last_name || '', quota * 1048576, email]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update mailbox' });
  }
});

// DELETE /mailbox/:email - Permanent delete
router.delete('/mailbox/permanent/:email', superAdminAuth, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    await vmailDb.query('DELETE FROM forwardings WHERE address=$1', [email]);
    const result = await vmailDb.query('DELETE FROM mailbox WHERE username=$1 RETURNING username', [email]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, message: `Mailbox ${email} permanently deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete mailbox' });
  }
});

// DELETE /mailbox/:email - Deactivate
router.delete('/mailbox/:email', superAdminAuth, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const result = await vmailDb.query('UPDATE mailbox SET active = 0 WHERE username = $1 RETURNING username', [email]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, message: `Mailbox ${email} deactivated` });
  } catch (error) {
    console.error('Delete mailbox error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete mailbox' });
  }
});

// GET /mailbox/aliases
router.get('/mailbox/aliases', superAdminAuth, async (req, res) => {
  try {
    const { domain } = req.query;
    let where = 'WHERE is_alias=1';
    const params = [];
    if (domain) { where += ' AND domain=$1'; params.push(domain); }
    const result = await vmailDb.query(
      `SELECT id, address, forwarding, domain, active FROM forwardings ${where} ORDER BY address`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /mailbox/aliases
router.post('/mailbox/aliases', superAdminAuth, async (req, res) => {
  try {
    const { address, forwarding, domain } = req.body;
    if (!address || !forwarding || !domain) return res.status(400).json({ success: false, error: 'address, forwarding, domain required' });
    const domainCheck = await vmailDb.query('SELECT domain FROM domain WHERE domain=$1 AND active=1', [domain]);
    if (!domainCheck.rows.length) return res.status(400).json({ success: false, error: `Domain '${domain}' not registered` });
    const dest_domain = forwarding.split('@')[1] || domain;
    await vmailDb.query(
      `INSERT INTO forwardings (address, forwarding, domain, dest_domain, is_alias, active) VALUES ($1,$2,$3,$4,1,1)`,
      [address, forwarding, domain, dest_domain]
    );
    res.json({ success: true, data: { address, forwarding, domain } });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ success: false, error: 'Alias already exists' });
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /mailbox/aliases/:id
router.delete('/mailbox/aliases/:id', superAdminAuth, async (req, res) => {
  try {
    const result = await vmailDb.query('DELETE FROM forwardings WHERE id=$1 AND is_alias=1 RETURNING id, address', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Alias not found' });
    res.json({ success: true, message: `Alias ${result.rows[0].address} deleted` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /mailbox/reactivate
router.post('/mailbox/reactivate', superAdminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'email required' });
    const result = await vmailDb.query('UPDATE mailbox SET active = 1 WHERE username = $1 RETURNING username', [email]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, message: `Mailbox ${email} reactivated` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reactivate mailbox' });
  }
});

// POST /mailbox/reset-password
router.post('/mailbox/reset-password', superAdminAuth, async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) return res.status(400).json({ success: false, error: 'email and new_password required' });
    const hashedPwd = hashMailPassword(new_password);
    const result = await vmailDb.query(
      'UPDATE mailbox SET password = $1, passwordlastchange = NOW() WHERE username = $2 RETURNING username',
      [hashedPwd, email]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// ==================== CUSTOM DOMAIN ====================

const crypto = require('crypto');
const dns = require('dns').promises;

// POST /tenants/:id/domain/setup - Add custom domain, get verification token
router.post('/tenants/:id/domain/setup', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { custom_domain } = req.body;
    if (!custom_domain) return res.status(400).json({ success: false, error: 'custom_domain required' });

    const cleanDomain = custom_domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Check domain not already used by another tenant
    const existing = await db.query(
      'SELECT id FROM tenant_companies WHERE custom_domain = $1 AND id != $2',
      [cleanDomain, id]
    );
    if (existing.rows.length) return res.status(400).json({ success: false, error: 'Domain already in use by another tenant' });

    const verifyToken = `ssgzone-verify=${crypto.randomBytes(16).toString('hex')}`;

    await db.query(
      `UPDATE tenant_companies SET custom_domain=$1, domain_verify_token=$2, domain_status='pending', domain_verified=FALSE WHERE id=$3`,
      [cleanDomain, verifyToken, id]
    );

    res.json({
      success: true,
      data: {
        custom_domain: cleanDomain,
        domain_status: 'pending',
        verification: {
          type: 'TXT',
          name: `_ssgzone-verify.${cleanDomain}`,
          value: verifyToken,
          instructions: [
            `1. Go to your DNS provider for ${cleanDomain}`,
            `2. Add a TXT record: Name = _ssgzone-verify, Value = ${verifyToken}`,
            `3. Wait 5-10 minutes for DNS propagation`,
            `4. Call the verify endpoint to confirm`
          ],
          mx_records: [
            { type: 'MX', name: cleanDomain, value: 'mail.ssgzone.in', priority: 10 }
          ],
          spf_record: {
            type: 'TXT', name: cleanDomain,
            value: 'v=spf1 include:ssgzone.in ~all'
          }
        }
      }
    });
  } catch (error) {
    console.error('Domain setup error:', error);
    res.status(500).json({ success: false, error: 'Failed to setup domain' });
  }
});

// POST /tenants/:id/domain/verify - Verify DNS TXT record
router.post('/tenants/:id/domain/verify', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await db.query(
      'SELECT custom_domain, domain_verify_token, domain_status FROM tenant_companies WHERE id = $1',
      [id]
    );
    if (!tenant.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });

    const { custom_domain, domain_verify_token, domain_status } = tenant.rows[0];
    if (!custom_domain) return res.status(400).json({ success: false, error: 'No domain setup found' });
    if (domain_status === 'verified') return res.json({ success: true, message: 'Domain already verified', domain_status: 'verified' });

    // Check TXT record
    let verified = false;
    try {
      const records = await dns.resolveTxt(`_ssgzone-verify.${custom_domain}`);
      verified = records.flat().includes(domain_verify_token);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'TXT record not found. DNS may not have propagated yet. Try again in a few minutes.' });
    }

    if (!verified) return res.status(400).json({ success: false, error: 'TXT record value does not match. Please check your DNS settings.' });

    // Add domain to iRedMail vmail database
    await vmailDb.query(
      `INSERT INTO domain (domain, description, transport, active) VALUES ($1, $2, 'dovecot', 1) ON CONFLICT (domain) DO UPDATE SET active=1`,
      [custom_domain, `Custom domain for tenant ${id}`]
    );

    // Update tenant status
    await db.query(
      `UPDATE tenant_companies SET domain_verified=TRUE, domain_status='verified' WHERE id=$1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Domain verified successfully!',
      domain_status: 'verified',
      next_steps: [
        `Update your MX record: ${custom_domain} → mail.ssgzone.in (priority 10)`,
        `Add SPF record: v=spf1 include:ssgzone.in ~all`,
        'Mailboxes can now be created on this domain'
      ]
    });
  } catch (error) {
    console.error('Domain verify error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify domain' });
  }
});

// GET /tenants/:id/domain/status - Get domain status
router.get('/tenants/:id/domain/status', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT custom_domain, domain_verified, domain_verify_token, domain_status FROM tenant_companies WHERE id = $1',
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch domain status' });
  }
});

// DELETE /tenants/:id/domain - Remove custom domain
router.delete('/tenants/:id/domain', superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await db.query('SELECT custom_domain FROM tenant_companies WHERE id=$1', [id]);
    if (!tenant.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });

    const { custom_domain } = tenant.rows[0];
    if (custom_domain) {
      await vmailDb.query('UPDATE domain SET active=0 WHERE domain=$1', [custom_domain]);
    }

    await db.query(
      `UPDATE tenant_companies SET custom_domain=NULL, domain_verified=FALSE, domain_verify_token=NULL, domain_status='none' WHERE id=$1`,
      [id]
    );
    res.json({ success: true, message: 'Custom domain removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove domain' });
  }
});

// ==================== BRANDING ====================

// Serve uploaded branding files statically - add in server.js separately
// GET /branding
router.get('/branding', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM platform_branding ORDER BY id LIMIT 1');
    res.json({ success: true, data: result.rows[0] || { platform_name: 'SSGzone', primary_color: '#4f46e5', tagline: 'Mail Platform', from_name: 'SSGzone', from_email: 'noreply@ssgzone.in' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /branding - Update branding settings
router.put('/branding', superAdminAuth, async (req, res) => {
  try {
    const { platform_name, primary_color, secondary_color, sidebar_color, header_color, sidebar_text_color, header_text_color, font_family, font_size, tagline, from_name, from_email, email_footer, admin_alert_email, default_max_users, default_mailbox_quota, session_timeout, password_min_length } = req.body;
    const result = await db.query(
      `UPDATE platform_branding SET 
        platform_name=$1, primary_color=$2, secondary_color=$3, tagline=$4,
        from_name=$5, from_email=$6, email_footer=$7, admin_alert_email=$8,
        default_max_users=$9, default_mailbox_quota=$10, session_timeout=$11,
        password_min_length=$12, sidebar_color=$13, header_color=$14,
        sidebar_text_color=$15, header_text_color=$16, font_family=$17, font_size=$18,
        updated_at=NOW()
       WHERE id=(SELECT id FROM platform_branding ORDER BY id LIMIT 1) RETURNING *`,
      [platform_name, primary_color, secondary_color, tagline, from_name, from_email, email_footer, admin_alert_email, default_max_users, default_mailbox_quota, session_timeout, password_min_length, sidebar_color || null, header_color || null, sidebar_text_color || null, header_text_color || null, font_family || null, font_size || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /branding/logo - Upload logo
router.post('/branding/logo', superAdminAuth, uploadBranding.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const logoUrl = `https://api.ssgzone.in/uploads/branding/${req.file.filename}`;
    await db.query('UPDATE platform_branding SET logo_url=$1, updated_at=NOW() WHERE id=(SELECT id FROM platform_branding ORDER BY id LIMIT 1)', [logoUrl]);
    res.json({ success: true, data: { logo_url: logoUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /branding/favicon - Upload favicon
router.post('/branding/favicon', superAdminAuth, uploadBranding.single('favicon'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const faviconUrl = `https://api.ssgzone.in/uploads/branding/${req.file.filename}`;
    await db.query('UPDATE platform_branding SET favicon_url=$1, updated_at=NOW() WHERE id=(SELECT id FROM platform_branding ORDER BY id LIMIT 1)', [faviconUrl]);
    res.json({ success: true, data: { favicon_url: faviconUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PLATFORM ADMINS ====================

// GET /admins
router.get('/admins', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, full_name, role, permissions, assigned_tenants, status, last_login, created_at FROM platform_admins ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch admins' });
  }
});

// POST /admins
router.post('/admins', superAdminAuth, async (req, res) => {
  try {
    const { username, email, full_name, password, role = 'admin', permissions, assigned_tenants = [] } = req.body;
    if (!username || !email || !full_name || !password)
      return res.status(400).json({ success: false, error: 'username, email, full_name, password required' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultPermissions = permissions || { tenants: true, users: true, mailboxes: true, reports: true };
    const result = await db.query(
      `INSERT INTO platform_admins (username, email, full_name, password_hash, role, permissions, assigned_tenants, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, full_name, role, permissions, assigned_tenants, status, created_at`,
      [username, email, full_name, hashedPassword, role, JSON.stringify(defaultPermissions), assigned_tenants, req.admin.adminId]
    );
    sendTemplateEmail(
      'admin_welcome',
      `"SSGzone" <noreply@ssgzone.in>`,
      email,
      { name: full_name, username, password, role, login_url: 'https://ssgzone.in/dashboard/admin' }
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ success: false, error: 'Username or email already exists' });
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

// PUT /admins/:id
router.put('/admins/:id', superAdminAuth, async (req, res) => {
  try {
    const { full_name, role, permissions, assigned_tenants, status } = req.body;
    const result = await db.query(
      `UPDATE platform_admins SET full_name=$1, role=$2, permissions=$3, assigned_tenants=$4, status=$5, updated_at=NOW()
       WHERE id=$6 RETURNING id, username, email, full_name, role, permissions, assigned_tenants, status`,
      [full_name, role, JSON.stringify(permissions), assigned_tenants, status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Admin not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update admin' });
  }
});

// DELETE /admins/:id
router.delete('/admins/:id', superAdminAuth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM platform_admins WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Admin not found' });
    res.json({ success: true, message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete admin' });
  }
});

// PATCH /admins/:id/reset-password
router.patch('/admins/:id/reset-password', superAdminAuth, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password) return res.status(400).json({ success: false, error: 'new_password required' });
    const hashedPassword = await bcrypt.hash(new_password, 10);
    const result = await db.query(
      'UPDATE platform_admins SET password_hash=$1, updated_at=NOW() WHERE id=$2 RETURNING id, username, email, full_name',
      [hashedPassword, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Admin not found' });
    sendTemplateEmail(
      'password_reset',
      `"SSGzone" <noreply@ssgzone.in>`,
      result.rows[0].email,
      { name: result.rows[0].full_name, username: result.rows[0].username, password: new_password }
    );
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// POST /admins/auth/login
router.post('/admins/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'username and password required' });
    const result = await db.query(
      `SELECT * FROM platform_admins WHERE (username=$1 OR email=$1) AND status='active'`, [username]
    );
    if (!result.rows.length) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    await db.query('UPDATE platform_admins SET last_login=NOW() WHERE id=$1', [admin.id]);
    const token = jwt.sign(
      { type: 'platform_admin', adminId: admin.id, username: admin.username, role: admin.role, permissions: admin.permissions },
      process.env.JWT_SECRET || 'super-admin-secret',
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      data: { token, admin: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, role: admin.role, permissions: admin.permissions } }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

module.exports = router;