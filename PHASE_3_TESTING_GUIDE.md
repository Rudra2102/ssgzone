# Phase 3 Testing Guide - Bulk Operations

## Prerequisites
- SSGzone running in Docker
- Frontend running on http://localhost:3000
- API Gateway running on http://localhost:4000
- SuperAdmin logged in
- At least one SaaS application created

## Test Credentials

### Super Admin
- **URL**: http://localhost:3000
- **Username**: superadmin
- **Password**: admin123

## Phase 3 Test Scenarios

---

### Test 1: CSV File Upload

**Objective**: Verify CSV file upload and parsing

**Steps:**
1. Login as SuperAdmin
2. Navigate to Dashboard → Tenant Management tab
3. Click "Bulk Import" button
4. Click on the upload area or drag a CSV file
5. Select `sample_tenants_import.csv`

**Expected Result:**
- ✅ File name displays in upload area
- ✅ Preview table shows first 5 rows
- ✅ Total row count displays correctly
- ✅ Import button becomes enabled

**Error Cases:**
- Upload non-CSV file → Should show error
- Upload empty CSV → Should show error
- Upload CSV without headers → Should show error

---

### Test 2: CSV Preview Display

**Objective**: Verify preview table shows correct data

**Steps:**
1. After uploading CSV file
2. Review the preview table

**Expected Result:**
- ✅ Table shows 5 columns: Company Name, Slug, SaaS App ID, Admin Name, Max Users
- ✅ First 5 rows display correctly
- ✅ Data matches CSV file content
- ✅ Total row count shows at bottom

---

### Test 3: Bulk Import - All Success

**Objective**: Import multiple tenants successfully

**Steps:**
1. Prepare CSV with 5 unique tenants
2. Upload CSV file
3. Review preview
4. Click "Import 5 Tenants" button
5. Wait for import to complete

**Expected Result:**
- ✅ Progress indicator shows during import
- ✅ Results section displays after completion
- ✅ Total: 5, Success: 5, Failed: 0
- ✅ Success table shows all 5 tenants
- ✅ Each tenant has domain and admin email
- ✅ Tenant list refreshes automatically

**Verification:**
```sql
SELECT company_name, company_slug, domain, admin_email 
FROM tenant_companies 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### Test 4: Bulk Import - Duplicate Slug

**Objective**: Handle duplicate slug errors

**Steps:**
1. Import a tenant with slug "techcorp"
2. Prepare CSV with another tenant using slug "techcorp"
3. Upload and import CSV

**Expected Result:**
- ✅ Total: 1, Success: 0, Failed: 1
- ✅ Failed table shows error: "Tenant with slug 'techcorp' already exists"
- ✅ Error message is clear and actionable

---

### Test 5: Bulk Import - Invalid SaaS App ID

**Objective**: Handle invalid SaaS application ID

**Steps:**
1. Prepare CSV with saas_app_id = 999 (non-existent)
2. Upload and import CSV

**Expected Result:**
- ✅ Total: 1, Success: 0, Failed: 1
- ✅ Failed table shows error: "Invalid SaaS application ID"

---

### Test 6: Bulk Import - Missing Required Fields

**Objective**: Validate required field enforcement

**Steps:**
1. Prepare CSV with missing company_name
2. Upload and import CSV

**Expected Result:**
- ✅ Total: 1, Success: 0, Failed: 1
- ✅ Failed table shows error: "Missing required fields"

---

### Test 7: Bulk Import - Mixed Results

**Objective**: Handle partial success scenario

**Steps:**
1. Prepare CSV with 5 tenants:
   - 3 valid new tenants
   - 1 duplicate slug
   - 1 invalid SaaS app ID
2. Upload and import CSV

**Expected Result:**
- ✅ Total: 5, Success: 3, Failed: 2
- ✅ Success table shows 3 valid tenants
- ✅ Failed table shows 2 failed tenants with specific errors
- ✅ Valid tenants are created despite failures

---

### Test 8: Bulk Create Tenants API (Direct)

**Objective**: Test bulk create API endpoint directly

**Steps:**
```bash
# Get SuperAdmin token first
TOKEN=$(curl -X POST http://localhost:4000/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"admin123"}' \
  | jq -r '.data.token')

