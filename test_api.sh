#!/bin/bash

echo "=== SSGzone API Test Script ==="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s http://localhost:4000/health | jq .
echo ""

# Test 2: Super Admin Login
echo "2. Testing Super Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"admin123"}')

echo $LOGIN_RESPONSE | jq .
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token extracted: ${TOKEN:0:50}..."
echo ""

# Test 3: Dashboard Stats
echo "3. Testing Dashboard Stats..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/super-admin/dashboard/stats | jq .
echo ""

# Test 4: Get SaaS Apps
echo "4. Testing Get SaaS Apps..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/super-admin/saas-apps | jq .
echo ""

# Test 5: Create SaaS App
echo "5. Testing Create SaaS App..."
curl -s -X POST http://localhost:4000/api/v1/super-admin/saas-apps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"PEMS","slug":"pems","description":"Prashast Enterprise Management System","webhook_url":""}' | jq .
echo ""

# Test 6: Get Tenants
echo "6. Testing Get Tenants..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/super-admin/tenants | jq .
echo ""

echo "=== Test Complete ==="