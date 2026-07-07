# PHASE 1: SECURITY IMPLEMENTATION - COMPLETE PROMPT

**Duration:** 1-2 hours | **Files:** 4 NEW + 2 MODIFY | **Tests:** 6

---

## 🎯 WHAT TO DO

Implement JWT authentication, tenant isolation, rate limiting, and input validation for all communication endpoints.

---

## 📁 FILES TO CREATE (4 NEW FILES)

### 1. CREATE: `api-gateway/src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No authorization token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization header format' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, tenant_id: decoded.tenant_id, full_name: decoded.full_name, role: decoded.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
```

---

### 2. CREATE: `api-gateway/src/middleware/tenantCheck.js`

```javascript
const tenantCheckMiddleware = (req, res, next) => {
  try {
    const tenantIdFromUrl = req.params.tenant_id;
    const userTenantId = req.user?.tenant_id;
    if (!tenantIdFromUrl) {
      return next();
    }
    if (tenantIdFromUrl !== userTenantId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have access to this tenant' });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant verification failed' });
  }
};

module.exports = tenantCheckMiddleware;
```

---

### 3. CREATE: `api-gateway/src/middleware/rateLimit.js`

```javascript
const requestCounts = new Map();

const rateLimitMiddleware = (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    const tenantId = req.user?.tenant_id || 'anonymous';
    const key = `${tenantId}:${userId}`;
    const LIMIT = 100;
    const WINDOW = 15 * 60 * 1000;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 0, resetTime: now + WINDOW });
    }
    const record = requestCounts.get(key);
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + WINDOW;
    }
    record.count++;
    if (record.count > LIMIT) {
      return res.status(429).json({ error: 'Too Many Requests', message: `Rate limit exceeded. Max ${LIMIT} requests per 15 minutes`, retryAfter: Math.ceil((record.resetTime - now) / 1000) });
    }
    res.set('X-RateLimit-Limit', LIMIT);
    res.set('X-RateLimit-Remaining', LIMIT - record.count);
    res.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next();
  }
};

module.exports = rateLimitMiddleware;
```

---

### 4. CREATE: `api-gateway/src/middleware/inputValidation.js`

```javascript
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
  return str.replace(/[<>\"']/g, '');
};

const inputValidationMiddleware = (req, res, next) => {
  try {
    if (req.params.tenant_id) {
      if (typeof req.params.tenant_id !== 'string' || req.params.tenant_id.length === 0) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid tenant_id' });
      }
    }
    if (req.body && typeof req.body === 'object') {
      const { method, path } = req;
      if (method === 'POST' && path.includes('/email/send')) {
        const { tenant_id, to, subject } = req.body;
        if (!tenant_id || typeof tenant_id !== 'string') {
          return res.status(400).json({ error: 'Bad Request', message: 'tenant_id is required and must be a string' });
        }
        if (!to || !validateEmail(to)) {
          return res.status(400).json({ error: 'Bad Request', message: 'to must be a valid email address' });
        }
        if (!subject || typeof subject !== 'string' || subject.length === 0) {
          return res.status(400).json({ error: 'Bad Request', message: 'subject is required and must be a non-empty string' });
        }
        req.body.subject = sanitizeString(req.body.subject);
        if (req.body.html_content) {
          req.body.html_content = sanitizeString(req.body.html_content);
        }
      }
      if (method === 'POST' && path.includes('/chat/rooms')) {
        const { tenant_id, name } = req.body;
        if (!tenant_id || typeof tenant_id !== 'string') {
          return res.status(400).json({ error: 'Bad Request', message: 'tenant_id is required' });
        }
        if (!name || typeof name !== 'string' || name.length === 0) {
          return res.status(400).json({ error: 'Bad Request', message: 'name is required and must be non-empty' });
        }
        if (name.length > 255) {
          return res.status(400).json({ error: 'Bad Request', message: 'name must be less than 255 characters' });
        }
        req.body.name = sanitizeString(req.body.name);
      }
      if (method === 'POST' && path.includes('/chat/messages')) {
        const { room_id, message } = req.body;
        if (!room_id || !validateUUID(room_id)) {
          return res.status(400).json({ error: 'Bad Request', message: 'room_id is required and must be a valid UUID' });
        }
        if (!message || typeof message !== 'string' || message.length === 0) {
          return res.status(400).json({ error: 'Bad Request', message: 'message is required and must be non-empty' });
        }
        if (message.length > 5000) {
          return res.status(400).json({ error: 'Bad Request', message: 'message must be less than 5000 characters' });
        }
        req.body.message = sanitizeString(req.body.message);
      }
    }
    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(400).json({ error: 'Bad Request', message: 'Input validation failed' });
  }
};

