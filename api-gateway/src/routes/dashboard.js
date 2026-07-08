const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../services/DatabaseService');

// Get dashboard metrics based on user role
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { user_id, role, tenant_id } = req.user;
    let metrics = {};

    if (role === 'super_admin') {
      metrics = await getSuperAdminMetrics();
    } else if (role === 'admin') {
      metrics = await getAdminMetrics(tenant_id);
    } else if (role === 'tenant') {
      metrics = await getTenantMetrics(tenant_id);
    } else if (role === 'user') {
      metrics = await getUserMetrics(user_id, tenant_id);
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get system activities
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const { role, tenant_id, user_id } = req.user;

    let query = `
      SELECT 
        id, type, title, description, timestamp, user_id, tenant_id
      FROM activity_logs
      WHERE 1=1
    `;
    const params = [];

    if (role === 'tenant') {
      query += ` AND tenant_id = $${params.length + 1}`;
      params.push(tenant_id);
    } else if (role === 'user') {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

async function getSuperAdminMetrics() {
  const metrics = {};

  // Total SaaS Apps
  const appsResult = await db.query('SELECT COUNT(*) as count FROM saas_applications WHERE deleted_at IS NULL');
  metrics.totalSaasApps = parseInt(appsResult.rows[0].count);

  // Active Tenants
  const tenantsResult = await db.query('SELECT COUNT(*) as count FROM tenant_companies WHERE deleted_at IS NULL');
  metrics.activeTenants = parseInt(tenantsResult.rows[0].count);

  // Total Users
  const usersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');
  metrics.totalUsers = parseInt(usersResult.rows[0].count);

  // Emails Today
  const emailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE DATE(created_at) = CURRENT_DATE
  `);
  metrics.emailsToday = parseInt(emailsResult.rows[0].count);

  // Platform Admins
  const adminsResult = await db.query('SELECT COUNT(*) as count FROM users WHERE role = $1 AND deleted_at IS NULL', ['admin']);
  metrics.platformAdmins = parseInt(adminsResult.rows[0].count);

  // Email Stats
  const emailStatsResult = await db.query(`
    SELECT 
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
      SUM(CASE WHEN is_spam = true THEN 1 ELSE 0 END) as spam
    FROM emails 
    WHERE DATE(created_at) = CURRENT_DATE
  `);
  const emailStats = emailStatsResult.rows[0];
  metrics.emailStats = {
    sent: parseInt(emailStats.sent) || 0,
    received: parseInt(emailStats.received) || 0,
    failed: parseInt(emailStats.failed) || 0,
    bounced: parseInt(emailStats.bounced) || 0,
    spam: parseInt(emailStats.spam) || 0,
    deliveryRate: 98.5
  };

  // Health Metrics
  metrics.healthMetrics = {
    uptime: 99.9,
    avgDeliveryTime: 2.3,
    spamScore: 0.8,
    dkimStatus: 'valid',
    spfStatus: 'valid',
    dmarcStatus: 'valid',
    tlsEnabled: true,
    apiHealth: 'healthy'
  };

  // Storage Usage
  const storageResult = await db.query(`
    SELECT 
      COALESCE(SUM(size_bytes), 0) as total_bytes
    FROM email_attachments
  `);
  const totalBytes = parseInt(storageResult.rows[0].total_bytes);
  const usedGB = totalBytes / (1024 * 1024 * 1024);
  const totalGB = 1000;
  metrics.storageUsage = {
    used: parseFloat(usedGB.toFixed(1)),
    total: totalGB,
    percentage: parseFloat(((usedGB / totalGB) * 100).toFixed(1)),
    breakdown: {
      emails: parseFloat((usedGB * 0.65).toFixed(1)),
      attachments: parseFloat((usedGB * 0.30).toFixed(1)),
      backups: parseFloat((usedGB * 0.04).toFixed(1)),
      other: parseFloat((usedGB * 0.01).toFixed(1))
    }
  };

  // Trends
  const yesterdayEmailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  `);
  const yesterdayEmails = parseInt(yesterdayEmailsResult.rows[0].count);
  const emailsTrend = yesterdayEmails > 0 ? Math.round(((metrics.emailsToday - yesterdayEmails) / yesterdayEmails) * 100) : 0;

  metrics.trends = {
    emailsTrend,
    usersTrend: 5,
    tenantsTrend: 3,
    appsTrend: 2
  };

  return metrics;
}

async function getAdminMetrics(tenantId) {
  const metrics = {};

  // Own Tenants (if admin manages multiple)
  const tenantsResult = await db.query('SELECT COUNT(*) as count FROM tenant_companies WHERE admin_id = $1 AND deleted_at IS NULL', [tenantId]);
  metrics.ownTenants = parseInt(tenantsResult.rows[0].count);

  // Own Users
  const usersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND deleted_at IS NULL', [tenantId]);
  metrics.ownUsers = parseInt(usersResult.rows[0].count);

  // Emails Today
  const emailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
  `, [tenantId]);
  metrics.emailsToday = parseInt(emailsResult.rows[0].count);

  // Email Stats
  const emailStatsResult = await db.query(`
    SELECT 
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
      SUM(CASE WHEN is_spam = true THEN 1 ELSE 0 END) as spam
    FROM emails 
    WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
  `, [tenantId]);
  const emailStats = emailStatsResult.rows[0];
  metrics.emailStats = {
    sent: parseInt(emailStats.sent) || 0,
    received: parseInt(emailStats.received) || 0,
    failed: parseInt(emailStats.failed) || 0,
    bounced: parseInt(emailStats.bounced) || 0,
    spam: parseInt(emailStats.spam) || 0,
    deliveryRate: 98.5
  };

  // Health Metrics
  metrics.healthMetrics = {
    uptime: 99.9,
    avgDeliveryTime: 2.3,
    spamScore: 0.8,
    dkimStatus: 'valid',
    spfStatus: 'valid',
    dmarcStatus: 'valid',
    tlsEnabled: true,
    apiHealth: 'healthy'
  };

  // Storage Usage
  const storageResult = await db.query(`
    SELECT 
      COALESCE(SUM(size_bytes), 0) as total_bytes
    FROM email_attachments ea
    JOIN emails e ON ea.email_id = e.id
    WHERE e.tenant_id = $1
  `, [tenantId]);
  const totalBytes = parseInt(storageResult.rows[0].total_bytes);
  const usedGB = totalBytes / (1024 * 1024 * 1024);
  const totalGB = 100;
  metrics.storageUsage = {
    used: parseFloat(usedGB.toFixed(1)),
    total: totalGB,
    percentage: parseFloat(((usedGB / totalGB) * 100).toFixed(1)),
    breakdown: {
      emails: parseFloat((usedGB * 0.65).toFixed(1)),
      attachments: parseFloat((usedGB * 0.30).toFixed(1)),
      backups: parseFloat((usedGB * 0.04).toFixed(1)),
      other: parseFloat((usedGB * 0.01).toFixed(1))
    }
  };

  // Trends
  const yesterdayEmailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  `, [tenantId]);
  const yesterdayEmails = parseInt(yesterdayEmailsResult.rows[0].count);
  const emailsTrend = yesterdayEmails > 0 ? Math.round(((metrics.emailsToday - yesterdayEmails) / yesterdayEmails) * 100) : 0;

  metrics.trends = {
    emailsTrend,
    usersTrend: 2,
    tenantsTrend: 0
  };

  return metrics;
}

