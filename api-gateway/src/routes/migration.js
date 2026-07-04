const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../services/DatabaseService');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/migrations');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mbox', '.pst'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only MBOX and PST files are allowed'));
    }
  }
});

// Upload and start migration (Task 2.2)
router.post('/upload', authenticateToken, requireTenantAdmin, upload.single('mailbox_file'), async (req, res) => {
  try {
    const { target_email } = req.body;
    const tenantId = req.user.tenant_id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!target_email) {
      return res.status(400).json({ error: 'Target email is required' });
    }
    
    // Verify target user exists and belongs to tenant
    const userQuery = `
      SELECT u.id FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = $1 AND t.id = $2
    `;
    const userResult = await db.query(userQuery, [target_email, tenantId]);
    
    if (userResult.rows.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Target user not found in your tenant' });
    }
    
    const userId = userResult.rows[0].id;
    const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);
    
    // Create migration job
    const jobQuery = `
      INSERT INTO migration_jobs (
        tenant_id, user_id, target_email, file_type, 
        file_name, file_size, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id
    `;
    
    const jobResult = await db.query(jobQuery, [
      tenantId, userId, target_email, fileType,
      req.file.filename, req.file.size
    ]);
    
    const jobId = jobResult.rows[0].id;
    
    // Start background processing
    setImmediate(() => {
      require('../services/MigrationService').processMigrationJob(jobId, req.file.path);
    });
    
    res.json({
      success: true,
      jobId,
      message: 'Migration job created and processing started',
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
    
  } catch (error) {
    console.error('Migration upload error:', error);
    
    // Clean up file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to start migration' });
  }
});

// Get migration job status
router.get('/status/:jobId', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { jobId } = req.params;
    const tenantId = req.user.tenant_id;
    
    const query = `
      SELECT * FROM migration_jobs 
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await db.query(query, [jobId, tenantId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    // Get progress details
    const progressQuery = `
      SELECT step, status, message, timestamp 
      FROM migration_progress 
      WHERE job_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    const progressResult = await db.query(progressQuery, [jobId]);
    
    res.json({
      success: true,
      job: result.rows[0],
      progress: progressResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching migration status:', error);
    res.status(500).json({ error: 'Failed to fetch migration status' });
  }
});

// Get all migration jobs for tenant
router.get('/jobs', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { limit = 20, offset = 0 } = req.query;
    
    const query = `
      SELECT id, target_email, file_type, file_name, file_size, 
             status, progress_percentage, total_messages, imported_messages,
             created_at, started_at, completed_at
      FROM migration_jobs 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [tenantId, limit, offset]);
    
    res.json({
      success: true,
      jobs: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching migration jobs:', error);
    res.status(500).json({ error: 'Failed to fetch migration jobs' });
  }
});

module.exports = router;