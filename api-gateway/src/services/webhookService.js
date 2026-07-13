const crypto = require('crypto');
const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const VALID_EVENTS = [
  'email.received', 'email.sent', 'email.bounced', 'email.spam',
  'user.created', 'user.deleted',
  'tenant.suspended', 'tenant.activated',
  'quota.exceeded', 'attachment.blocked',
  'webhook.test'
];

// Sign payload with HMAC-SHA256
function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

// Deliver webhook with retry tracking
async function deliverWebhook(delivery, webhook) {
  const payload = delivery.payload;
  const headers = {
    'Content-Type': 'application/json',
    'X-SSGzone-Event': delivery.event_type,
    'X-SSGzone-Delivery': delivery.id,
    'X-SSGzone-Timestamp': new Date().toISOString()
  };

  if (webhook.secret) {
    headers['X-SSGzone-Signature'] = `sha256=${signPayload(payload, webhook.secret)}`;
  }

  try {
    const response = await axios.post(webhook.url, payload, { headers, timeout: 10000 });

    await pool.query(
      `UPDATE webhook_deliveries 
       SET status = 'success', response_code = $1, response_body = $2, delivered_at = NOW(), attempt_count = attempt_count + 1
       WHERE id = $3`,
      [response.status, String(response.data).slice(0, 500), delivery.id]
    );
    return true;
  } catch (error) {
    const attempt = (delivery.attempt_count || 0) + 1;
    const isFinal = attempt >= webhook.max_retries;
    // Exponential backoff: 1min, 5min, 30min
    const delays = [60, 300, 1800];
    const nextRetry = isFinal ? null : new Date(Date.now() + (delays[attempt - 1] || 1800) * 1000);

    await pool.query(
      `UPDATE webhook_deliveries 
       SET status = $1, response_code = $2, error_message = $3, attempt_count = $4, next_retry_at = $5
       WHERE id = $6`,
      [
        isFinal ? 'failed' : 'pending',
        error.response?.status || null,
        error.message.slice(0, 500),
        attempt,
        nextRetry,
        delivery.id
      ]
    );
    return false;
  }
}

// Trigger event - find matching webhooks and dispatch
async function triggerEvent(tenantId, eventType, data) {
  if (!VALID_EVENTS.includes(eventType)) return;

  const { rows: webhooks } = await pool.query(
    `SELECT * FROM webhooks WHERE tenant_id = $1 AND is_active = true AND events @> $2::jsonb`,
    [tenantId, JSON.stringify([eventType])]
  );

  for (const webhook of webhooks) {
    const payload = { event: eventType, tenant_id: tenantId, data, timestamp: new Date().toISOString() };

    const { rows } = await pool.query(
      `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [webhook.id, eventType, JSON.stringify(payload)]
    );

    // Fire and forget - don't await delivery
    deliverWebhook(rows[0], webhook).catch(err => console.error('Webhook delivery error:', err.message));
  }
}

// Retry pending failed deliveries (called by a cron or on-demand)
async function retryPendingDeliveries() {
  const { rows: pending } = await pool.query(
    `SELECT wd.*, w.url, w.secret, w.max_retries
     FROM webhook_deliveries wd
     JOIN webhooks w ON wd.webhook_id = w.id
     WHERE wd.status = 'pending' AND wd.next_retry_at <= NOW()
     LIMIT 50`
  );

  for (const delivery of pending) {
    await deliverWebhook(delivery, { url: delivery.url, secret: delivery.secret, max_retries: delivery.max_retries });
  }

  return pending.length;
}

async function registerWebhook(tenantId, { url, events, secret }) {
  const { rows } = await pool.query(
    `INSERT INTO webhooks (tenant_id, url, events, secret)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, url, JSON.stringify(events), secret || null]
  );
  return rows[0];
}

async function getWebhooks(tenantId) {
  const { rows } = await pool.query(
    `SELECT id, url, events, is_active, max_retries, created_at FROM webhooks WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

async function sendWebhook(webhook, eventType, data) {
  const payload = { event: eventType, data, timestamp: new Date().toISOString() };
  const { rows } = await pool.query(
    `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [webhook.id, eventType, JSON.stringify(payload)]
  );
  return deliverWebhook(rows[0], webhook);
}

module.exports = { triggerEvent, retryPendingDeliveries, registerWebhook, getWebhooks, sendWebhook, VALID_EVENTS };
