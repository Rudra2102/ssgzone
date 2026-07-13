const express = require('express');
const multer = require('multer');
const router = express.Router();
const StorageService = require('../services/storageService');
const { authenticateToken } = require('../middleware/auth');
const { scanBuffer } = require('../services/clamavService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE) || 100 * 1024 * 1024 // 100MB
  }
});

// Upload attachment
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const scanResult = await scanBuffer(req.file.buffer, req.file.originalname);
    if (!scanResult.clean) {
      return res.status(422).json({ error: 'File rejected: virus detected', virus: scanResult.virus });
    }

    const tenantId = req.user.tenant_id;
    const messageId = req.body.message_id || 'temp';

    const attachment = await StorageService.uploadAttachment(req.file, tenantId, messageId);
    
    res.json({
      success: true,
      attachment: {
        key: attachment.key,
        filename: attachment.originalName,
        size: attachment.size,
        content_type: attachment.contentType
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download attachment
router.get('/download/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const tenantId = req.user.tenant_id;

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

// Delete attachment
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const tenantId = req.user.tenant_id;

    await StorageService.deleteAttachment(key, tenantId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// GET /health - ClamAV health check
router.get('/health', async (req, res) => {
  const { checkClamdHealth } = require('../services/clamavService');
  const healthy = await checkClamdHealth();
  res.status(healthy ? 200 : 503).json({ clamav: healthy ? 'ok' : 'unavailable' });
});

module.exports = router;