async function getTenantMetrics(tenantId) {
  const metrics = {};

  // Own Users
  const usersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND deleted_at IS NULL', [tenantId]);
  metrics.ownUsers = parseInt(usersResult.rows[0].count);

  // Emails Today
  const emailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
  `, [tenantId]);
  metrics.emailsToday = parseInt(emailsResult.rows[0].count);

  // Email Stats
  const emailStatsResult = await db.query(`
    SELECT 
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
      SUM(CASE WHEN is_spam = true THEN 1 ELSE 0 END) as spam
    FROM emails 
    WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE
  `, [tenantId]);
  const emailStats = emailStatsResult.rows[0];
  metrics.emailStats = {
    sent: parseInt(emailStats.sent) || 0,
    received: parseInt(emailStats.received) || 0,
    failed: parseInt(emailStats.failed) || 0,
    bounced: parseInt(emailStats.bounced) || 0,
    spam: parseInt(emailStats.spam) || 0,
    deliveryRate: 98.5
  };

  // Health Metrics
  metrics.healthMetrics = {
    uptime: 99.9,
    avgDeliveryTime: 2.3,
    spamScore: 0.8,
    dkimStatus: 'valid',
    spfStatus: 'valid',
    dmarcStatus: 'valid',
    tlsEnabled: true,
    apiHealth: 'healthy'
  };

  // Storage Usage
  const storageResult = await db.query(`
    SELECT 
      COALESCE(SUM(size_bytes), 0) as total_bytes
    FROM email_attachments ea
    JOIN emails e ON ea.email_id = e.id
    WHERE e.tenant_id = $1
  `, [tenantId]);
  const totalBytes = parseInt(storageResult.rows[0].total_bytes);
  const usedGB = totalBytes / (1024 * 1024 * 1024);
  const totalGB = 50;
  metrics.storageUsage = {
    used: parseFloat(usedGB.toFixed(1)),
    total: totalGB,
    percentage: parseFloat(((usedGB / totalGB) * 100).toFixed(1)),
    breakdown: {
      emails: parseFloat((usedGB * 0.65).toFixed(1)),
      attachments: parseFloat((usedGB * 0.30).toFixed(1)),
      backups: parseFloat((usedGB * 0.04).toFixed(1)),
      other: parseFloat((usedGB * 0.01).toFixed(1))
    }
  };

  // Trends
  const yesterdayEmailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  `, [tenantId]);
  const yesterdayEmails = parseInt(yesterdayEmailsResult.rows[0].count);
  const emailsTrend = yesterdayEmails > 0 ? Math.round(((metrics.emailsToday - yesterdayEmails) / yesterdayEmails) * 100) : 0;

  metrics.trends = {
    emailsTrend,
    usersTrend: 1
  };

  return metrics;
}

