const crypto = require('crypto');

// ── CSRF — Double Submit Cookie pattern ──────────────────────────────────────
// 1. On GET /auth/csrf-token  → server sets a signed cookie + returns token in body
// 2. Client stores token and sends it as X-CSRF-Token header on every mutating request
// 3. Middleware validates header === cookie value (timing-safe)
//
// Why Double Submit Cookie (not csurf/session)?
// - API is stateless JWT — no server-side session exists
// - Double Submit Cookie is the OWASP-recommended pattern for stateless APIs
// - Cookie is SameSite=Strict which already blocks most CSRF; header check adds defence-in-depth

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_BYTES = 32;

// Routes exempt from CSRF (read-only or pre-auth)
const CSRF_EXEMPT = new Set([
  '/health',
  '/test',
  '/api/v1/auth/csrf-token',
]);

// Path prefixes exempt from CSRF
const CSRF_EXEMPT_PREFIXES = [
  '/api/v1/webmail/auth/login',
  '/api/v1/webmail/auth/sso',
  '/api/v1/webmail/2fa/verify',
  '/api/v1/super-admin/auth/login',
  '/api/v1/tenant-admin/auth/login',
  '/api/v1/employee/auth/login',
  '/api/saas-admin/login',
  '/api/v1/webmail/track/',   // pixel tracking — no auth
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
];

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function generateCSRFToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function csrfProtection(req, res, next) {
  // Only enforce on state-changing methods
  if (!MUTATING_METHODS.has(req.method)) return next();

  // Exact path exemptions
  if (CSRF_EXEMPT.has(req.path)) return next();

  // Prefix exemptions
  for (const prefix of CSRF_EXEMPT_PREFIXES) {
    if (req.path.startsWith(prefix)) return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: 'Forbidden', message: 'CSRF token missing' });
  }

  if (!timingSafeCompare(cookieToken, headerToken)) {
    return res.status(403).json({ error: 'Forbidden', message: 'CSRF token invalid' });
  }

  next();
}

// Sanitize input strings
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>"'&]/g, (match) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return entities[match];
  });
}

// Path traversal protection
function validatePath(filePath) {
  const normalized = require('path').normalize(filePath);
  return !normalized.includes('..') && !normalized.startsWith('/');
}

module.exports = {
  csrfProtection,
  generateCSRFToken,
  timingSafeCompare,
  sanitizeInput,
  validatePath,
  CSRF_COOKIE,
};
