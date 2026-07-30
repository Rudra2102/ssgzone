const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const auth = (allowedTypes) => (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!allowedTypes.includes(payload.type)) return res.status(403).json({ success: false, error: 'Forbidden' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const superAdminAuth = auth(['super_admin']);
const saasAdminAuth  = auth(['saas_admin']);
const tenantAdminAuth = auth(['tenant_admin']);

// ─── SUPER ADMIN — Billing Plans CRUD ────────────────────────────────────────

// GET /api/v1/billing/super-admin/plans?saas_app_id=
router.get('/super-admin/plans', superAdminAuth, async (req, res) => {
  try {
    const { saas_app_id } = req.query;
    const where = saas_app_id ? 'WHERE p.saas_app_id = $1' : '';
    const params = saas_app_id ? [saas_app_id] : [];
    const result = await pool.query(`
      SELECT p.*, s.name AS saas_name,
        (SELECT COUNT(*) FROM tenant_billing tb WHERE tb.plan_id = p.id) AS tenant_count
      FROM saas_billing_plans p
      JOIN saas_applications s ON s.id = p.saas_app_id
      ${where}
      ORDER BY p.saas_app_id, p.sort_order, p.created_at
    `, saas_app_id ? [parseInt(saas_app_id)] : []);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/super-admin/plans
router.post('/super-admin/plans', superAdminAuth, async (req, res) => {
  try {
    const { saas_app_id, name, slug, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, sort_order } = req.body;
    if (!saas_app_id || !name || !slug) return res.status(400).json({ success: false, error: 'saas_app_id, name, slug required' });
    const result = await pool.query(`
      INSERT INTO saas_billing_plans (saas_app_id, name, slug, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, sort_order, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [parseInt(saas_app_id), name, slug.toLowerCase(), price_monthly || 0, price_yearly || 0, currency || 'INR', max_users || 10, max_storage_gb || 5, max_emails_per_month || 1000, JSON.stringify(features || {}), sort_order || 0, req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Plan slug already exists for this SaaS app' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/billing/super-admin/plans/:id
router.put('/super-admin/plans/:id', superAdminAuth, async (req, res) => {
  try {
    const { name, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, is_active, sort_order } = req.body;
    const result = await pool.query(`
      UPDATE saas_billing_plans SET
        name=$1, price_monthly=$2, price_yearly=$3, currency=$4,
        max_users=$5, max_storage_gb=$6, max_emails_per_month=$7,
        features=$8, is_active=$9, sort_order=$10, updated_at=NOW()
      WHERE id=$11 RETURNING *
    `, [name, price_monthly, price_yearly, currency || 'INR', max_users, max_storage_gb, max_emails_per_month, JSON.stringify(features || {}), is_active !== false, sort_order || 0, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/billing/super-admin/plans/:id
router.delete('/super-admin/plans/:id', superAdminAuth, async (req, res) => {
  try {
    const inUse = await pool.query('SELECT COUNT(*) FROM tenant_billing WHERE plan_id=$1', [req.params.id]);
    if (parseInt(inUse.rows[0].count) > 0) return res.status(400).json({ success: false, error: 'Plan is assigned to tenants. Reassign them first.' });
    await pool.query('DELETE FROM saas_billing_plans WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/billing/super-admin/overview — all tenant billing across platform
router.get('/super-admin/overview', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tc.id, tc.company_name, tc.company_slug,
        s.name AS saas_name,
        p.name AS plan_name, p.price_monthly, p.currency,
        tb.status AS billing_status, tb.billing_cycle,
        tb.custom_price, tb.next_billing_date, tb.trial_ends_at,
        tb.current_period_end
      FROM tenant_companies tc
      JOIN saas_applications s ON s.id = tc.saas_app_id
      LEFT JOIN tenant_billing tb ON tb.tenant_id = tc.id
      LEFT JOIN saas_billing_plans p ON p.id = tb.plan_id
      ORDER BY s.name, tc.company_name
    `);
    const stats = await pool.query(`
      SELECT
        COUNT(DISTINCT tb.tenant_id) FILTER (WHERE tb.status='active') AS active_subscriptions,
        COUNT(DISTINCT tb.tenant_id) FILTER (WHERE tb.status='trial') AS trials,
        COUNT(DISTINCT tb.tenant_id) FILTER (WHERE tb.status='past_due') AS past_due,
        COUNT(DISTINCT tc.id) FILTER (WHERE tb.id IS NULL) AS unassigned
      FROM tenant_companies tc
      LEFT JOIN tenant_billing tb ON tb.tenant_id = tc.id
    `);
    res.json({ success: true, data: result.rows, stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SAAS ADMIN — Tenant Billing Management ──────────────────────────────────

// GET /api/v1/billing/saas-admin/plans — plans for this SaaS app
router.get('/saas-admin/plans', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM tenant_billing tb WHERE tb.plan_id = p.id) AS tenant_count
      FROM saas_billing_plans p
      WHERE p.saas_app_id = $1 AND p.is_active = TRUE
      ORDER BY p.sort_order, p.price_monthly
    `, [parseInt(req.user.saas_id)]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/billing/saas-admin/tenants — billing status of all tenants
router.get('/saas-admin/tenants', saasAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tc.id, tc.company_name, tc.company_slug,
        p.id AS plan_id, p.name AS plan_name, p.price_monthly, p.currency AS plan_currency,
        tb.id AS billing_id, tb.status AS billing_status, tb.billing_cycle,
        tb.custom_price, tb.currency, tb.next_billing_date,
        tb.trial_ends_at, tb.current_period_start, tb.current_period_end, tb.notes
      FROM tenant_companies tc
      LEFT JOIN tenant_billing tb ON tb.tenant_id = tc.id
      LEFT JOIN saas_billing_plans p ON p.id = tb.plan_id
      WHERE tc.saas_app_id = $1
      ORDER BY tc.company_name
    `, [parseInt(req.user.saas_id)]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/saas-admin/tenants/:tenantId/assign — assign/update plan
router.post('/saas-admin/tenants/:tenantId/assign', saasAdminAuth, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { plan_id, billing_cycle, custom_price, currency, status, next_billing_date, trial_ends_at, notes } = req.body;

    // Verify tenant belongs to this SaaS
    const tenantCheck = await pool.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [tenantId, parseInt(req.user.saas_id)]);
    if (!tenantCheck.rows.length) return res.status(403).json({ success: false, error: 'Tenant not found in your SaaS' });

    // Verify plan belongs to this SaaS (if provided)
    if (plan_id) {
      const planCheck = await pool.query('SELECT id FROM saas_billing_plans WHERE id=$1 AND saas_app_id=$2', [plan_id, parseInt(req.user.saas_id)]);
      if (!planCheck.rows.length) return res.status(403).json({ success: false, error: 'Plan not found in your SaaS' });
    }

    const periodStart = new Date();
    const periodEnd = next_billing_date ? new Date(next_billing_date) : (() => {
      const d = new Date();
      billing_cycle === 'yearly' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
      return d;
    })();

    const result = await pool.query(`
      INSERT INTO tenant_billing (tenant_id, plan_id, billing_cycle, custom_price, currency, status, trial_ends_at, current_period_start, current_period_end, next_billing_date, notes, assigned_by_saas_admin)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE)
      ON CONFLICT (tenant_id) DO UPDATE SET
        plan_id=$2, billing_cycle=$3, custom_price=$4, currency=$5,
        status=$6, trial_ends_at=$7, current_period_start=$8,
        current_period_end=$9, next_billing_date=$10, notes=$11,
        assigned_by_saas_admin=TRUE, updated_at=NOW()
      RETURNING *
    `, [tenantId, plan_id || null, billing_cycle || 'monthly', custom_price || null, currency || 'INR', status || 'active', trial_ends_at || null, periodStart, periodEnd, periodEnd, notes || null]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/billing/saas-admin/tenants/:tenantId/billing — remove billing assignment
router.delete('/saas-admin/tenants/:tenantId/billing', saasAdminAuth, async (req, res) => {
  try {
    const tenantCheck = await pool.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [req.params.tenantId, parseInt(req.user.saas_id)]);
    if (!tenantCheck.rows.length) return res.status(403).json({ success: false, error: 'Tenant not found in your SaaS' });
    await pool.query('DELETE FROM tenant_billing WHERE tenant_id=$1', [req.params.tenantId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/billing/saas-admin/invoices/:tenantId
router.get('/saas-admin/invoices/:tenantId', saasAdminAuth, async (req, res) => {
  try {
    const tenantCheck = await pool.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [req.params.tenantId, parseInt(req.user.saas_id)]);
    if (!tenantCheck.rows.length) return res.status(403).json({ success: false, error: 'Forbidden' });
    const result = await pool.query(`
      SELECT i.*, p.name AS plan_name FROM billing_invoices i
      LEFT JOIN saas_billing_plans p ON p.id = i.plan_id
      WHERE i.tenant_id=$1 ORDER BY i.created_at DESC LIMIT 24
    `, [req.params.tenantId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/saas-admin/invoices — create invoice
router.post('/saas-admin/invoices', saasAdminAuth, async (req, res) => {
  try {
    const { tenant_id, plan_id, amount, currency, billing_period_start, billing_period_end, status, notes } = req.body;
    if (!tenant_id || !amount || !billing_period_start || !billing_period_end) return res.status(400).json({ success: false, error: 'tenant_id, amount, billing_period_start, billing_period_end required' });
    const tenantCheck = await pool.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [tenant_id, parseInt(req.user.saas_id)]);
    if (!tenantCheck.rows.length) return res.status(403).json({ success: false, error: 'Forbidden' });
    const result = await pool.query(`
      INSERT INTO billing_invoices (tenant_id, plan_id, amount, currency, billing_period_start, billing_period_end, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [tenant_id, plan_id || null, amount, currency || 'INR', billing_period_start, billing_period_end, status || 'pending', notes || null]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/billing/saas-admin/invoices/:id/status
router.patch('/saas-admin/invoices/:id/status', saasAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(`
      UPDATE billing_invoices SET status=$1, paid_at=CASE WHEN $1='paid' THEN NOW() ELSE paid_at END
      WHERE id=$2 RETURNING *
    `, [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TENANT ADMIN — Read-only billing view ───────────────────────────────────

// GET /api/v1/billing/tenant-admin/current
router.get('/tenant-admin/current', tenantAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        tc.company_name, tc.max_users,
        p.name AS plan_name, p.slug AS plan_slug, p.price_monthly, p.price_yearly,
        p.currency AS plan_currency, p.max_users AS plan_max_users,
        p.max_storage_gb, p.max_emails_per_month, p.features,
        tb.status AS billing_status, tb.billing_cycle,
        tb.custom_price, tb.currency,
        tb.trial_ends_at, tb.next_billing_date,
        tb.current_period_start, tb.current_period_end,
        (SELECT COUNT(*) FROM tenant_users WHERE tenant_id=tc.id AND status='active') AS active_users
      FROM tenant_companies tc
      LEFT JOIN tenant_billing tb ON tb.tenant_id = tc.id
      LEFT JOIN saas_billing_plans p ON p.id = tb.plan_id
      WHERE tc.id = $1
    `, [req.user.tenant_id]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/billing/tenant-admin/invoices
router.get('/tenant-admin/invoices', tenantAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.name AS plan_name FROM billing_invoices i
      LEFT JOIN saas_billing_plans p ON p.id = i.plan_id
      WHERE i.tenant_id=$1 ORDER BY i.created_at DESC LIMIT 24
    `, [req.user.tenant_id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
