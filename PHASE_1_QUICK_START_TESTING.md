# Phase 1 Testing - Quick Start Guide (2 Minutes)

## 🚀 Start Here

### Step 1: Start API (Terminal 1)
```bash
cd api-gateway
npm start
```

Wait for: `Server running on port 4000`

---

### Step 2: Get Token (Terminal 2)
```bash
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.ssgzone.in","password":"password"}'
```

**Copy the `token` value from response**

---

### Step 3: Run Tests

Replace `YOUR_TOKEN` with the token from Step 2.

#### ✅ Test 1: No Token (Should fail with 401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo
```
**Expected:** `"error":"Unauthorized","message":"No authorization token provided"` | Status: **401**

---

#### ✅ Test 2: Invalid Token (Should fail with 401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer invalid_token"
```
**Expected:** `"error":"Unauthorized","message":"Invalid token"` | Status: **401**

---

#### ✅ Test 3: Valid Token (Should succeed with 200)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** `"success":true,"stats":{...}` | Status: **200**

---

#### ✅ Test 4: Cross-Tenant (Should fail with 403)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/other_tenant \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** `"error":"Forbidden","message":"You do not have access to this tenant"` | Status: **403**

---

#### ✅ Test 5: Rate Limit (Should fail with 429 after 100 requests)
```bash
# PowerShell
for ($i = 1; $i -le 101; $i++) {
  $status = curl -s -o /dev/null -w "%{http_code}" \
    -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
    -H "Authorization: Bearer YOUR_TOKEN"
  if ($i -eq 100 -or $i -eq 101) { Write-Host "Request $i: $status" }
}
```
**Expected:** Requests 1-100 = **200**, Request 101 = **429**

---

#### ✅ Test 6: Invalid Email (Should fail with 400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"demo","to":"invalid-email","subject":"Test"}'
```
**Expected:** `"error":"Bad Request","message":"to must be a valid email address"` | Status: **400**

---

#### ✅ Test 7: Missing tenant_id (Should fail with 400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","subject":"Test"}'
```
**Expected:** `"error":"Bad Request","message":"tenant_id is required"` | Status: **400**

---

#### ✅ Test 8: Empty subject (Should fail with 400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"demo","to":"user@example.com","subject":""}'
```
**Expected:** `"error":"Bad Request","message":"subject is required and must be non-empty"` | Status: **400**

---

#### ✅ Test 9: Invalid UUID (Should fail with 400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id":"not-a-uuid","message":"Hello"}'
```
**Expected:** `"error":"Bad Request","message":"room_id must be a valid UUID"` | Status: **400**

---

## 📊 Quick Results

| Test | Expected | Your Result | Status |
|------|----------|-------------|--------|
| 1 | 401 | ___ | [ ] ✓ |
| 2 | 401 | ___ | [ ] ✓ |
| 3 | 200 | ___ | [ ] ✓ |
| 4 | 403 | ___ | [ ] ✓ |
| 5 | 429 | ___ | [ ] ✓ |
| 6 | 400 | ___ | [ ] ✓ |
| 7 | 400 | ___ | [ ] ✓ |
| 8 | 400 | ___ | [ ] ✓ |
| 9 | 400 | ___ | [ ] ✓ |

---

## ✅ All Tests Passed?

If all 9 tests show correct status codes:

```bash
# Commit results
git add PHASE_1_TESTING_*.md
git commit -m "test: Phase 1 security testing complete - all tests passed"
git push origin main

# Ready for Phase 2!
```

---

## ❌ Test Failed?

1. Check API is running: `curl http://localhost:4000/health`
2. Verify token is valid (get new one if needed)
3. Check .env has JWT_SECRET
4. Review detailed guide: `PHASE_1_TESTING_GUIDE.md`

---

**Total Time: ~5-10 minutes** ⏱️
