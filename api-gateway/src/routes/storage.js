const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const storageService = require('../services/storageService');
const { authenticateToken } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenantCheck');
const db = require('../utils/database');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Initialize storage service
storageService.initialize().catch(err => {
  console.error('Failed to initialize storage service:', err);
});

/**
 * POST /api/v1/storage/email
 * Upload email content to MinIO
 */
router.post('/email', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { email_id, content, attachments } = req.body;
    const tenantId = req.tenant.id;

    if (!email_id || !content) {
      return res.status(400).json({ error: 'email_id and content are required' });
    }

    // Upload email to MinIO
    const result = await storageService.uploadEmail(content, tenantId, email_id);

    // Store reference in database
    await db.query(
      `INSERT INTO email_storage (email_id, tenant_id, storage_key, storage_type, file_size, content_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email_id, tenantId, result.key, 'email', result.size, 'application/json']
    );

    res.json({
      success: true,
      storage_key: result.key,
      location: result.location,
      size: result.size
    });
  } catch (error) {
    console.error('Error uploading email:', error);
    res.status(500).json({ error: 'Failed to upload email' });
  }
});

/**
 * POST /api/v1/storage/attachment
 * Upload attachment to MinIO
 */
router.post('/attachment', authenticateToken, validateTenant, upload.single('file'), async (req, res) => {
  try {
    const { email_id } = req.body;
    const tenantId = req.tenant.id;

    if (!email_id || !req.file) {
      return res.status(400).json({ error: 'email_id and file are required' });
    }

    // Upload attachment to MinIO
    const result = await storageService.uploadAttachment(req.file, tenantId, email_id);

    // Store reference in database
    await db.query(
      `INSERT INTO email_storage (email_id, tenant_id, storage_key, storage_type, file_size, content_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email_id, tenantId, result.key, 'attachment', result.size, result.contentType]
    );

    res.json({
      success: true,
      storage_key: result.key,
      url: result.url,
      size: result.size,
      originalName: result.originalName
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

/**
 * GET /api/v1/storage/email/:storage_key
 * Retrieve email content from MinIO
 */
router.get('/email/:storage_key', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { storage_key } = req.params;
    const tenantId = req.tenant.id;

    // Verify storage record exists
    const result = await db.query(
      `SELECT * FROM email_storage WHERE storage_key = $1 AND tenant_id = $2 AND storage_type = 'email'`,
      [storage_key, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Retrieve from MinIO
    const email = await storageService.getEmail(storage_key, tenantId);

    res.json({
      success: true,
      email_id: result.rows[0].email_id,
      content: email,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error retrieving email:', error);
    res.status(500).json({ error: 'Failed to retrieve email' });
  }
});

/**
 * GET /api/v1/storage/attachment/:storage_key
 * Download attachment from MinIO
 */
router.get('/attachment/:storage_key', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { storage_key } = req.params;
    const tenantId = req.tenant.id;

    // Verify storage record exists
    const result = await db.query(
      `SELECT * FROM email_storage WHERE storage_key = $1 AND tenant_id = $2 AND storage_type = 'attachment'`,
      [storage_key, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Get metadata
    const metadata = await storageService.getAttachmentMetadata(storage_key, tenantId);

    // Set response headers
    res.setHeader('Content-Type', metadata.contentType);
    res.setHeader('Content-Length', metadata.size);
    res.setHeader('Content-Disposition', `attachment; filename="${storage_key.split('/').pop()}"`);

    // Stream from MinIO
    const stream = await storageService.getAttachment(storage_key, tenantId);
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

/**
 * DELETE /api/v1/storage/email/:storage_key
 * Delete email from MinIO
 */
router.delete('/email/:storage_key', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { storage_key } = req.params;
    const tenantId = req.tenant.id;

    // Verify storage record exists
    const result = await db.query(
      `SELECT * FROM email_storage WHERE storage_key = $1 AND tenant_id = $2 AND storage_type = 'email'`,
      [storage_key, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Delete from MinIO
    await storageService.deleteEmail(storage_key, tenantId);

    // Update database record
    await db.query(
      `UPDATE email_storage SET archived_at = CURRENT_TIMESTAMP WHERE storage_key = $1`,
      [storage_key]
    );

    res.json({ success: true, message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

/**
 * DELETE /api/v1/storage/attachment/:storage_key
 * Delete attachment from MinIO
 */
router.delete('/attachment/:storage_key', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { storage_key } = req.params;
    const tenantId = req.tenant.id;

    // Verify storage record exists
    const result = await db.query(
      `SELECT * FROM email_storage WHERE storage_key = $1 AND tenant_id = $2 AND storage_type = 'attachment'`,
      [storage_key, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete from MinIO
    await storageService.deleteAttachment(storage_key, tenantId);

    // Update database record
    await db.query(
      `UPDATE email_storage SET archived_at = CURRENT_TIMESTAMP WHERE storage_key = $1`,
      [storage_key]
    );

    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

/**
 * GET /api/v1/storage/usage
 * Get storage usage for current tenant
 */
router.get('/usage', authenticateToken, validateTenant, async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const result = await db.query(
      `SELECT storage_type, file_count, total_bytes, total_gb, last_upload
       FROM tenant_storage_usage
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const usage = {
      emails: { count: 0, bytes: 0, gb: 0 },
      attachments: { count: 0, bytes: 0, gb: 0 },
      total: { count: 0, bytes: 0, gb: 0 }
    };

    result.rows.forEach(row => {
      if (row.storage_type === 'email') {
        usage.emails = {
          count: row.file_count,
          bytes: row.total_bytes,
          gb: row.total_gb
        };
      } else if (row.storage_type === 'attachment') {
        usage.attachments = {
          count: row.file_count,
          bytes: row.total_bytes,
          gb: row.total_gb
        };
      }
    });

    usage.total.count = usage.emails.count + usage.attachments.count;
    usage.total.bytes = (usage.emails.bytes || 0) + (usage.attachments.bytes || 0);
    usage.total.gb = parseFloat((usage.total.bytes / 1024 / 1024 / 1024).toFixed(2));

    res.json({ success: true, usage });
  } catch (error) {
    console.error('Error getting storage usage:', error);
    res.status(500).json({ error: 'Failed to get storage usage' });
  }
});

module.exports = router;