# Bulk create tenants
curl -X POST http://localhost:4000/api/v1/super-admin/tenants/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tenants": [
      {
        "company_name": "API Test Corp",
        "slug": "apitest",
        "saas_app_id": "1",
        "admin_name": "API Admin",
        "max_users": 50
      },
      {
        "company_name": "Another Corp",
        "slug": "anothercorp",
        "saas_app_id": "1",
        "admin_name": "Another Admin",
        "max_users": 75
      }
    ]
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": [
      {
        "id": "uuid",
        "company_name": "API Test Corp",
        "domain": "apitest.pems.ssgzone.in",
        "admin_credentials": {
          "username": "admin",
          "password": "Welcome@123",
          "login_url": "https://apitest.pems.ssgzone.in/admin"
        }
      },
      ...
    ],
    "failed": []
  }
}
```

---

### Test 9: Bulk Create Users API

**Objective**: Test bulk user creation for a tenant

**Steps:**
```bash
# Get tenant ID
TENANT_ID=$(curl -X GET http://localhost:4000/api/v1/super-admin/tenants \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].id')

# Bulk create users
curl -X POST http://localhost:4000/api/v1/super-admin/users/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"tenant_id\": \"$TENANT_ID\",
    \"users\": [
      {
        \"username\": \"john.doe\",
        \"email\": \"john.doe@company.com\",
        \"first_name\": \"John\",
        \"last_name\": \"Doe\",
        \"role\": \"user\"
      },
      {
        \"username\": \"jane.smith\",
        \"email\": \"jane.smith@company.com\",
        \"first_name\": \"Jane\",
        \"last_name\": \"Smith\",
        \"role\": \"manager\"
      }
    ]
  }"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": [
      {
        "id": "uuid",
        "username": "john.doe",
        "email": "john.doe@company.com",
        "default_password": "Welcome@123"
      },
      ...
    ],
    "failed": []
  }
}
```

---

### Test 10: Large CSV Import

**Objective**: Test performance with large CSV file

**Steps:**
1. Create CSV with 100 tenants
2. Upload and import
3. Monitor progress

**Expected Result:**
- ✅ Import completes within reasonable time (< 2 minutes)
- ✅ Progress indicator shows during import
- ✅ Results display correctly
- ✅ No timeout errors

---

### Test 11: CSV Format Validation

**Objective**: Test various CSV format issues

**Test Cases:**

**A. Missing Headers**
```csv
TechCorp,techcorp,1,John Smith,100
```
**Expected**: Error - "Invalid CSV format"

**B. Extra Columns**
```csv
company_name,slug,saas_app_id,admin_name,max_users,extra_column
TechCorp,techcorp,1,John Smith,100,extra_data
```
**Expected**: Import succeeds, extra column ignored

**C. Special Characters**
```csv
company_name,slug,saas_app_id,admin_name,max_users
"Tech, Corp & Co.",techcorp,1,"John Smith, Jr.",100
```
**Expected**: Import succeeds with proper parsing

**D. Empty Rows**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,techcorp,1,John Smith,100

GlobalCorp,globalcorp,1,Jane Doe,150
```
**Expected**: Empty rows skipped, valid rows imported

---

### Test 12: UI/UX Validation

**Objective**: Verify user interface behavior

**Checklist:**
- [x] Bulk Import button visible and styled correctly
- [x] Dialog opens smoothly
- [x] Upload area has hover effect
- [x] File name displays after selection
- [x] Preview table is scrollable
- [x] Import button disabled until file uploaded
- [x] Progress indicator shows during import
- [x] Results cards color-coded (green/red)
- [x] Success/failed tables scrollable
- [x] Close button works
- [x] Dialog resets on close