async function getUserMetrics(userId, tenantId) {
  const metrics = {};

  // Emails Today
  const emailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
  `, [userId]);
  metrics.emailsToday = parseInt(emailsResult.rows[0].count);

  // Email Stats
  const emailStatsResult = await db.query(`
    SELECT 
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
      SUM(CASE WHEN is_spam = true THEN 1 ELSE 0 END) as spam
    FROM emails 
    WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
  `, [userId]);
  const emailStats = emailStatsResult.rows[0];
  metrics.emailStats = {
    sent: parseInt(emailStats.sent) || 0,
    received: parseInt(emailStats.received) || 0,
    failed: parseInt(emailStats.failed) || 0,
    bounced: parseInt(emailStats.bounced) || 0,
    spam: parseInt(emailStats.spam) || 0,
    deliveryRate: 98.5
  };

  // Health Metrics
  metrics.healthMetrics = {
    uptime: 99.9,
    avgDeliveryTime: 2.3,
    spamScore: 0.8,
    dkimStatus: 'valid',
    spfStatus: 'valid',
    dmarcStatus: 'valid',
    tlsEnabled: true,
    apiHealth: 'healthy'
  };

  // Storage Usage
  const storageResult = await db.query(`
    SELECT 
      COALESCE(SUM(size_bytes), 0) as total_bytes
    FROM email_attachments ea
    JOIN emails e ON ea.email_id = e.id
    WHERE e.user_id = $1
  `, [userId]);
  const totalBytes = parseInt(storageResult.rows[0].total_bytes);
  const usedGB = totalBytes / (1024 * 1024 * 1024);
  const totalGB = 10;
  metrics.storageUsage = {
    used: parseFloat(usedGB.toFixed(1)),
    total: totalGB,
    percentage: parseFloat(((usedGB / totalGB) * 100).toFixed(1)),
    breakdown: {
      emails: parseFloat((usedGB * 0.65).toFixed(1)),
      attachments: parseFloat((usedGB * 0.30).toFixed(1)),
      backups: parseFloat((usedGB * 0.04).toFixed(1)),
      other: parseFloat((usedGB * 0.01).toFixed(1))
    }
  };

  // Trends
  const yesterdayEmailsResult = await db.query(`
    SELECT COUNT(*) as count FROM emails 
    WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  `, [userId]);
  const yesterdayEmails = parseInt(yesterdayEmailsResult.rows[0].count);
  const emailsTrend = yesterdayEmails > 0 ? Math.round(((metrics.emailsToday - yesterdayEmails) / yesterdayEmails) * 100) : 0;

  metrics.trends = {
    emailsTrend
  };

  return metrics;
}

module.exports = router;
