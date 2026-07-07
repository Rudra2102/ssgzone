# Phase 1 Security Testing Guide

## 🚀 Prerequisites

Before running tests, ensure:
1. API Gateway is running on `http://localhost:4000`
2. Database is connected and accessible
3. `.env` file has `JWT_SECRET=ssgzone_pems_production_secret_2025_secure`
4. Node dependencies are installed: `npm install` in `api-gateway/`

### Start API Gateway

```bash
cd api-gateway
npm install
npm start
# or
node src/server.js
```

---

## 📋 Test Cases (6 Total)

### Test 1: No Token (Should return 401)

**Scenario:** Request without authorization header

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

**Expected Status:** `401 Unauthorized`

**What it tests:** Auth middleware validates token presence

---

### Test 2: Invalid Token (Should return 401)

**Scenario:** Request with malformed/invalid token

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

**Expected Status:** `401 Unauthorized`

**What it tests:** JWT verification fails for invalid tokens

---

### Test 3: Valid Token (Should return 200)

**Step 1:** Get a valid token by logging in

```bash
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@demo.ssgzone.in",
    "password": "password"
  }'
```

**Response will contain:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "test@demo.ssgzone.in",
    "tenant_id": "demo",
    "full_name": "Test User",
    "role": "admin"
  }
}
```

**Step 2:** Copy the token and use it in the next request

```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the actual token from Step 1.

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

**Expected Status:** `200 OK`

**What it tests:** Valid JWT token is accepted and request succeeds

---

### Test 4: Cross-Tenant Access (Should return 403)

**Scenario:** User tries to access a different tenant's data

**Prerequisites:**
- Have a valid token for tenant `demo`
- Try to access tenant `other_tenant`

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

**Expected Status:** `403 Forbidden`

**What it tests:** Tenant isolation middleware prevents cross-tenant access

---

### Test 5: Rate Limiting (Should return 429 after 100 requests)

**Scenario:** Exceed 100 requests in 15 minutes

```bash
# Windows PowerShell
for ($i = 1; $i -le 101; $i++) {
  $response = curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo `
    -H "Authorization: Bearer YOUR_TOKEN" -s -w "%{http_code}"
  Write-Host "Request $i - Status: $($response[-3..-1] -join '')"
  if ($i -eq 100) { Write-Host "Request 100 completed. Next request should be rate limited." }
}
```

**Or using Bash (Linux/Mac):**
```bash
for i in {1..101}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
    -H "Authorization: Bearer YOUR_TOKEN")
  echo "Request $i - Status: $status"
  if [ $i -eq 100 ]; then echo "Request 100 completed. Next request should be rate limited."; fi
done
```

**Expected Results:**
- Requests 1-100: Status `200 OK`
- Request 101: Status `429 Too Many Requests`

**Response for Request 101:**
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
X-RateLimit-Reset: 1234567890
```

**What it tests:** Rate limiting middleware enforces 100 req/15min limit

---

### Test 6: Invalid Email Input (Should return 400)

**Scenario:** Send email with invalid email address

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

**Expected Response:**
```json
{
  "error": "Bad Request",
  "message": "to must be a valid email address"
}
```

**Expected Status:** `400 Bad Request`

**What it tests:** Input validation middleware validates email format

---

## 🧪 Additional Input Validation Tests

### Test 6a: Missing tenant_id

```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test"
  }'
```

**Expected:** `400 Bad Request` - "tenant_id is required and must be a string"

---

### Test 6b: Empty subject

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

**Expected:** `400 Bad Request` - "subject is required and must be a non-empty string"

---

### Test 6c: Chat room with invalid name length

```bash
curl -X POST http://localhost:4000/api/v1/communication/chat/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "name": "'"$(printf 'a%.0s' {1..256})"'"
  }'
```

**Expected:** `400 Bad Request` - "name must be less than 255 characters"

---

### Test 6d: Chat message with invalid UUID

```bash
curl -X POST http://localhost:4000/api/v1/communication/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "not-a-uuid",
    "message": "Hello"
  }'
```

**Expected:** `400 Bad Request` - "room_id is required and must be a valid UUID"

---

## 📊 Testing Checklist

- [ ] Test 1: No Token → 401 ✓
- [ ] Test 2: Invalid Token → 401 ✓
- [ ] Test 3: Valid Token → 200 ✓
- [ ] Test 4: Cross-Tenant Access → 403 ✓
- [ ] Test 5: Rate Limiting → 429 ✓
- [ ] Test 6: Invalid Email → 400 ✓
- [ ] Test 6a: Missing tenant_id → 400 ✓
- [ ] Test 6b: Empty subject → 400 ✓
- [ ] Test 6c: Invalid name length → 400 ✓
- [ ] Test 6d: Invalid UUID → 400 ✓

---

## 🔍 Debugging Tips

### Check if API is running
```bash
curl http://localhost:4000/health
```

### View API logs
```bash
# If using PM2
pm2 logs ssgzone-api

# If running directly
# Check console output
```

### Verify JWT_SECRET is set
```bash
# Windows
echo %JWT_SECRET%

# Linux/Mac
echo $JWT_SECRET
```

### Test with Postman

1. Create a new request
2. Set method to GET
3. URL: `http://localhost:4000/api/v1/communication/email/stats/demo`
4. Go to "Authorization" tab
5. Select "Bearer Token"
6. Paste your token
7. Send

---

## 📝 Notes

- Rate limit resets every 15 minutes
- Tokens expire based on your login endpoint configuration
- All middleware runs in order: auth → rateLimit → inputValidation
- Tenant check is optional (only validates if tenant_id in URL)
- Input validation is endpoint-specific (email/send, chat/rooms, chat/messages)

---

## ✅ Success Criteria

All 6 main tests + 4 additional tests should pass:
- ✅ Authentication working (Tests 1, 2, 3)
- ✅ Tenant isolation working (Test 4)
- ✅ Rate limiting working (Test 5)
- ✅ Input validation working (Tests 6, 6a, 6b, 6c, 6d)

Once all tests pass, Phase 1 is complete and ready for deployment!
