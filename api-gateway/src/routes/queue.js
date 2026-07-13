const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenantCheck');
const { enqueueEmail, cancelEmail, getQueueStats, getJobStatus } = require('../services/queueService');

// POST /api/v1/queue/email - Enqueue an email for delivery
router.post('/email', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { to, subject, html, text, attachments, scheduled_at, priority, metadata } = req.body;
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: 'to, subject, and html or text are required' });
    }

    const result = await enqueueEmail({
      tenantId: req.tenantId,
      from: req.body.from || process.env.SES_FROM_EMAIL,
      to, subject, html, text,
      attachments: attachments || [],
      scheduledAt: scheduled_at,
      priority: priority || 0,
      metadata: metadata || {}
    });

    res.status(202).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/queue/status/:dbId - Get job status
router.get('/status/:dbId', authenticateToken, validateTenant, async (req, res) => {
  try {
    const status = await getJobStatus(req.params.dbId, req.tenantId);
    res.json({ success: true, job: status });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE /api/v1/queue/cancel/:dbId - Cancel a queued email
router.delete('/cancel/:dbId', authenticateToken, validateTenant, async (req, res) => {
  try {
    await cancelEmail(req.params.dbId, req.tenantId);
    res.json({ success: true, message: 'Email cancelled' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/queue/stats - Queue statistics for tenant
router.get('/stats', authenticateToken, validateTenant, async (req, res) => {
  try {
    const stats = await getQueueStats(req.tenantId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