module.exports = inputValidationMiddleware;
```

---

## ✏️ FILES TO MODIFY (2 FILES)

### 1. MODIFY: `api-gateway/src/routes/communication.js`

**At the TOP of file (after `const express = require('express');`), add:**

```javascript
const auth = require('../middleware/auth');
const tenantCheck = require('../middleware/tenantCheck');
const rateLimit = require('../middleware/rateLimit');
const inputValidation = require('../middleware/inputValidation');
```

**After `const router = express.Router();`, add:**

```javascript
router.use(auth);
router.use(rateLimit);
router.use(inputValidation);
```

---

### 2. VERIFY: `.env` (in project root)

**Make sure this line exists:**

```
JWT_SECRET=ssgzone_pems_production_secret_2025_secure
```

If missing, add it.

---

## 🧪 TESTING (Run these 6 tests)

### Test 1: No Token (Should return 401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo
```
**Expected:** `{"error":"Unauthorized","message":"No authorization token provided"}` | Status: 401

---

### Test 2: Invalid Token (Should return 401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer invalid_token_here"
```
**Expected:** `{"error":"Unauthorized","message":"Invalid token"}` | Status: 401

---

### Test 3: Valid Token (Should return 200)

First, get a valid token:
```bash
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.ssgzone.in","password":"password"}'
```

Copy the token from response, then:
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
**Expected:** `{"success":true,"stats":{...}}` | Status: 200

---

### Test 4: Cross-Tenant Access (Should return 403)

Using your demo token, try to access another tenant:
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/other_tenant \
  -H "Authorization: Bearer YOUR_DEMO_TOKEN"
```
**Expected:** `{"error":"Forbidden","message":"You do not have access to this tenant"}` | Status: 403

---

### Test 5: Rate Limiting (Should return 429 after 100 requests)

```bash
for i in {1..101}; do
  curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```
**Expected:** First 100 return 200, request 101 returns 429 with message "Rate limit exceeded"

---

### Test 6: Invalid Email Input (Should return 400)

```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"demo","to":"invalid-email","subject":"Test"}'
```
**Expected:** `{"error":"Bad Request","message":"to must be a valid email address"}` | Status: 400

---

## ✅ COMPLETION CHECKLIST

- [ ] Created `api-gateway/src/middleware/auth.js`
- [ ] Created `api-gateway/src/middleware/tenantCheck.js`
- [ ] Created `api-gateway/src/middleware/rateLimit.js`
- [ ] Created `api-gateway/src/middleware/inputValidation.js`
- [ ] Modified `api-gateway/src/routes/communication.js` (added requires and middleware)
- [ ] Verified `.env` has JWT_SECRET
- [ ] Test 1 passing (401)
- [ ] Test 2 passing (401)
- [ ] Test 3 passing (200)
- [ ] Test 4 passing (403)
- [ ] Test 5 passing (429)
- [ ] Test 6 passing (400)

---

## 🚀 DEPLOYMENT (After Phase 1 Complete)

### Step 1: Commit to Git
```bash
cd /opt/ssgzone
git add .
git commit -m "feat: add authentication, tenant isolation, rate limiting, input validation"
git push origin main
```

### Step 2: SSH to Server
```bash
ssh root@223.177.40.176
```

### Step 3: Pull Latest Code
```bash
cd /opt/ssgzone
git pull origin main
```

### Step 4: Install Dependencies (if needed)
```bash
cd api-gateway
npm install
```

### Step 5: Restart API Service
```bash
pm2 restart ssgzone-api
```

### Step 6: Verify Deployment
```bash
pm2 logs ssgzone-api
curl http://localhost:4000/health
```

### Step 7: Test on Server
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo
# Should return 401 Unauthorized (no token)
```

---

## 📝 NOTES

- All 4 middleware files go in `api-gateway/src/middleware/`
- Middleware must be applied BEFORE route definitions
- JWT_SECRET must be in `.env`
- Tests must be run in order
- All 6 tests must pass before considering Phase 1 complete
- After deployment, verify tests still pass on server

---

**Status:** Ready to Execute | **Time:** 1-2 hours | **Next:** Phase 2 (Email System)