---

### Test 13: Error Recovery

**Objective**: Test system behavior after errors

**Steps:**
1. Import CSV with all failures
2. Close dialog
3. Open dialog again
4. Import valid CSV

**Expected Result:**
- ✅ Previous errors cleared
- ✅ New import works correctly
- ✅ No residual state from previous import

---

### Test 14: Concurrent Imports

**Objective**: Test multiple simultaneous imports

**Steps:**
1. Open two browser tabs
2. Login as SuperAdmin in both
3. Start import in both tabs simultaneously

**Expected Result:**
- ✅ Both imports complete successfully
- ✅ No duplicate tenants created
- ✅ No database conflicts

---

### Test 15: Admin Credentials Verification

**Objective**: Verify generated admin credentials work

**Steps:**
1. Import a tenant via CSV
2. Note the admin credentials from results
3. Logout as SuperAdmin
4. Login as Tenant Admin using generated credentials

**Expected Result:**
- ✅ Login successful with username "admin"
- ✅ Password "Welcome@123" works
- ✅ Redirected to Tenant Admin Dashboard
- ✅ Company name displays correctly

---

## Database Verification Queries

### Check Imported Tenants
```sql
SELECT 
  tc.company_name, 
  tc.company_slug, 
  tc.domain, 
  tc.admin_email,
  sa.name as saas_app,
  tc.created_at
FROM tenant_companies tc
JOIN saas_applications sa ON tc.saas_app_id = sa.id
ORDER BY tc.created_at DESC
LIMIT 10;
```

### Check Tenant Admin Users
```sql
SELECT 
  tu.username,
  tu.email,
  tu.first_name,
  tu.last_name,
  tu.role,
  tc.company_name
FROM tenant_users tu
JOIN tenant_companies tc ON tu.tenant_id = tc.id
WHERE tu.role = 'admin'
ORDER BY tu.created_at DESC
LIMIT 10;
```

### Check Bulk Created Users
```sql
SELECT 
  username,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at
FROM tenant_users
WHERE tenant_id = 'YOUR_TENANT_ID'
ORDER BY created_at DESC;
```

---

## Performance Benchmarks

### Expected Performance
- **Single Tenant Creation**: < 500ms
- **10 Tenants Bulk**: < 5 seconds
- **50 Tenants Bulk**: < 25 seconds
- **100 Tenants Bulk**: < 50 seconds

### CSV Parsing
- **Small File (< 1KB)**: < 100ms
- **Medium File (< 100KB)**: < 500ms
- **Large File (< 1MB)**: < 2 seconds

---

## Troubleshooting

### Issue: Import button stays disabled
**Solution**: 
- Check if CSV file uploaded successfully
- Verify CSV has valid headers
- Check browser console for errors

### Issue: Preview shows wrong data
**Solution**:
- Verify CSV is comma-separated
- Check for special characters
- Ensure proper encoding (UTF-8)

### Issue: All imports fail
**Solution**:
- Verify SaaS App ID exists
- Check database connection
- Review API gateway logs: `docker logs ssgzone-api-gateway-1`

### Issue: Duplicate slug errors
**Solution**:
- Check existing tenants for slug conflicts
- Use unique slugs in CSV
- Delete existing tenant if needed

---

## Success Criteria

✅ CSV upload works smoothly
✅ Preview displays correctly
✅ Bulk import creates multiple tenants
✅ Validation prevents duplicates
✅ Error messages are clear
✅ Progress feedback works
✅ Results display accurately
✅ Admin credentials generated
✅ Performance is acceptable
✅ UI is intuitive

---

## Phase 3 Complete! 🎉

All bulk operations tests passing = Ready for Phase 4

**Next Phase**: Bulk Edit/Delete Operations and Export Functionality
