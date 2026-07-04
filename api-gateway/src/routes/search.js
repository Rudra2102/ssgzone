const express = require('express');
const router = express.Router();
const SearchService = require('../services/SearchService');
const { authenticateToken } = require('../middleware/auth');

// Search emails
router.get('/emails', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { 
      q, 
      folder, 
      from, 
      to, 
      date_from, 
      date_to, 
      has_attachments,
      page = 1, 
      limit = 20 
    } = req.query;

    const options = {
      from: (page - 1) * limit,
      size: parseInt(limit),
      folder,
      dateRange: date_from && date_to ? { from: date_from, to: date_to } : null,
      hasAttachments: has_attachments === 'true'
    };

    const results = await SearchService.searchEmails(tenantId, q, options);
    
    res.json({
      success: true,
      results: results.emails,
      total: results.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Advanced search with filters
router.post('/advanced', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { query, filters, sort, pagination } = req.body;

    const options = {
      from: pagination?.offset || 0,
      size: pagination?.limit || 20,
      folder: filters?.folder,
      dateRange: filters?.dateRange,
      hasAttachments: filters?.hasAttachments,
      sender: filters?.sender,
      recipient: filters?.recipient
    };

    const results = await SearchService.searchEmails(tenantId, query, options);
    
    res.json({
      success: true,
      results: results.emails,
      total: results.total,
      pagination: {
        offset: options.from,
        limit: options.size,
        total: results.total
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

module.exports = router;