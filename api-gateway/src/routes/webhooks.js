const express = require('express');
const router = express.Router();
const WebhookService = require('../services/WebhookService');
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

    const validEvents = [
      'email.received', 'email.bounced', 'user.created', 'spam.complaint',
      'tenant.suspended', 'quota.exceeded'
    ];

    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid events', 
        invalid: invalidEvents,
        valid: validEvents 
      });
    }

    const webhook = await WebhookService.registerWebhook(tenantId, {
      url,
      events,
      secret
    });

    res.json({ success: true, webhook });
  } catch (error) {
    console.error('Error registering webhook:', error);
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// Get webhooks
router.get('/', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const webhooks = await WebhookService.getWebhooks(tenantId);
    res.json({ webhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Update webhook
router.put('/:webhookId', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { url, events, is_active } = req.body;
    const tenantId = req.user.tenant_id;

    const query = `
      UPDATE webhooks 
      SET url = COALESCE($1, url),
          events = COALESCE($2, events),
          is_active = COALESCE($3, is_active),
          updated_at = NOW()
      WHERE id = $4 AND tenant_id = $5
      RETURNING *
    `;

    const result = await db.query(query, [
      url,
      events ? JSON.stringify(events) : null,
      is_active,
      webhookId,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true, webhook: result.rows[0] });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
router.delete('/:webhookId', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const tenantId = req.user.tenant_id;

    const query = `
      UPDATE webhooks 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [webhookId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Get webhook delivery logs
router.get('/:webhookId/deliveries', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const tenantId = req.user.tenant_id;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    // Verify webhook belongs to tenant
    const webhookCheck = await db.query(
      'SELECT id FROM webhooks WHERE id = $1 AND tenant_id = $2',
      [webhookId, tenantId]
    );

    if (webhookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const query = `
      SELECT id, event_type, status, response_code, error_message, delivered_at
      FROM webhook_deliveries 
      WHERE webhook_id = $1
      ORDER BY delivered_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM webhook_deliveries 
      WHERE webhook_id = $1
    `;

    const [deliveries, countResult] = await Promise.all([
      db.query(query, [webhookId, limit, offset]),
      db.query(countQuery, [webhookId])
    ]);

    res.json({
      deliveries: deliveries.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Test webhook
router.post('/:webhookId/test', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const tenantId = req.user.tenant_id;

    const webhookQuery = `
      SELECT * FROM webhooks 
      WHERE id = $1 AND tenant_id = $2 AND is_active = true
    `;

    const result = await db.query(webhookQuery, [webhookId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const webhook = result.rows[0];

    // Send test event
    await WebhookService.sendWebhook(webhook, 'webhook.test', {
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Test webhook sent' });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

module.exports = router;