const express = require('express');
const multer = require('multer');
const pool = require('../services/DatabaseService');
const router = express.Router();
const StorageService = require('../services/storageService');
const { authenticateToken } = require('../middleware/auth');
const { scanBuffer } = require('../services/clamavService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE) || 100 * 1024 * 1024 }
});

// POST /api/v1/attachments/upload — multi-file upload
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files provided' });

    const tenantId = req.user.tenant_id;
    const messageId = req.body.message_id || 'temp';
    const results = [];

    for (const file of files) {
      const scanResult = await scanBuffer(file.buffer, file.originalname);
      if (!scanResult.clean) {
        return res.status(422).json({ error: `File rejected: virus detected in ${file.originalname}`, virus: scanResult.virus });
      }
      const attachment = await StorageService.uploadAttachment(file, tenantId, messageId);
      results.push({
        id: attachment.key,
        filename: attachment.originalName,
        file_size: attachment.size,
        content_type: attachment.contentType,
        key: attachment.key
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/attachments/:id — download/stream (supports ?token= query param)
router.get('/:id', async (req, res) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token required' });

    const jwt = require('jsonwebtoken');
    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET not set'); })() : 'super-admin-secret'));
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const key = req.params.id;
    const tenantId = user.tenant_id;
    const metadata = await StorageService.getAttachmentMetadata(key, tenantId);
    const stream = await StorageService.getAttachment(key, tenantId);

    res.set({
      'Content-Type': metadata.contentType,
      'Content-Length': metadata.size,
      'Content-Disposition': `attachment; filename="${metadata.metadata['original-name']}"`
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({ error: 'Attachment not found' });
  }
});

// GET /api/v1/attachments/email/:emailId — list attachments for an email
router.get('/email/:emailId', authenticateToken, async (req, res) => {
  try {
            const result = await pool.query(
      `SELECT id, filename, file_size, content_type, storage_key, created_at
       FROM email_attachments WHERE email_id = $1`,
      [req.params.emailId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List attachments error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/attachments/:key
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    await StorageService.deleteAttachment(req.params.key, req.user.tenant_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// GET /health
router.get('/health', async (req, res) => {
  const { checkClamdHealth } = require('../services/clamavService');
  const healthy = await checkClamdHealth();
  res.status(healthy ? 200 : 503).json({ clamav: healthy ? 'ok' : 'unavailable' });
});

module.exports = router;
