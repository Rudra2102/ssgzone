const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const router = express.Router();

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'academy'
});

// ==================== AUTH ====================

// POST /auth/login - SaaS Admin login (uses tenant_users with role=admin scoped to saas)
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password, saas_slug } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'username and password required' });

    // Find saas app
    let saasQuery = 'SELECT id, saas_name, saas_slug FROM saas_applications WHERE status=$1';
    const saasParams = ['active'];
    if (saas_slug) { saasQuery += ' AND saas_slug=$2'; saasParams.push(saas_slug); }

    // Find admin in platform_admins or super_admins with saas access
    // SaaS Admin is a platform_admin with assigned saas_app_id
    const result = await db.query(`
      SELECT pa.*, sa.saas_name, sa.saas_slug, sa.id as saas_id
      FROM platform_admins pa
      JOIN saas_applications sa ON sa.id = ANY(
        SELECT unnest(ARRAY(SELECT (jsonb_array_elements_text(pa.permissions->'saas_apps'))::integer))
      )
      WHERE (pa.username=$1 OR pa.email=$1) AND pa.status='active'
      LIMIT 1
    `, [username]).catch(() => ({ rows: [] }));

    // Fallback: check if it's a direct saas_admin role in platform_admins
    let admin, saasApp;
    if (!result.rows.length) {
      const fallback = await db.query(
        `SELECT pa.*, sa.saas_name, sa.saas_slug, sa.id as saas_id
         FROM platform_admins pa
         CROSS JOIN saas_applications sa
         WHERE (pa.username=$1 OR pa.email=$1) AND pa.status='active' AND pa.role='saas_admin'
         LIMIT 1`,
        [username]
      ).catch(() => ({ rows: [] }));
      if (!fallback.rows.length) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      admin = fallback.rows[0];
      saasApp = { id: admin.saas_id, name: admin.saas_name, slug: admin.saas_slug };
    } else {
      admin = result.rows[0];
      saasApp = { id: admin.saas_id, name: admin.saas_name, slug: admin.saas_slug };
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    await db.query('UPDATE platform_admins SET last_login=NOW() WHERE id=$1', [admin.id]);

    const token = jwt.sign(
      { type: 'saas_admin', adminId: admin.id, saasAppId: saasApp.id, saasSlug: saasApp.slug, username: admin.username },
      process.env.JWT_SECRET || 'super-admin-secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, saas_name: saasApp.name, saas_slug: saasApp.slug }
      }
    });
  } catch (error) {
    console.error('SaaS admin login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Auth middleware
const saasAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'Token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
    if (decoded.type !== 'saas_admin') return res.status(403).json({ success: false, error: 'SaaS admin access required' });
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ==================== DASHBOARD ====================

router.get('/dashboard/stats', saasAdminAuth, async (req, res) => {
  try {
    const saasAppId = req.admin.saasAppId;

    const [tenants, users, features] = await Promise.all([
      db.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='active' THEN 1 END) as active FROM tenant_companies WHERE saas_app_id=$1`, [saasAppId]),
      db.query(`SELECT COUNT(*) as total FROM tenant_users tu JOIN tenant_companies tc ON tu.tenant_id=tc.id WHERE tc.saas_app_id=$1 AND tu.status='active'`, [saasAppId]),
      db.query(`SELECT * FROM saas_features WHERE saas_app_id=$1`, [saasAppId])
    ]);

    res.json({
      success: true,
      data: {
        totalTenants: parseInt(tenants.rows[0].total),
        activeTenants: parseInt(tenants.rows[0].active),
        totalUsers: parseInt(users.rows[0].total),
        features: features.rows[0] || {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TENANTS ====================

// GET /tenants - Only this SaaS app's tenants
router.get('/tenants', saasAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (page - 1) * limit;
    let where = ['tc.saas_app_id=$1'];
    const params = [req.admin.saasAppId];
    let idx = 2;

    if (search) { where.push(`(tc.company_name ILIKE $${idx} OR tc.company_slug ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (status) { where.push(`tc.status=$${idx}`); params.push(status); idx++; }

    const result = await db.query(`
      SELECT tc.id, tc.company_name, tc.company_slug, tc.domain, tc.admin_name, tc.admin_email,
             tc.max_users, tc.plan_type, tc.status, tc.created_at,
             tc.custom_domain, tc.domain_verified,
             COUNT(tu.id) as user_count,
             tf.email, tf.chat, tf.drive, tf.notifications
      FROM tenant_companies tc
      LEFT JOIN tenant_users tu ON tc.id=tu.tenant_id AND tu.status='active'
      LEFT JOIN tenant_features tf ON tc.id=tf.tenant_id
      WHERE ${where.join(' AND ')}
      GROUP BY tc.id, tf.email, tf.chat, tf.drive, tf.notifications
      ORDER BY tc.created_at DESC
      LIMIT $${idx} OFFSET $${idx+1}
    `, [...params, limit, offset]);

    const count = await db.query(`SELECT COUNT(*) FROM tenant_companies tc WHERE ${where.join(' AND ')}`, params);

    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /tenants - Create tenant under this SaaS
router.post('/tenants', saasAdminAuth, async (req, res) => {
  try {
    const { company_name, slug, admin_name, admin_email, max_users = 50 } = req.body;
    if (!company_name || !slug || !admin_name) return res.status(400).json({ success: false, error: 'company_name, slug, admin_name required' });

    const saasResult = await db.query('SELECT saas_slug FROM saas_applications WHERE id=$1', [req.admin.saasAppId]);
    const saasSlug = saasResult.rows[0].saas_slug;
    const domain = `${slug}.${saasSlug}.ssgzone.in`;
    const tenantAdminEmail = admin_email || `admin@${domain}`;

    const tenant = await db.query(`
      INSERT INTO tenant_companies (saas_app_id, company_name, company_slug, domain, admin_name, admin_email, max_users)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, company_name, company_slug, domain, admin_name, admin_email, max_users, created_at
    `, [req.admin.saasAppId, company_name, slug, domain, admin_name, tenantAdminEmail, max_users]);

    const newTenant = tenant.rows[0];

    // Create admin user
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    await db.query(`
      INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, role, password_hash)
      VALUES ($1, 'admin', $2, $3, '', 'admin', $4)
    `, [newTenant.id, tenantAdminEmail, admin_name.split(' ')[0], hashedPassword]);

    // Copy SaaS features to tenant
    await db.query(`
      INSERT INTO tenant_features (tenant_id, email, chat, drive, video, notifications, whatsapp, max_users)
      SELECT $1, email, chat, drive, video, notifications, whatsapp, $2
      FROM saas_features WHERE saas_app_id=$3
      ON CONFLICT (tenant_id) DO NOTHING
    `, [newTenant.id, max_users, req.admin.saasAppId]);

    await db.query(`INSERT INTO tenant_communication_settings (tenant_id) VALUES ($1)`, [newTenant.id]);

    res.json({ success: true, data: { ...newTenant, admin_credentials: { username: 'admin', password: defaultPassword } } });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ success: false, error: 'Tenant slug already exists' });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TENANT FEATURES ====================

// GET /tenants/:id/features
router.get('/tenants/:id/features', saasAdminAuth, async (req, res) => {
  try {
    // Verify tenant belongs to this SaaS
    const check = await db.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [req.params.id, req.admin.saasAppId]);
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });

    const result = await db.query('SELECT * FROM tenant_features WHERE tenant_id=$1', [req.params.id]);
    const saasFeatures = await db.query('SELECT * FROM saas_features WHERE saas_app_id=$1', [req.admin.saasAppId]);

    res.json({ success: true, data: result.rows[0] || {}, saas_limits: saasFeatures.rows[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /tenants/:id/features - Update tenant features (cannot exceed SaaS limits)
router.put('/tenants/:id/features', saasAdminAuth, async (req, res) => {
  try {
    const check = await db.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [req.params.id, req.admin.saasAppId]);
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });

    // Get SaaS limits
    const saasFeatures = await db.query('SELECT * FROM saas_features WHERE saas_app_id=$1', [req.admin.saasAppId]);
    const limits = saasFeatures.rows[0] || {};

    const { email, chat, drive, video, notifications, whatsapp, max_users, max_storage_gb } = req.body;

    // Cannot grant more than SaaS has
    const safeFeatures = {
      email: limits.email ? (email ?? true) : false,
      chat: limits.chat ? (chat ?? false) : false,
      drive: limits.drive ? (drive ?? false) : false,
      video: limits.video ? (video ?? false) : false,
      notifications: limits.notifications ? (notifications ?? true) : false,
      whatsapp: limits.whatsapp ? (whatsapp ?? false) : false,
      max_users: Math.min(max_users || 50, limits.max_users || 100),
      max_storage_gb: Math.min(max_storage_gb || 5, limits.max_storage_gb || 10)
    };

    const result = await db.query(`
      INSERT INTO tenant_features (tenant_id, email, chat, drive, video, notifications, whatsapp, max_users, max_storage_gb)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (tenant_id) DO UPDATE SET
        email=$2, chat=$3, drive=$4, video=$5, notifications=$6, whatsapp=$7,
        max_users=$8, max_storage_gb=$9, updated_at=NOW()
      RETURNING *
    `, [req.params.id, safeFeatures.email, safeFeatures.chat, safeFeatures.drive,
        safeFeatures.video, safeFeatures.notifications, safeFeatures.whatsapp,
        safeFeatures.max_users, safeFeatures.max_storage_gb]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SAAS FEATURES ====================

// GET /features - This SaaS app's features
router.get('/features', saasAdminAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM saas_features WHERE saas_app_id=$1', [req.admin.saasAppId]);
    res.json({ success: true, data: result.rows[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== USERS ====================

// GET /users - All users under this SaaS (read-only view)
router.get('/users', saasAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, tenant_id, search } = req.query;
    const offset = (page - 1) * limit;
    let where = ['tc.saas_app_id=$1'];
    const params = [req.admin.saasAppId];
    let idx = 2;

    if (tenant_id) { where.push(`tu.tenant_id=$${idx}::uuid`); params.push(tenant_id); idx++; }
    if (search) { where.push(`(tu.username ILIKE $${idx} OR tu.email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const result = await db.query(`
      SELECT tu.id, tu.username, tu.email, tu.first_name, tu.last_name,
             tu.role, tu.status, tu.created_at, tu.last_login,
             tc.company_name as tenant_name
      FROM tenant_users tu
      JOIN tenant_companies tc ON tu.tenant_id=tc.id
      WHERE ${where.join(' AND ')}
      ORDER BY tu.created_at DESC
      LIMIT $${idx} OFFSET $${idx+1}
    `, [...params, limit, offset]);

    const count = await db.query(`SELECT COUNT(*) FROM tenant_users tu JOIN tenant_companies tc ON tu.tenant_id=tc.id WHERE ${where.join(' AND ')}`, params);

    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /tenants/:id/status - Activate/suspend tenant
router.patch('/tenants/:id/status', saasAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
    const check = await db.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [req.params.id, req.admin.saasAppId]);
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const result = await db.query('UPDATE tenant_companies SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, company_name, status', [status, req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
