const compression = require('compression');

// Compression middleware with optimized settings
const compressionMiddleware = compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Compress all responses by default
    return compression.filter(req, res);
  }
});

module.exports = compressionMiddleware;