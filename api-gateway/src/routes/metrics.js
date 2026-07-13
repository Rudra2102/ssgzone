const express = require('express');
const router = express.Router();
const client = require('prom-client');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

// Default Node.js metrics (CPU, memory, event loop, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom SSGzone metrics
const emailsQueued = new client.Gauge({
  name: 'ssgzone_emails_queued_total',
  help: 'Total emails currently in queued state',
  registers: [register]
});

const emailsSent = new client.Gauge({
  name: 'ssgzone_emails_sent_total',
  help: 'Total emails sent successfully',
  registers: [register]
});

const emailsFailed = new client.Gauge({
  name: 'ssgzone_emails_failed_total',
  help: 'Total emails failed to deliver',
  registers: [register]
});

const activeTenantsGauge = new client.Gauge({
  name: 'ssgzone_active_tenants',
  help: 'Number of active tenants',
  registers: [register]
});

const activeUsersGauge = new client.Gauge({
  name: 'ssgzone_active_users',
  help: 'Number of active users',
  registers: [register]
});

const storageObjectsGauge = new client.Gauge({
  name: 'ssgzone_storage_objects_total',
  help: 'Total objects stored in MinIO',
  registers: [register]
});

const searchIndexGauge = new client.Gauge({
  name: 'ssgzone_search_index_total',
  help: 'Total emails in search index',
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'ssgzone_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// Middleware to track request duration - export for use in server.js
const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status: res.statusCode });
  });
  next();
};

// Collect DB metrics on each scrape
async function collectDbMetrics() {
  try {
    const [queueStats, tenantStats, searchStats] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM email_delivery_queue GROUP BY status`),
      pool.query(`SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users
        FROM tenant_companies`),
      pool.query(`SELECT COUNT(*) as total FROM email_search_index`)
    ]);

    queueStats.rows.forEach(row => {
      if (row.status === 'queued') emailsQueued.set(parseInt(row.count));
      if (row.status === 'sent') emailsSent.set(parseInt(row.count));
      if (row.status === 'failed') emailsFailed.set(parseInt(row.count));
    });

    if (tenantStats.rows[0]) {
      activeTenantsGauge.set(parseInt(tenantStats.rows[0].active_tenants) || 0);
      activeUsersGauge.set(parseInt(tenantStats.rows[0].active_users) || 0);
    }

    if (searchStats.rows[0]) {
      searchIndexGauge.set(parseInt(searchStats.rows[0].total) || 0);
    }
  } catch (err) {
    // Don't crash scrape on DB error
    console.error('Metrics DB collection error:', err.message);
  }
}

// GET /api/v1/metrics - Prometheus scrape endpoint
router.get('/', async (req, res) => {
  await collectDbMetrics();
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = { router, metricsMiddleware };
