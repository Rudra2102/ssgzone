# Phase 1 Testing - Step-by-Step Walkthrough

## 📋 Complete Testing Workflow

### Step 0: Preparation

**Terminal 1 - Start API Gateway**
```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone\api-gateway
npm install
npm start
```

Wait for output like:
```
Server running on port 4000
Database connected
```

**Terminal 2 - Run Tests**
```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone
# Stay in project root for running tests
```

---

## 🧪 Test Execution

### Step 1: Get Authentication Token

**Command:**
```bash
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.ssgzone.in","password":"password"}'
```

**Expected Output:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGRlbW8uc3Nnem9uZS5pbiIsInRlbmFudF9pZCI6ImRlbW8iLCJmdWxsX25hbWUiOiJUZXN0IFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MTcwMDAwMzU5OX0.xxxxx",
  "user": {
    "id": "user-123",
    "email": "test@demo.ssgzone.in",
    "tenant_id": "demo",
    "full_name": "Test User",
    "role": "admin"
  }
}
```

**Action:** Copy the `token` value. You'll use it in all subsequent tests.

**Save it as:** `YOUR_TOKEN` (we'll use this placeholder in examples)

---

### Step 2: Test Authentication - No Token (Test 1)

**Command:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo
```

**Expected Output:**
```json
{
  "error": "Unauthorized",
  "message": "No authorization token provided"
}
```

**Expected HTTP Status:** `401 Unauthorized`

**✅ Pass Criteria:** Exact match with above response

**What it proves:** Auth middleware is active and requires tokens

---

### Step 3: Test Authentication - Invalid Token (Test 2)

**Command:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Output:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

**Expected HTTP Status:** `401 Unauthorized`

**✅ Pass Criteria:** Exact match with above response

**What it proves:** JWT verification is working correctly

---

### Step 4: Test Authentication - Valid Token (Test 3)

**Command:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Replace `YOUR_TOKEN` with the actual token from Step 1.

**Expected Output:**
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

**Expected HTTP Status:** `200 OK`

**✅ Pass Criteria:** Status 200 and success: true

**What it proves:** Valid tokens are accepted and requests succeed

---

### Step 5: Test Tenant Isolation - Cross-Tenant Access (Test 4)

**Command:**
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/other_tenant \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Replace `YOUR_TOKEN` with the demo tenant token from Step 1.

**Expected Output:**
```json
{
  "error": "Forbidden",
  "message": "You do not have access to this tenant"
}
```

**Expected HTTP Status:** `403 Forbidden`

**✅ Pass Criteria:** Exact match with above response

**What it proves:** Tenant isolation middleware prevents cross-tenant access

---

### Step 6: Test Rate Limiting (Test 5)

This test requires sending 101 requests rapidly.

**PowerShell Command:**
```powershell
$token = "YOUR_TOKEN"
$passed = 0
$failed = 0

for ($i = 1; $i -le 101; $i++) {
  $response = curl -s -w "%{http_code}" -o /dev/null `
    -X GET http://localhost:4000/api/v1/communication/email/stats/demo `
    -H "Authorization: Bearer $token"
  
  if ($i -le 100) {
    if ($response -eq "200") {
      $passed++
    } else {
      Write-Host "ERROR: Request $i returned $response (expected 200)"
      $failed++
    }
  } else {
    if ($response -eq "429") {
      Write-Host "✓ Request 101 correctly rate limited: $response"
    } else {
      Write-Host "ERROR: Request 101 returned $response (expected 429)"
      $failed++
    }
  }
  
  if ($i % 10 -eq 0) {
    Write-Host "Progress: $i/101 requests sent..."
  }
}

Write-Host "Summary: $passed passed, $failed failed"
```

**Expected Output:**
```
Progress: 10/101 requests sent...
Progress: 20/101 requests sent...
...
Progress: 100/101 requests sent...
✓ Request 101 correctly rate limited: 429
Summary: 100 passed, 0 failed
```

**For Request 101, Full Response:**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Max 100 requests per 15 minutes",
  "retryAfter": 899
}
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700003599
```

**✅ Pass Criteria:** 
- Requests 1-100 return 200
- Request 101 returns 429
- Rate limit headers present

**What it proves:** Rate limiting middleware enforces 100 req/15min limit

---

### Step 7: Test Input Validation - Invalid Email (Test 6)

**Command:**
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "to": "invalid-email",
    "subject": "Test Email"
  }'
