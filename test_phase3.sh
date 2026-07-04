# Phase 3 Bulk Operations - Simple Test

echo "========================================"
echo "Phase 3 Bulk Operations Test"
echo "========================================"
echo ""

# Test 1: Login
echo "[1/3] Testing SuperAdmin Login..."
curl -X POST http://localhost:4000/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}" \
  -s | jq -r '.data.token' > token.txt

if [ -s token.txt ]; then
    echo "✓ Login successful!"
    TOKEN=$(cat token.txt)
else
    echo "✗ Login failed!"
    exit 1
fi

echo ""

# Test 2: Bulk Create Tenants
echo "[2/3] Testing Bulk Create Tenants..."
TIMESTAMP=$(date +%s)
curl -X POST http://localhost:4000/api/v1/super-admin/tenants/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"tenants\": [
      {
        \"company_name\": \"Test Corp 1\",
        \"slug\": \"test1-$TIMESTAMP\",
        \"saas_app_id\": \"1\",
        \"admin_name\": \"Admin 1\",
        \"max_users\": 50
      },
      {
        \"company_name\": \"Test Corp 2\",
        \"slug\": \"test2-$TIMESTAMP\",
        \"saas_app_id\": \"1\",
        \"admin_name\": \"Admin 2\",
        \"max_users\": 75
      }
    ]
  }" \
  -s | jq '.data | {total, success: .success | length, failed: .failed | length}'

echo ""

# Test 3: CSV Import
echo "[3/3] Testing CSV Import..."
curl -X POST http://localhost:4000/api/v1/super-admin/tenants/import-csv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"csv_data\": [
      {
        \"company_name\": \"CSV Corp 1\",
        \"slug\": \"csv1-$TIMESTAMP\",
        \"saas_app_id\": \"1\",
        \"admin_name\": \"CSV Admin 1\",
        \"max_users\": \"60\"
      }
    ]
  }" \
  -s | jq '.data | {total, success: .success | length, failed: .failed | length}'

echo ""
echo "========================================"
echo "✓ All Phase 3 endpoints tested!"
echo "========================================"
echo ""
echo "Next: Test UI at http://localhost:3000"
echo ""

# Cleanup
rm -f token.txt
