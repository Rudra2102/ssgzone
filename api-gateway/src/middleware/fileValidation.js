const path = require('path');
const fs = require('fs');

const validateFilePath = (filePath) => {
  const normalized = path.normalize(filePath);
  
  // Prevent path traversal
  if (normalized.includes('..') || normalized.startsWith('/')) {
    throw new Error('Invalid file path');
  }
  
  return normalized;
};

const validateFileUpload = (req, res, next) => {
  if (req.file) {
    try {
      // Validate filename
      const safeName = validateFilePath(req.file.originalname);
      req.file.safeName = safeName;
      
      // Validate file size (10MB max)
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large' });
      }
      
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.mbox', '.pst'];
      const ext = path.extname(safeName).toLowerCase();
      
      if (!allowedTypes.includes(ext)) {
        return res.status(400).json({ error: 'File type not allowed' });
      }
      
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  
  next();
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

module.exports = {
  validateFilePath,
  validateFileUpload,
  sanitizeFilename
};