```

**Expected Output:**
```json
{
  "error": "Bad Request",
  "message": "to must be a valid email address"
}
```

**Expected HTTP Status:** `400 Bad Request`

**✅ Pass Criteria:** Exact match with above response

**What it proves:** Email validation is working

---

### Step 8: Test Input Validation - Missing tenant_id (Test 6a)

**Command:**
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email"
  }'
```

**Expected Output:**
```json
{
  "error": "Bad Request",
  "message": "tenant_id is required and must be a string"
}
```

**Expected HTTP Status:** `400 Bad Request`

**✅ Pass Criteria:** Exact match with above response

**What it proves:** Required field validation is working

---

### Step 9: Test Input Validation - Empty Subject (Test 6b)

**Command:**
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "to": "user@example.com",
    "subject": ""
  }'
```

**Expected Output:**
```json
{
  "error": "Bad Request",
  "message": "subject is required and must be a non-empty string"
}
```

**Expected HTTP Status:** `400 Bad Request`

**✅ Pass Criteria:** Exact match with above response

**What it proves:** Empty string validation is working

---

### Step 10: Test Input Validation - Invalid UUID (Test 6c)

**Command:**
```bash
curl -X POST http://localhost:4000/api/v1/communication/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "not-a-uuid",
    "message": "Hello World"
  }'
```

**Expected Output:**
```json
{
  "error": "Bad Request",
  "message": "room_id is required and must be a valid UUID"
}
```

**Expected HTTP Status:** `400 Bad Request`

**✅ Pass Criteria:** Exact match with above response

**What it proves:** UUID format validation is working

---

## 📊 Final Test Results

### Checklist

- [ ] Step 1: Token obtained successfully
- [ ] Step 2: Test 1 (No Token) - 401 ✓
- [ ] Step 3: Test 2 (Invalid Token) - 401 ✓
- [ ] Step 4: Test 3 (Valid Token) - 200 ✓
- [ ] Step 5: Test 4 (Cross-Tenant) - 403 ✓
- [ ] Step 6: Test 5 (Rate Limiting) - 429 ✓
- [ ] Step 7: Test 6 (Invalid Email) - 400 ✓
- [ ] Step 8: Test 6a (Missing tenant_id) - 400 ✓
- [ ] Step 9: Test 6b (Empty Subject) - 400 ✓
- [ ] Step 10: Test 6c (Invalid UUID) - 400 ✓

---

## ✅ Success Criteria

**Phase 1 is COMPLETE when:**
- ✅ All 10 tests pass
- ✅ All HTTP status codes match expected values
- ✅ All response messages match expected values
- ✅ Rate limiting works correctly (100 req/15min)
- ✅ Tenant isolation prevents cross-tenant access
- ✅ Input validation catches all invalid inputs

---

## 🚀 Next Steps After Passing All Tests

1. **Commit test results:**
   ```bash
   git add PHASE_1_TESTING_GUIDE.md PHASE_1_TESTING_QUICK_REFERENCE.md
   git commit -m "docs: add Phase 1 testing guides"
   git push origin main
   ```

2. **Deploy to production server:**
   ```bash
   ssh root@223.177.40.176
   cd /opt/ssgzone
   git pull origin main
   npm install
   pm2 restart ssgzone-api
   ```

3. **Run tests on production:**
   - Repeat all tests against production URL
   - Verify all tests pass on production

4. **Begin Phase 2:**
   - Email system implementation
   - SMTP/IMAP configuration
   - Email queue processing

---

## 🆘 Troubleshooting

### Issue: "Cannot GET /api/v1/communication/email/stats/demo"

**Solution:** 
- Check if API is running: `curl http://localhost:4000/health`
- Check if communication routes are registered in server.js
- Verify middleware is applied correctly

### Issue: "Invalid token" for valid token

**Solution:**
- Verify JWT_SECRET in .env matches the one used to generate token
- Check token hasn't expired
- Get a new token from login endpoint

### Issue: Rate limit not working

**Solution:**
- Rate limit is in-memory, resets every 15 minutes
- Restart API to clear rate limit: `npm start`
- Check if middleware is applied: `router.use(rateLimit)`

### Issue: Tenant check not working

**Solution:**
- Verify tenant_id in URL matches user's tenant_id from token
- Check if tenantCheck middleware is applied
- Verify token contains correct tenant_id

---

## 📝 Notes

- All tests should be run in order
- Keep the API running throughout all tests
- Use the same token for all tests (unless testing token expiration)
- Rate limit resets every 15 minutes
- Input validation is endpoint-specific

---

**Testing Duration:** ~10-15 minutes for all tests
**Success Rate Target:** 100% (all 10 tests passing)
