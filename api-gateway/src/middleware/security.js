const crypto = require('crypto');

// CSRF Protection (Disabled for development - enable in production with session management)
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for development
  // TODO: Enable in production with proper session management
  next();
};

// Generate CSRF token
const generateCSRFToken = () => crypto.randomBytes(32).toString('hex');

// Timing-safe string comparison
const timingSafeCompare = (a, b) => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>\"'&]/g, (match) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return entities[match];
  });
};

// Path traversal protection
const validatePath = (path) => {
  const normalized = require('path').normalize(path);
  return !normalized.includes('..') && !normalized.startsWith('/');
};

module.exports = {
  csrfProtection,
  generateCSRFToken,
  timingSafeCompare,
  sanitizeInput,
  validatePath
};