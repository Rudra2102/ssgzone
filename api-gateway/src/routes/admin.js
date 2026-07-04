const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const SaasService = require('../services/saasService');
const TenantService = require('../services/tenantService');
const UserService = require('../services/userService');
const DnsService = require('../services/dnsService');
const AuditService = require('../services/auditService');

const router = express.Router();

// Database connection for admin users
const db = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'academy'
});

// Admin login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin user
    const result = await db.query('SELECT * FROM admin_users WHERE username = $1 AND status = $2', [username, 'active']);
    const admin = result.rows[0];
    
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'admin-secret',
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
          role: admin.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Admin authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin-secret');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid admin token' });
  }
};

// Overview statistics
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const stats = {
      totalSaas: 5,
      totalTenants: 25,
      totalUsers: 150,
      totalEmails: 1250
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email volume statistics
router.get('/stats/email-volume', adminAuth, async (req, res) => {
  try {
    const data = [
      { date: '2024-01-10', sent: 45, received: 67 },
      { date: '2024-01-11', sent: 52, received: 73 },
      { date: '2024-01-12', sent: 48, received: 69 },
      { date: '2024-01-13', sent: 61, received: 82 },
      { date: '2024-01-14', sent: 55, received: 76 },
      { date: '2024-01-15', sent: 58, received: 79 },
      { date: '2024-01-16', sent: 63, received: 85 }
    ];
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tenant distribution
router.get('/stats/tenant-distribution', adminAuth, async (req, res) => {
  try {
    const data = [
      { name: 'LMS', value: 15 },
      { name: 'Rupyo', value: 8 },
      { name: 'CRM', value: 2 }
    ];
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recent activity
router.get('/activity/recent', adminAuth, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const activities = await AuditService.getAuditLogs({ limit });
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Audit logs with filters
router.get('/audit-logs', adminAuth, async (req, res) => {
  try {
    const filters = {
      saas_id: req.query.saas_id,
      tenant_id: req.query.tenant_id,
      action: req.query.action,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit || 100
    };
    
    const logs = await AuditService.getAuditLogs(filters);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Usage analytics segmented by SaaS and tenant
router.get('/analytics/usage', adminAuth, async (req, res) => {
  try {
    const { saas_slug, tenant_slug, days = 30 } = req.query;
    
    // Mock segmented analytics data
    const data = [
      {
        date: '2024-01-16',
        saas_slug: 'lms',
        tenant_slug: 'nabc',
        email_count: 45,
        total_size: 2048000,
        active_users: 12,
        delivery_rate: 98.5
      },
      {
        date: '2024-01-16',
        saas_slug: 'rupyo',
        tenant_slug: 'abcdevelopers',
        email_count: 23,
        total_size: 1024000,
        active_users: 8,
        delivery_rate: 99.2
      }
    ];
    
    let filteredData = data;
    
    if (saas_slug) {
      filteredData = filteredData.filter(item => item.saas_slug === saas_slug);
    }
    
    if (tenant_slug) {
      filteredData = filteredData.filter(item => item.tenant_slug === tenant_slug);
    }
    
    res.json({ success: true, data: filteredData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;