const express = require('express');
const router = express.Router();
const { registerWebhook, getWebhooks, sendWebhook, retryPendingDeliveries, VALID_EVENTS } = require('../services/webhookService');
const db = require('../services/DatabaseService');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Register webhook
router.post('/register', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    const tenantId = req.user.tenant_id;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'URL and events array are required' });
    }

    const invalidEvents = events.filter(e => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ error: 'Invalid events', invalid: invalidEvents, valid: VALID_EVENTS });
    }

    const webhook = await registerWebhook(tenantId, { url, events, secret });
    res.json({ success: true, webhook });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// Get webhooks
router.get('/', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const webhooks = await getWebhooks(req.user.tenant_id);
    res.json({ webhooks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Update webhook
router.put('/:webhookId', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { url, events, is_active } = req.body;
    const result = await db.query(
      `UPDATE webhooks SET url = COALESCE($1, url), events = COALESCE($2, events),
       is_active = COALESCE($3, is_active), updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [url, events ? JSON.stringify(events) : null, is_active, req.params.webhookId, req.user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ success: true, webhook: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook (soft)
router.delete('/:webhookId', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE webhooks SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [req.params.webhookId, req.user.tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Get delivery logs
router.get('/:webhookId/deliveries', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const check = await db.query('SELECT id FROM webhooks WHERE id = $1 AND tenant_id = $2', [req.params.webhookId, req.user.tenant_id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });

    const [deliveries, count] = await Promise.all([
      db.query(`SELECT id, event_type, status, response_code, error_message, attempt_count, delivered_at, created_at
                FROM webhook_deliveries WHERE webhook_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.params.webhookId, limit, offset]),
      db.query('SELECT COUNT(*) as total FROM webhook_deliveries WHERE webhook_id = $1', [req.params.webhookId])
    ]);

    res.json({ deliveries: deliveries.rows, total: parseInt(count.rows[0].total), page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Test webhook
router.post('/:webhookId/test', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM webhooks WHERE id = $1 AND tenant_id = $2 AND is_active = true', [req.params.webhookId, req.user.tenant_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });

    await sendWebhook(result.rows[0], 'webhook.test', { message: 'Test delivery', timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Test webhook sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

// Retry pending deliveries (admin use)
router.post('/retry-pending', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const count = await retryPendingDeliveries();
    res.json({ success: true, retried: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retry deliveries' });
  }
});

module.exports = router;
