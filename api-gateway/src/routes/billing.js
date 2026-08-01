const express = require('express');
const pool = require('../services/DatabaseService');
const router = express.Router();
const jwt = require('jsonwebtoken');

// ─── Auth ─────────────────────────────────────────────────────────────────────

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

// ─── Helper: get SaaS subscription quota ─────────────────────────────────────

async function getSaasQuota(saasAppId) {
  const result = await pool.query(`
    SELECT ss.*, p.max_users, p.max_storage_gb, p.max_emails_per_month, p.features
    FROM saas_subscriptions ss
    JOIN saas_billing_plans p ON p.id = ss.plan_id
    WHERE ss.saas_app_id = $1 AND ss.status IN ('active', 'trial')
  `, [saasAppId]);
  return result.rows[0] || null;
}

async function getSaasUsedQuota(saasAppId) {
  const result = await pool.query(`
    SELECT
      COALESCE(SUM(tbp.max_users), 0) AS allocated_users,
      COALESCE(SUM(tbp.max_storage_gb), 0) AS allocated_storage_gb,
      COALESCE(SUM(tbp.max_emails_per_month), 0) AS allocated_emails
    FROM tenant_billing_plans tbp
    WHERE tbp.saas_app_id = $1 AND tbp.is_active = TRUE
  `, [saasAppId]);
  return result.rows[0];
}

// ─── SUPER ADMIN — SSGzone Billing Plans (what SSGzone offers to SaaS) ────────

