# SSGzone Communication Platform - PHASE 1 IMPLEMENTATION PLAN
## Security Implementation (Authentication & Tenant Isolation)

**Phase:** 1 of 7  
**Duration:** 1 week (3-4 days actual work)  
**Priority:** CRITICAL  
**Status:** Ready for Implementation

---

## 📋 PHASE 1 OVERVIEW

### Objectives
1. Add JWT authentication to all communication endpoints
2. Add tenant isolation verification
3. Add rate limiting
4. Add input validation

### Expected Outcome
- All endpoints require valid JWT token
- Users can only access their own tenant's data
- API protected from abuse
- All inputs validated

### Files to Modify
- `api-gateway/src/routes/communication.js` (MODIFY)
- `api-gateway/src/server.js` (MODIFY)

### Files to Create
- `api-gateway/src/middleware/auth.js` (NEW)
- `api-gateway/src/middleware/tenantCheck.js` (NEW)
- `api-gateway/src/middleware/rateLimit.js` (NEW)
- `api-gateway/src/middleware/inputValidation.js` (NEW)

---

## 🔧 STEP-BY-STEP IMPLEMENTATION

### STEP 1: Create Authentication Middleware

**File to Create:** `api-gateway/src/middleware/auth.js`

**Action:** Create NEW file with this exact content:

```javascript
const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies JWT token and extracts user information
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No authorization token provided'
      });
    }

    // Extract token (format: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid authorization header format'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tenant_id: decoded.tenant_id,
      full_name: decoded.full_name,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
};

module.exports = authMiddleware;
```

**Verification:** File should be created at `api-gateway/src/middleware/auth.js`

---

### STEP 2: Create Tenant Check Middleware

**File to Create:** `api-gateway/src/middleware/tenantCheck.js`

**Action:** Create NEW file with this exact content:

```javascript
/**
 * Tenant Isolation Middleware
 * Verifies user belongs to the requested tenant
 */
const tenantCheckMiddleware = (req, res, next) => {
  try {
    // Get tenant_id from URL parameters
    const tenantIdFromUrl = req.params.tenant_id;
    
    // Get tenant_id from authenticated user
    const userTenantId = req.user?.tenant_id;

    // If no tenant_id in URL, allow (some endpoints don't have it)
    if (!tenantIdFromUrl) {
      return next();
    }

    // Verify user's tenant matches requested tenant
    if (tenantIdFromUrl !== userTenantId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have access to this tenant'
      });
    }

    next();
  } catch (error) {
    res.status(403).json({ 
      error: 'Forbidden',
      message: 'Tenant verification failed'
    });
  }
};

module.exports = tenantCheckMiddleware;
```

**Verification:** File should be created at `api-gateway/src/middleware/tenantCheck.js`

---

### STEP 3: Create Rate Limiting Middleware

**File to Create:** `api-gateway/src/middleware/rateLimit.js`

**Action:** Create NEW file with this exact content:

```javascript
/**
 * Rate Limiting Middleware
 * Limits requests per user/tenant to prevent abuse
 */

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map();

const rateLimitMiddleware = (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    const tenantId = req.user?.tenant_id || 'anonymous';
    const key = `${tenantId}:${userId}`;
    
    // Rate limit: 100 requests per 15 minutes
    const LIMIT = 100;
    const WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

    const now = Date.now();
    
    // Get or create request record
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 0, resetTime: now + WINDOW });
    }

    const record = requestCounts.get(key);

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + WINDOW;
    }

    // Increment counter
    record.count++;

    // Check if limit exceeded
    if (record.count > LIMIT) {
      return res.status(429).json({ 
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${LIMIT} requests per 15 minutes`,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    // Add rate limit info to response headers
    res.set('X-RateLimit-Limit', LIMIT);
    res.set('X-RateLimit-Remaining', LIMIT - record.count);
    res.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    next();
  } catch (error) {
    // On error, allow request but log it
    console.error('Rate limit error:', error);
    next();
  }
};

