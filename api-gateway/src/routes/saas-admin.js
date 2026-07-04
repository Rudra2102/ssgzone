const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../utils/database');
const pool = db.pool;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify SaaS Admin token
const verifySaasAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'saas_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.saasAdminId = decoded.id;
    req.saasAppId = decoded.saas_app_id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT sau.*, sa.name as saas_app_name FROM saas_admin_users sau JOIN saas_applications sa ON sau.saas_app_id = sa.id WHERE sau.email = $1 AND sau.password = crypt($2, sau.password) AND sau.is_active = true',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, saas_app_id: user.saas_app_id, role: 'saas_admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      saas_app_id: user.saas_app_id,
      saas_app_name: user.saas_app_name,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', verifySaasAdminToken, async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(DISTINCT t.id) as total_tenants,
        COUNT(DISTINCT u.id) as active_users,
        COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
      WHERE t.saas_app_id = $1`,
      [req.saasAppId]
    );

    res.json({
      totalTenants: parseInt(stats.rows[0].total_tenants) || 0,
      activeUsers: parseInt(stats.rows[0].active_users) || 0,
      activeTenants: parseInt(stats.rows[0].active_tenants) || 0,
      revenue: 0,
      growth: 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get API keys
router.get('/api-keys', verifySaasAdminToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT api_key, api_secret, webhook_secret FROM saas_applications WHERE id = $1',
      [req.saasAppId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'SaaS application not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('API keys error:', error);
    res.status(500).json({ message: 'Failed to fetch API keys' });
  }
});

// Regenerate API key
router.post('/api-keys/regenerate', verifySaasAdminToken, async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['api_key', 'api_secret', 'webhook_secret'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid key type' });
    }

    const newValue = require('crypto').randomBytes(32).toString('hex');
    
    await pool.query(
      `UPDATE saas_applications SET ${type} = $1, updated_at = NOW() WHERE id = $2`,
      [newValue, req.saasAppId]
    );

    res.json({ message: `${type} regenerated successfully` });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ message: 'Failed to regenerate key' });
  }
});

// Test webhook
router.post('/webhooks/test', verifySaasAdminToken, async (req, res) => {
  try {
    const { url } = req.body;
    const axios = require('axios');

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook from SSGzone' }
    };

    await axios.post(url, testPayload, { timeout: 5000 });
    res.json({ success: true, message: 'Webhook test successful' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all tenants
router.get('/tenants', verifySaasAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM tenants WHERE saas_app_id = $1';
    const params = [req.saasAppId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM tenants WHERE saas_app_id = $1',
      [req.saasAppId]
    );

    res.json({
      tenants: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Tenants error:', error);
    res.status(500).json({ message: 'Failed to fetch tenants' });
  }
});

// Create tenant
router.post('/tenants', verifySaasAdminToken, async (req, res) => {
  try {
    const { name, email, domain, plan = 'basic' } = req.body;

    const result = await pool.query(
      `INSERT INTO tenants (saas_app_id, name, email, domain, plan, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING *`,
      [req.saasAppId, name, email, domain, plan]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
});

// Update tenant
router.put('/tenants/:id', verifySaasAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, domain, plan } = req.body;

    const result = await pool.query(
      `UPDATE tenants SET name = $1, email = $2, domain = $3, plan = $4, updated_at = NOW()
       WHERE id = $5 AND saas_app_id = $6
       RETURNING *`,
      [name, email, domain, plan, id, req.saasAppId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Failed to update tenant' });
  }
});

// Toggle tenant status
router.patch('/tenants/:id/toggle-status', verifySaasAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE tenants SET 
        status = CASE WHEN status = 'active' THEN 'suspended' ELSE 'active' END,
        updated_at = NOW()
       WHERE id = $1 AND saas_app_id = $2
       RETURNING *`,
      [id, req.saasAppId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Failed to toggle status' });
  }
});

// Delete tenant
router.delete('/tenants/:id', verifySaasAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tenants WHERE id = $1 AND saas_app_id = $2 RETURNING id',
      [id, req.saasAppId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Failed to delete tenant' });
  }
});

module.exports = router;