// GET /api/v1/billing/super-admin/plans
router.get('/super-admin/plans', superAdminAuth, async (req, res) => {
  try {
    const { saas_app_id, standard } = req.query;
    let where = '', params = [];
    if (standard === 'true') {
      where = 'WHERE p.saas_app_id IS NULL';
    } else if (saas_app_id) {
      where = 'WHERE p.saas_app_id = $1';
      params = [parseInt(saas_app_id)];
    }
    const result = await pool.query(`
      SELECT p.*, COALESCE(s.saas_name, 'Standard') AS saas_name,
        (SELECT COUNT(*) FROM saas_subscriptions ss WHERE ss.plan_id = p.id) AS subscriber_count
      FROM saas_billing_plans p
      LEFT JOIN saas_applications s ON s.id = p.saas_app_id
      ${where}
      ORDER BY p.is_standard DESC, p.saas_app_id, p.sort_order, p.created_at
    `, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/super-admin/plans
router.post('/super-admin/plans', superAdminAuth, async (req, res) => {
  try {
    const { saas_app_id, name, slug, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, sort_order, is_standard } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, error: 'name and slug required' });
    if (!is_standard && !saas_app_id) return res.status(400).json({ success: false, error: 'saas_app_id required for non-standard plans' });
    const saasId = (is_standard || !saas_app_id) ? null : parseInt(saas_app_id);
    const result = await pool.query(`
      INSERT INTO saas_billing_plans (saas_app_id, name, slug, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, sort_order, is_standard, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [saasId, name, slug.toLowerCase(), price_monthly || 0, price_yearly || 0, currency || 'INR', max_users || 10, max_storage_gb || 5, max_emails_per_month || 1000, JSON.stringify(features || {}), sort_order || 0, !!is_standard, req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Plan slug already exists' });
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
    const inUse = await pool.query('SELECT COUNT(*) FROM saas_subscriptions WHERE plan_id=$1', [req.params.id]);
    if (parseInt(inUse.rows[0].count) > 0) return res.status(400).json({ success: false, error: 'Plan has active subscribers. Reassign them first.' });
    await pool.query('DELETE FROM saas_billing_plans WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SUPER ADMIN — SaaS Subscriptions (assign SSGzone plan to SaaS) ───────────

// GET /api/v1/billing/super-admin/subscriptions
router.get('/super-admin/subscriptions', superAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ss.*, s.saas_name, s.saas_slug,
        p.name AS plan_name, p.max_users, p.max_storage_gb, p.max_emails_per_month, p.features, p.currency AS plan_currency,
        (SELECT COUNT(*) FROM tenant_companies tc WHERE tc.saas_app_id = s.id) AS tenant_count,
        (SELECT COUNT(*) FROM tenant_billing_plans tbp WHERE tbp.saas_app_id = s.id AND tbp.is_active = TRUE) AS active_tenant_plans
      FROM saas_applications s
      LEFT JOIN saas_subscriptions ss ON ss.saas_app_id = s.id
      LEFT JOIN saas_billing_plans p ON p.id = ss.plan_id
      ORDER BY s.saas_name
    `);
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE ss.status = 'active') AS active,
        COUNT(*) FILTER (WHERE ss.status = 'trial') AS trial,
        COUNT(*) FILTER (WHERE ss.status = 'past_due') AS past_due,
        COUNT(s.id) FILTER (WHERE ss.id IS NULL) AS unsubscribed
      FROM saas_applications s
      LEFT JOIN saas_subscriptions ss ON ss.saas_app_id = s.id
    `);
    res.json({ success: true, data: result.rows, stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/super-admin/subscriptions — assign/update plan for a SaaS
router.post('/super-admin/subscriptions', superAdminAuth, async (req, res) => {
  try {
    const { saas_app_id, plan_id, billing_cycle, custom_price, currency, status, trial_ends_at, current_period_end, next_billing_date, notes } = req.body;
    if (!saas_app_id || !plan_id) return res.status(400).json({ success: false, error: 'saas_app_id and plan_id required' });

    const periodEnd = current_period_end ? new Date(current_period_end) : (() => {
      const d = new Date();
      billing_cycle === 'yearly' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
      return d;
    })();

    const result = await pool.query(`
      INSERT INTO saas_subscriptions (saas_app_id, plan_id, status, billing_cycle, custom_price, currency, trial_ends_at, current_period_start, current_period_end, next_billing_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9,$10)
      ON CONFLICT (saas_app_id) DO UPDATE SET
        plan_id=$2, status=$3, billing_cycle=$4, custom_price=$5, currency=$6,
        trial_ends_at=$7, current_period_start=NOW(), current_period_end=$8,
        next_billing_date=$9, notes=$10, updated_at=NOW()
      RETURNING *
    `, [parseInt(saas_app_id), plan_id, status || 'active', billing_cycle || 'monthly', custom_price || null, currency || 'INR', trial_ends_at || null, periodEnd, next_billing_date ? new Date(next_billing_date) : periodEnd, notes || null]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/billing/super-admin/subscriptions/:saasAppId
router.delete('/super-admin/subscriptions/:saasAppId', superAdminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM saas_subscriptions WHERE saas_app_id=$1', [parseInt(req.params.saasAppId)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SAAS ADMIN — Tenant Billing Plans (SaaS creates plans for its tenants) ───

// GET /api/v1/billing/saas-admin/quota — SaaS subscription + used quota
router.get('/saas-admin/quota', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const quota = await getSaasQuota(saasId);
    if (!quota) return res.json({ success: true, data: null, message: 'No active subscription' });
    const used = await getSaasUsedQuota(saasId);
    res.json({
      success: true,
      data: {
        subscription: quota,
        limits: { max_users: quota.max_users, max_storage_gb: quota.max_storage_gb, max_emails_per_month: quota.max_emails_per_month, features: quota.features },
        used: { users: parseInt(used.allocated_users), storage_gb: parseInt(used.allocated_storage_gb), emails: parseInt(used.allocated_emails) },
        remaining: {
          users: quota.max_users - parseInt(used.allocated_users),
          storage_gb: quota.max_storage_gb - parseInt(used.allocated_storage_gb),
          emails: quota.max_emails_per_month - parseInt(used.allocated_emails)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/billing/saas-admin/tenant-plans
router.get('/saas-admin/tenant-plans', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const result = await pool.query(`
      SELECT tbp.*,
        (SELECT COUNT(*) FROM tenant_subscriptions ts WHERE ts.tenant_plan_id = tbp.id) AS subscriber_count
      FROM tenant_billing_plans tbp
      WHERE tbp.saas_app_id = $1
      ORDER BY tbp.sort_order, tbp.price_monthly
    `, [saasId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/saas-admin/tenant-plans
router.post('/saas-admin/tenant-plans', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const { name, slug, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, sort_order } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, error: 'name and slug required' });

    // Validate against SaaS subscription quota
    const quota = await getSaasQuota(saasId);
    if (!quota) return res.status(403).json({ success: false, error: 'No active SSGzone subscription. Contact SSGzone support.' });

    const used = await getSaasUsedQuota(saasId);
    const reqUsers = parseInt(max_users) || 10;
    const reqStorage = parseInt(max_storage_gb) || 5;
    const reqEmails = parseInt(max_emails_per_month) || 1000;

    if (reqUsers > (quota.max_users - parseInt(used.allocated_users)))
      return res.status(400).json({ success: false, error: `Insufficient user quota. Available: ${quota.max_users - parseInt(used.allocated_users)}` });
    if (reqStorage > (quota.max_storage_gb - parseInt(used.allocated_storage_gb)))
      return res.status(400).json({ success: false, error: `Insufficient storage quota. Available: ${quota.max_storage_gb - parseInt(used.allocated_storage_gb)} GB` });
    if (reqEmails > (quota.max_emails_per_month - parseInt(used.allocated_emails)))
      return res.status(400).json({ success: false, error: `Insufficient email quota. Available: ${quota.max_emails_per_month - parseInt(used.allocated_emails)}` });

    // Validate features — only allow features that SaaS subscription includes
    const allowedFeatures = quota.features || {};
    const reqFeatures = features || {};
    const validatedFeatures = {};
    for (const [key, val] of Object.entries(reqFeatures)) {
      validatedFeatures[key] = val && (allowedFeatures[key] === true);
    }

    const result = await pool.query(`
      INSERT INTO tenant_billing_plans (saas_app_id, name, slug, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [saasId, name, slug.toLowerCase(), price_monthly || 0, price_yearly || 0, currency || 'INR', reqUsers, reqStorage, reqEmails, JSON.stringify(validatedFeatures), sort_order || 0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: 'Plan slug already exists' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/billing/saas-admin/tenant-plans/:id
router.put('/saas-admin/tenant-plans/:id', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const { name, price_monthly, price_yearly, currency, max_users, max_storage_gb, max_emails_per_month, features, is_active, sort_order } = req.body;

    // Verify plan belongs to this SaaS
    const existing = await pool.query('SELECT * FROM tenant_billing_plans WHERE id=$1 AND saas_app_id=$2', [req.params.id, saasId]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: 'Plan not found' });

    const quota = await getSaasQuota(saasId);
    if (!quota) return res.status(403).json({ success: false, error: 'No active SSGzone subscription' });

    // Validate features
    const allowedFeatures = quota.features || {};
    const reqFeatures = features || {};
    const validatedFeatures = {};
    for (const [key, val] of Object.entries(reqFeatures)) {
      validatedFeatures[key] = val && (allowedFeatures[key] === true);
    }

    const result = await pool.query(`
      UPDATE tenant_billing_plans SET
        name=$1, price_monthly=$2, price_yearly=$3, currency=$4,
        max_users=$5, max_storage_gb=$6, max_emails_per_month=$7,
        features=$8, is_active=$9, sort_order=$10, updated_at=NOW()
      WHERE id=$11 AND saas_app_id=$12 RETURNING *
    `, [name, price_monthly, price_yearly, currency || 'INR', max_users, max_storage_gb, max_emails_per_month, JSON.stringify(validatedFeatures), is_active !== false, sort_order || 0, req.params.id, saasId]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/billing/saas-admin/tenant-plans/:id
router.delete('/saas-admin/tenant-plans/:id', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const inUse = await pool.query('SELECT COUNT(*) FROM tenant_subscriptions WHERE tenant_plan_id=$1', [req.params.id]);
    if (parseInt(inUse.rows[0].count) > 0) return res.status(400).json({ success: false, error: 'Plan has active tenants. Reassign them first.' });
    await pool.query('DELETE FROM tenant_billing_plans WHERE id=$1 AND saas_app_id=$2', [req.params.id, saasId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SAAS ADMIN — Tenant Subscriptions ───────────────────────────────────────

// GET /api/v1/billing/saas-admin/tenants
router.get('/saas-admin/tenants', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const result = await pool.query(`
      SELECT tc.id, tc.company_name, tc.company_slug,
        tbp.id AS plan_id, tbp.name AS plan_name, tbp.price_monthly, tbp.currency AS plan_currency,
        ts.id AS subscription_id, ts.status AS billing_status, ts.billing_cycle,
        ts.custom_price, ts.currency, ts.next_billing_date,
        ts.trial_ends_at, ts.current_period_start, ts.current_period_end, ts.notes
      FROM tenant_companies tc
      LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = tc.id
      LEFT JOIN tenant_billing_plans tbp ON tbp.id = ts.tenant_plan_id
      WHERE tc.saas_app_id = $1
      ORDER BY tc.company_name
    `, [saasId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/saas-admin/tenants/:tenantId/assign
router.post('/saas-admin/tenants/:tenantId/assign', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const { tenantId } = req.params;
    const { tenant_plan_id, billing_cycle, custom_price, currency, status, trial_ends_at, next_billing_date, notes } = req.body;

    const tenantCheck = await pool.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [tenantId, saasId]);
    if (!tenantCheck.rows.length) return res.status(403).json({ success: false, error: 'Tenant not found in your SaaS' });

    if (tenant_plan_id) {
      const planCheck = await pool.query('SELECT id FROM tenant_billing_plans WHERE id=$1 AND saas_app_id=$2', [tenant_plan_id, saasId]);
      if (!planCheck.rows.length) return res.status(403).json({ success: false, error: 'Plan not found in your SaaS' });
    }

    const periodEnd = next_billing_date ? new Date(next_billing_date) : (() => {
      const d = new Date();
      billing_cycle === 'yearly' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
      return d;
    })();

    const result = await pool.query(`
      INSERT INTO tenant_subscriptions (tenant_id, tenant_plan_id, billing_cycle, custom_price, currency, status, trial_ends_at, current_period_start, current_period_end, next_billing_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9,$10)
      ON CONFLICT (tenant_id) DO UPDATE SET
        tenant_plan_id=$2, billing_cycle=$3, custom_price=$4, currency=$5,
        status=$6, trial_ends_at=$7, current_period_start=NOW(),
        current_period_end=$8, next_billing_date=$9, notes=$10, updated_at=NOW()
      RETURNING *
    `, [tenantId, tenant_plan_id || null, billing_cycle || 'monthly', custom_price || null, currency || 'INR', status || 'active', trial_ends_at || null, periodEnd, periodEnd, notes || null]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/billing/saas-admin/tenants/:tenantId/subscription
router.delete('/saas-admin/tenants/:tenantId/subscription', saasAdminAuth, async (req, res) => {
  try {
    const saasId = parseInt(req.user.saas_id);
    const tenantCheck = await pool.query('SELECT id FROM tenant_companies WHERE id=$1 AND saas_app_id=$2', [req.params.tenantId, saasId]);
    if (!tenantCheck.rows.length) return res.status(403).json({ success: false, error: 'Tenant not found in your SaaS' });
    await pool.query('DELETE FROM tenant_subscriptions WHERE tenant_id=$1', [req.params.tenantId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TENANT ADMIN — Read-only ─────────────────────────────────────────────────

// GET /api/v1/billing/tenant-admin/current
router.get('/tenant-admin/current', tenantAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        tc.company_name,
        tbp.name AS plan_name, tbp.slug AS plan_slug,
        tbp.price_monthly, tbp.price_yearly, tbp.currency AS plan_currency,
        tbp.max_users, tbp.max_storage_gb, tbp.max_emails_per_month, tbp.features,
        ts.status AS billing_status, ts.billing_cycle,
        ts.custom_price, ts.currency,
        ts.trial_ends_at, ts.next_billing_date,
        ts.current_period_start, ts.current_period_end,
        (SELECT COUNT(*) FROM tenant_users WHERE tenant_id=tc.id AND status='active') AS active_users
      FROM tenant_companies tc
      LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = tc.id
      LEFT JOIN tenant_billing_plans tbp ON tbp.id = ts.tenant_plan_id
      WHERE tc.id = $1
    `, [req.user.tenant_id]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
