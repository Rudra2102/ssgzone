const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const { authenticateToken } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenantCheck');

/**
 * GET /api/v1/search/emails
 * Search emails by query
 */
router.get('/emails', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    const tenantId = req.tenant.id;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const result = await searchService.searchEmails(
      tenantId,
      q,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(result);
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

/**
 * GET /api/v1/search/advanced
 * Advanced search with filters
 */
router.get('/advanced', authenticateToken, validateTenant, async (req, res) => {
  try {
    const {
      q,
      fromDate,
      toDate,
      sender,
      limit = 20,
      offset = 0
    } = req.query;
    const tenantId = req.tenant.id;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const filters = {
      fromDate: fromDate ? new Date(fromDate) : null,
      toDate: toDate ? new Date(toDate) : null,
      sender: sender || null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await searchService.searchEmailsAdvanced(tenantId, q, filters);

    res.json(result);
  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({ error: 'Failed to perform advanced search' });
  }
});

/**
 * POST /api/v1/search/index
 * Index email for search
 */
router.post('/index', authenticateToken, validateTenant, async (req, res) => {
  try {
    const {
      email_id,
      subject,
      body,
      sender,
      recipients
    } = req.body;
    const tenantId = req.tenant.id;

    if (!email_id || !subject || !body || !sender) {
      return res.status(400).json({
        error: 'Missing required fields: email_id, subject, body, sender'
      });
    }

    const result = await searchService.indexEmail(
      email_id,
      tenantId,
      subject,
      body,
      sender,
      recipients || ''
    );

    res.json(result);
  } catch (error) {
    console.error('Error indexing email:', error);
    res.status(500).json({ error: 'Failed to index email' });
  }
});

/**
 * PUT /api/v1/search/index/:email_id
 * Update indexed email
 */
router.put('/index/:email_id', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { email_id } = req.params;
    const { subject, body, sender, recipients } = req.body;
    const tenantId = req.tenant.id;

    if (!subject || !body || !sender) {
      return res.status(400).json({
        error: 'Missing required fields: subject, body, sender'
      });
    }

    const result = await searchService.updateIndex(
      email_id,
      tenantId,
      subject,
      body,
      sender,
      recipients || ''
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating index:', error);
    res.status(500).json({ error: 'Failed to update index' });
  }
});

/**
 * DELETE /api/v1/search/index/:email_id
 * Remove email from search index
 */
router.delete('/index/:email_id', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { email_id } = req.params;
    const tenantId = req.tenant.id;

    const result = await searchService.removeFromIndex(email_id, tenantId);

    res.json(result);
  } catch (error) {
    console.error('Error removing from index:', error);
    res.status(500).json({ error: 'Failed to remove from index' });
  }
});

/**
 * GET /api/v1/search/stats
 * Get search statistics for tenant
 */
router.get('/stats', authenticateToken, validateTenant, async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const result = await searchService.getSearchStats(tenantId);

    res.json(result);
  } catch (error) {
    console.error('Error getting search stats:', error);
    res.status(500).json({ error: 'Failed to get search statistics' });
  }
});

/**
 * POST /api/v1/search/bulk-index
 * Bulk index emails
 */
router.post('/bulk-index', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { emails } = req.body;
    const tenantId = req.tenant.id;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails array is required and must not be empty' });
    }

    const result = await searchService.bulkIndexEmails(tenantId, emails);

    res.json(result);
  } catch (error) {
    console.error('Error bulk indexing:', error);
    res.status(500).json({ error: 'Failed to bulk index emails' });
  }
});

module.exports = router;
