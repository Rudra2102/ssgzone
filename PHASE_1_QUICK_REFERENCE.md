# PHASE 1 - QUICK REFERENCE CHECKLIST

## 📋 FILES TO CREATE (4 NEW FILES)

### 1️⃣ File: `api-gateway/src/middleware/auth.js`
- [ ] Create new file
- [ ] Copy authentication middleware code
- [ ] Verify JWT verification logic
- [ ] Check error handling

### 2️⃣ File: `api-gateway/src/middleware/tenantCheck.js`
- [ ] Create new file
- [ ] Copy tenant isolation middleware code
- [ ] Verify tenant comparison logic
- [ ] Check error handling

### 3️⃣ File: `api-gateway/src/middleware/rateLimit.js`
- [ ] Create new file
- [ ] Copy rate limiting middleware code
- [ ] Verify 100 requests per 15 min limit
- [ ] Check response headers

### 4️⃣ File: `api-gateway/src/middleware/inputValidation.js`
- [ ] Create new file
- [ ] Copy input validation middleware code
- [ ] Verify email validation
- [ ] Verify UUID validation
- [ ] Check sanitization logic

---

## 📝 FILES TO MODIFY (2 FILES)

### 1️⃣ File: `api-gateway/src/routes/communication.js`
**Location:** Top of file (after `const express = require('express');`)

**Add these 4 lines:**
```javascript
const auth = require('../middleware/auth');
const tenantCheck = require('../middleware/tenantCheck');
const rateLimit = require('../middleware/rateLimit');
const inputValidation = require('../middleware/inputValidation');
```

**Then after `const router = express.Router();` add:**
```javascript
router.use(auth);
router.use(rateLimit);
router.use(inputValidation);
```

- [ ] Added require statements
- [ ] Added middleware to router
- [ ] Verified no syntax errors

### 2️⃣ File: `.env` (in project root)
**Verify this line exists:**
```
JWT_SECRET=ssgzone_pems_production_secret_2025_secure
```

- [ ] JWT_SECRET exists in .env
- [ ] Value is correct
- [ ] No typos

---

## 🧪 TESTING CHECKLIST (6 TESTS)

### Test 1: No Token (Should return 401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo
```
- [ ] Returns 401 Unauthorized
- [ ] Message: "No authorization token provided"

### Test 2: Invalid Token (Should return 401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer invalid_token"
```
- [ ] Returns 401 Unauthorized
- [ ] Message: "Invalid token"

### Test 3: Valid Token (Should return 200)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"
```
- [ ] Returns 200 OK
- [ ] Returns stats object
- [ ] No error message

### Test 4: Cross-Tenant Access (Should return 403)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/other_tenant \
  -H "Authorization: Bearer DEMO_TENANT_TOKEN"
```
- [ ] Returns 403 Forbidden
- [ ] Message: "You do not have access to this tenant"

### Test 5: Rate Limiting (Should return 429 after 100 requests)
```bash
for i in {1..101}; do
  curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```
- [ ] First 100 requests return 200
- [ ] Request 101 returns 429
- [ ] Message: "Rate limit exceeded"

### Test 6: Invalid Email Input (Should return 400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"demo","to":"invalid-email","subject":"Test"}'
```
- [ ] Returns 400 Bad Request
- [ ] Message: "to must be a valid email address"

---

## ✅ FINAL VERIFICATION

### Code Quality
- [ ] No syntax errors
- [ ] All imports correct
- [ ] All middleware functions exported
- [ ] Error handling complete

### Security
- [ ] JWT verification working
- [ ] Tenant isolation enforced
- [ ] Rate limiting active
- [ ] Input validation working

### Functionality
- [ ] All 6 tests passing
- [ ] API still running
- [ ] No console errors
- [ ] Response headers correct

### Documentation
- [ ] Code comments added
- [ ] Error messages clear
- [ ] Middleware logic documented

---

## 🚀 EXECUTION TIMELINE

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Create auth.js | 5 min | ⏳ |
| 2 | Create tenantCheck.js | 5 min | ⏳ |
| 3 | Create rateLimit.js | 5 min | ⏳ |
| 4 | Create inputValidation.js | 5 min | ⏳ |
| 5 | Modify communication.js | 10 min | ⏳ |
| 6 | Verify .env | 5 min | ⏳ |
| 7 | Run Test 1 | 5 min | ⏳ |
| 8 | Run Test 2 | 5 min | ⏳ |
| 9 | Run Test 3 | 5 min | ⏳ |
| 10 | Run Test 4 | 5 min | ⏳ |
| 11 | Run Test 5 | 10 min | ⏳ |
| 12 | Run Test 6 | 5 min | ⏳ |
| **TOTAL** | **All Steps** | **~90 min** | ⏳ |

---

## 📞 TROUBLESHOOTING

### Problem: "Cannot find module"
**Solution:** Check file path is exactly: `api-gateway/src/middleware/filename.js`

### Problem: "JWT_SECRET is not defined"
**Solution:** Add to .env: `JWT_SECRET=ssgzone_pems_production_secret_2025_secure`

### Problem: "Middleware not applied"
**Solution:** Verify `router.use()` lines are added AFTER `const router = express.Router();`

### Problem: "Rate limit not working"
**Solution:** Make sure `router.use(rateLimit);` is before route definitions

### Problem: "Tenant check not working"
**Solution:** Verify URL has `tenant_id` parameter and user token has `tenant_id` claim

---

## 📊 SUCCESS CRITERIA

✅ Phase 1 is complete when:
1. All 4 middleware files created
2. Communication routes updated
3. All 6 tests passing
4. No errors in logs
5. API responding correctly

---

## 🎯 NEXT PHASE

After Phase 1 completion:
- [ ] Document authentication requirements
- [ ] Update API clients
- [ ] Notify frontend team
- [ ] Proceed to Phase 2 (Email System)

---

**Ready to Execute? Open a new chat and start implementing!** 🚀