module.exports = rateLimitMiddleware;
```

**Verification:** File should be created at `api-gateway/src/middleware/rateLimit.js`

---

### STEP 4: Create Input Validation Middleware

**File to Create:** `api-gateway/src/middleware/inputValidation.js`

**Action:** Create NEW file with this exact content:

```javascript
/**
 * Input Validation Middleware
 * Validates and sanitizes user inputs
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // Remove potentially dangerous characters
  return str.replace(/[<>\"']/g, '');
};

const inputValidationMiddleware = (req, res, next) => {
  try {
    // Validate tenant_id if present in URL
    if (req.params.tenant_id) {
      if (typeof req.params.tenant_id !== 'string' || req.params.tenant_id.length === 0) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'Invalid tenant_id'
        });
      }
    }

    // Validate body if present
    if (req.body && typeof req.body === 'object') {
      // Check for required fields based on endpoint
      const { method, path } = req;

      // Email send validation
      if (method === 'POST' && path.includes('/email/send')) {
        const { tenant_id, to, subject } = req.body;
        
        if (!tenant_id || typeof tenant_id !== 'string') {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'tenant_id is required and must be a string'
          });
        }

        if (!to || !validateEmail(to)) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'to must be a valid email address'
          });
        }

        if (!subject || typeof subject !== 'string' || subject.length === 0) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'subject is required and must be a non-empty string'
          });
        }

        // Sanitize strings
        req.body.subject = sanitizeString(req.body.subject);
        if (req.body.html_content) {
          req.body.html_content = sanitizeString(req.body.html_content);
        }
      }

      // Chat room creation validation
      if (method === 'POST' && path.includes('/chat/rooms')) {
        const { tenant_id, name, created_by } = req.body;
        
        if (!tenant_id || typeof tenant_id !== 'string') {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'tenant_id is required'
          });
        }

        if (!name || typeof name !== 'string' || name.length === 0) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'name is required and must be non-empty'
          });
        }

        if (name.length > 255) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'name must be less than 255 characters'
          });
        }

        // Sanitize name
        req.body.name = sanitizeString(req.body.name);
      }

      // Chat message validation
      if (method === 'POST' && path.includes('/chat/messages')) {
        const { room_id, message } = req.body;
        
        if (!room_id || !validateUUID(room_id)) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'room_id is required and must be a valid UUID'
          });
        }

        if (!message || typeof message !== 'string' || message.length === 0) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'message is required and must be non-empty'
          });
        }

        if (message.length > 5000) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'message must be less than 5000 characters'
          });
        }

        // Sanitize message
        req.body.message = sanitizeString(req.body.message);
      }
    }

    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(400).json({ 
      error: 'Bad Request',
      message: 'Input validation failed'
    });
  }
};

module.exports = inputValidationMiddleware;
```

**Verification:** File should be created at `api-gateway/src/middleware/inputValidation.js`

---

### STEP 5: Update Communication Routes

**File to Modify:** `api-gateway/src/routes/communication.js`

**Action:** Add these lines at the TOP of the file (after `const express = require('express');`):

```javascript
const auth = require('../middleware/auth');
const tenantCheck = require('../middleware/tenantCheck');
const rateLimit = require('../middleware/rateLimit');
const inputValidation = require('../middleware/inputValidation');
```

**Then:** Add these lines AFTER `const router = express.Router();` and BEFORE the first route definition:

```javascript
// Apply middleware to all routes
router.use(auth);           // Require authentication
router.use(rateLimit);      // Apply rate limiting
router.use(inputValidation); // Validate inputs
```

**Location in file:** Around line 5-10 (after router initialization)

**Verification:** 
- Lines should be added at the very beginning of the file
- All routes will now require authentication

---

### STEP 6: Update Server Configuration

**File to Modify:** `api-gateway/src/server.js`

**Action:** Find this line:
```javascript
app.use('/api/v1/communication', communicationRoutes);
```

**Replace it with:**
```javascript
// Communication routes with authentication
app.use('/api/v1/communication', communicationRoutes);
```

**Note:** The line stays the same - the middleware is already applied in communication.js

**Verification:** No changes needed here, just confirming the route is registered

---

### STEP 7: Update Environment Variables

**File to Check:** `.env` (in project root)

**Action:** Verify these variables exist:

```
JWT_SECRET=ssgzone_pems_production_secret_2025_secure
```

**If missing:** Add it to `.env`

**Verification:** Run this command to check:
```bash
grep JWT_SECRET .env
```

Should output: `JWT_SECRET=ssgzone_pems_production_secret_2025_secure`

---

## 🧪 TESTING PHASE 1

### Test 1: Unauthenticated Access (Should FAIL)

**Command:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "No authorization token provided"
}
```

**Status Code:** 401

---

### Test 2: Invalid Token (Should FAIL)

**Command:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

**Status Code:** 401

---

### Test 3: Valid Token - Same Tenant (Should PASS)

**First, get a valid token from login:**
```bash
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.ssgzone.in","password":"password"}'
```

**Response will include:** `"token": "eyJhbGc..."`

**Then use that token:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total_emails": 0,
    "emails_today": 0,
    "delivered_count": 0,
    "bounced_count": 0,
    "unread_count": 0
  }
}
```

**Status Code:** 200

---

### Test 4: Cross-Tenant Access (Should FAIL)

**Using valid token from demo tenant, try to access other_tenant:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/other_tenant \
  -H "Authorization: Bearer YOUR_DEMO_TOKEN"
```

**Expected Response:**
```json
{
  "error": "Forbidden",
  "message": "You do not have access to this tenant"
}
```

**Status Code:** 403

---

### Test 5: Rate Limiting (Should FAIL after 100 requests)

**Send 101 requests in quick succession:**
```bash
for i in {1..101}; do
  curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```

**After 100 requests, response should be:**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Max 100 requests per 15 minutes",
  "retryAfter": 900
}
```

**Status Code:** 429

---

### Test 6: Input Validation (Should FAIL)

**Send email with invalid email address:**
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "to": "invalid-email",
    "subject": "Test"
  }'
```

**Expected Response:**
```json
{
  "error": "Bad Request",
  "message": "to must be a valid email address"
}
```

**Status Code:** 400

---

## ✅ COMPLETION CHECKLIST

### Files Created
- [ ] `api-gateway/src/middleware/auth.js` - Created
- [ ] `api-gateway/src/middleware/tenantCheck.js` - Created
- [ ] `api-gateway/src/middleware/rateLimit.js` - Created
- [ ] `api-gateway/src/middleware/inputValidation.js` - Created

### Files Modified
- [ ] `api-gateway/src/routes/communication.js` - Middleware added
- [ ] `.env` - JWT_SECRET verified

### Tests Passed
- [ ] Test 1: Unauthenticated access blocked (401)
- [ ] Test 2: Invalid token rejected (401)
- [ ] Test 3: Valid token accepted (200)
- [ ] Test 4: Cross-tenant access blocked (403)
- [ ] Test 5: Rate limiting works (429)
- [ ] Test 6: Input validation works (400)

### Verification
- [ ] All 4 middleware files created successfully
- [ ] Communication routes updated with middleware
- [ ] All 6 tests passing
- [ ] No errors in server logs
- [ ] API still running on port 4000

---

## 📝 NOTES FOR EXECUTION

### Important Points
1. **Order matters:** Create middleware files BEFORE modifying routes
2. **JWT_SECRET:** Must be set in `.env` file
3. **Token format:** Must be "Bearer TOKEN" in Authorization header
4. **Tenant isolation:** Checked against URL parameter and user's tenant_id
5. **Rate limiting:** Uses in-memory store (use Redis in production)

### Common Issues & Solutions

**Issue:** "Cannot find module '../middleware/auth'"
- **Solution:** Make sure all 4 middleware files are created in `api-gateway/src/middleware/`

**Issue:** "JWT_SECRET is not defined"
- **Solution:** Add `JWT_SECRET=ssgzone_pems_production_secret_2025_secure` to `.env`

**Issue:** "Unauthorized" error even with valid token
- **Solution:** Check token format is "Bearer TOKEN" (with space)

**Issue:** Rate limit not working
- **Solution:** Make sure rateLimit middleware is applied before routes

---

## 🚀 NEXT STEPS AFTER PHASE 1

Once Phase 1 is complete and all tests pass:

1. **Update documentation** with new authentication requirements
2. **Notify frontend team** to include JWT tokens in requests
3. **Update API clients** (SDKs, postman collections)
4. **Monitor logs** for any authentication errors
5. **Proceed to Phase 2** (Email System Completion)

---

## 📞 EXECUTION INSTRUCTIONS

### When Ready to Execute:

1. **Copy this entire document** to a new chat
2. **Follow each step exactly** as written
3. **Test after each step** to verify
4. **Don't skip any tests** - they verify security
5. **Report back** when all tests pass

### Expected Timeline:
- Step 1-4 (Create middleware): 30 minutes
- Step 5-6 (Update files): 15 minutes
- Step 7 (Verify env): 5 minutes
- Testing (6 tests): 30 minutes
- **Total: ~1.5 hours**

---

**Phase 1 Implementation Plan Ready for Execution** ✅

Jab aap ready ho to naya chat open karke ye plan execute karo. Sab kuch step-by-step likha hai!
