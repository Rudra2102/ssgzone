# Phase 1 Testing - Quick Reference Card

## 🎯 Quick Start

```bash
# 1. Start API Gateway
cd api-gateway
npm start

# 2. Get a token (in another terminal)
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.ssgzone.in","password":"password"}'

# 3. Copy the token from response and use in tests below
```

---

## ✅ Test Commands (Copy & Paste)

### Test 1: No Token (401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo
```

### Test 2: Invalid Token (401)
```bash
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer invalid_token_here"
```

### Test 3: Valid Token (200)
```bash
# Replace YOUR_TOKEN with actual token
curl -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Cross-Tenant Access (403)
```bash
# Replace YOUR_TOKEN with demo tenant token
curl -X GET http://localhost:4000/api/v1/communication/email/stats/other_tenant \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 5: Rate Limiting (429)
```bash
# PowerShell - Run 101 requests
for ($i = 1; $i -le 101; $i++) {
  $response = curl -s -w "%{http_code}" -o /dev/null \
    -X GET http://localhost:4000/api/v1/communication/email/stats/demo \
    -H "Authorization: Bearer YOUR_TOKEN"
  Write-Host "Request $i - Status: $response"
}
```

### Test 6: Invalid Email (400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"demo","to":"invalid-email","subject":"Test"}'
```

### Test 6a: Missing tenant_id (400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","subject":"Test"}'
```

### Test 6b: Empty subject (400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"demo","to":"user@example.com","subject":""}'
```

### Test 6c: Invalid UUID (400)
```bash
curl -X POST http://localhost:4000/api/v1/communication/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id":"not-a-uuid","message":"Hello"}'
```

---

## 📊 Expected Results Summary

| Test | Endpoint | Status | Error |
|------|----------|--------|-------|
| 1 | GET /email/stats/demo | 401 | No authorization token provided |
| 2 | GET /email/stats/demo | 401 | Invalid token |
| 3 | GET /email/stats/demo | 200 | (success) |
| 4 | GET /email/stats/other_tenant | 403 | You do not have access to this tenant |
| 5 | GET /email/stats/demo (101x) | 429 | Rate limit exceeded |
| 6 | POST /email/send | 400 | to must be a valid email address |
| 6a | POST /email/send | 400 | tenant_id is required |
| 6b | POST /email/send | 400 | subject is required and must be non-empty |
| 6c | POST /chat/messages | 400 | room_id must be a valid UUID |

---

## 🔧 Troubleshooting

**API not responding?**
```bash
curl http://localhost:4000/health
```

**Token expired?**
```bash
# Get a new token
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.ssgzone.in","password":"password"}'
```

**Rate limit still active?**
- Wait 15 minutes for the window to reset
- Or restart the API server to clear in-memory rate limit

**Database connection error?**
- Check `.env` file has correct DB credentials
- Verify PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

---

## ✨ All Tests Passing? 

You're ready for Phase 2! 🚀

Next steps:
1. Commit test results
2. Deploy to production server
3. Run tests on production
4. Begin Phase 2: Email System Implementation
