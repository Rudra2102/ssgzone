# Phase 3 - Bulk Operations - Quick Reference

## 🎯 What Was Implemented

### Backend APIs (3 New Endpoints)
1. **POST /api/v1/super-admin/tenants/bulk-create** - Create multiple tenants at once
2. **POST /api/v1/super-admin/users/bulk-create** - Create multiple users for a tenant
3. **POST /api/v1/super-admin/tenants/import-csv** - Import tenants from CSV file

### Frontend Features
1. **Bulk Import Button** - Added to Tenant Management tab
2. **CSV Upload Dialog** - Drag-and-drop file upload interface
3. **Preview Table** - Shows first 5 rows before import
4. **Progress Indicator** - Real-time import status
5. **Results Dashboard** - Visual summary with success/failed breakdown

---

## 🚀 Quick Start Guide

### For SuperAdmin - CSV Import

**Step 1: Prepare CSV File**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp Solutions,techcorp,1,John Smith,100
Global Enterprises,globalent,1,Sarah Johnson,150
```

**Step 2: Import via UI**
1. Login as SuperAdmin (superadmin/admin123)
2. Go to Dashboard → Tenant Management tab
3. Click "Bulk Import" button
4. Upload CSV file
5. Review preview
6. Click "Import X Tenants"
7. Review results

**Step 3: Verify**
- Check success count
- Note admin credentials
- Verify tenants in list

---

## 📋 CSV File Format

### Required Columns
| Column | Description | Example |
|--------|-------------|---------|
| company_name | Full company name | TechCorp Solutions |
| slug | URL-friendly identifier | techcorp |
| saas_app_id | SaaS application ID | 1 |
| admin_name | Tenant admin full name | John Smith |

### Optional Columns
| Column | Description | Default |
|--------|-------------|---------|
| max_users | Maximum users allowed | 50 |
| admin_email | Admin email | Auto-generated |

### Sample Template
Location: `d:\Pradeep_Singh\Creations\Softwares\SSGzone\sample_tenants_import.csv`

---

## 🔌 API Usage

### Get SuperAdmin Token
```bash
curl -X POST http://localhost:4000/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"admin123"}'
```

### Bulk Create Tenants
```bash
curl -X POST http://localhost:4000/api/v1/super-admin/tenants/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenants": [
      {
        "company_name": "TechCorp",
        "slug": "techcorp",
        "saas_app_id": "1",
        "admin_name": "John Smith",
        "max_users": 100
      }
    ]
  }'
```

### Bulk Create Users
```bash
curl -X POST http://localhost:4000/api/v1/super-admin/users/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenant_id": "TENANT_UUID",
    "users": [
      {
        "username": "john.doe",
        "email": "john.doe@company.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "user"
      }
    ]
  }'
```

### Import CSV
```bash
curl -X POST http://localhost:4000/api/v1/super-admin/tenants/import-csv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "csv_data": [
      {
        "company_name": "TechCorp",
        "slug": "techcorp",
        "saas_app_id": "1",
        "admin_name": "John Smith",
        "max_users": "100"
      }
    ]
  }'
```

---

## ✅ Validation Rules

### Tenant Creation
- ✅ company_name: Required, non-empty
- ✅ slug: Required, unique per SaaS app, lowercase
- ✅ saas_app_id: Required, must exist
- ✅ admin_name: Required, non-empty
- ✅ max_users: Optional, default 50

### User Creation
- ✅ username: Required, unique per tenant
- ✅ email: Required, unique per tenant, valid format
- ✅ first_name: Required, non-empty
- ✅ last_name: Required, non-empty
- ✅ role: Optional, default "user"

---

## 🎨 UI Components

### Bulk Import Dialog Sections

**1. Upload Area**
- Drag-and-drop zone
- Click to browse
- File name display
- Accepts .csv files only

**2. Preview Table**
- Shows first 5 rows
- Columns: Company Name, Slug, SaaS App ID, Admin Name, Max Users
- Total row count
- Scrollable

**3. Import Button**
- Disabled until file uploaded
- Shows row count: "Import X Tenants"
- Progress indicator during import
- Changes to "Importing..." when active

**4. Results Dashboard**
- Summary cards: Total, Success, Failed
- Color-coded (grey, green, red)
- Success table with created tenants
- Failed table with error messages
- Scrollable tables

---

## 🔍 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "total": 5,
    "success": [
      {
        "id": "uuid",
        "company_name": "TechCorp",
        "company_slug": "techcorp",
        "domain": "techcorp.pems.ssgzone.in",
        "admin_email": "admin@techcorp.pems.ssgzone.in",
        "admin_credentials": {
          "username": "admin",
          "password": "Welcome@123",
          "login_url": "https://techcorp.pems.ssgzone.in/admin"
        }
      }
    ],
    "failed": [
      {
        "tenant": {
          "company_name": "DupeCorp",
          "slug": "dupecorp"
        },
        "error": "Tenant with slug 'dupecorp' already exists"
      }
    ]
  }
}
```

---

## 🐛 Common Errors

### "Missing required columns"
**Cause**: CSV missing required headers
**Solution**: Ensure CSV has: company_name, slug, saas_app_id, admin_name

### "Tenant with slug already exists"
**Cause**: Duplicate slug in database
**Solution**: Use unique slug or delete existing tenant

### "Invalid SaaS application ID"
**Cause**: saas_app_id doesn't exist
**Solution**: Get correct ID from Applications tab

### "Missing required fields"
**Cause**: Empty values in required columns
**Solution**: Fill all required fields in CSV

---

## 📊 Database Schema

### Tenant Creation Flow
1. Insert into `tenant_companies` table
2. Create admin user in `tenant_users` table
3. Create default settings in `tenant_communication_settings` table
4. Return tenant details with credentials

### Generated Data
- **Domain**: `{slug}.{saas_slug}.ssgzone.in`
- **Admin Email**: `admin@{domain}`
- **Admin Username**: `admin`
- **Admin Password**: `Welcome@123`
- **Status**: `active`

---

## 🔐 Security Features

1. **JWT Authentication**: Required for all endpoints
2. **SuperAdmin Authorization**: Only SuperAdmin can bulk create
3. **Input Validation**: Server-side validation for all fields
4. **SQL Injection Prevention**: Parameterized queries
5. **Duplicate Prevention**: Unique constraint checks
6. **Password Hashing**: bcrypt with salt rounds
7. **Error Sanitization**: No sensitive data in errors

---

## 📈 Performance Metrics

### Expected Performance
- Single tenant: < 500ms
- 10 tenants: < 5 seconds
- 50 tenants: < 25 seconds
- 100 tenants: < 50 seconds

### CSV Parsing
- Small file (< 1KB): < 100ms
- Medium file (< 100KB): < 500ms
- Large file (< 1MB): < 2 seconds

---

## 🧪 Testing Commands

### Test Bulk Create API
```bash
# Set token
TOKEN="your_super_admin_token"

# Create 2 tenants
curl -X POST http://localhost:4000/api/v1/super-admin/tenants/bulk-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tenants": [
      {"company_name": "Test Corp 1", "slug": "test1", "saas_app_id": "1", "admin_name": "Admin 1", "max_users": 50},
      {"company_name": "Test Corp 2", "slug": "test2", "saas_app_id": "1", "admin_name": "Admin 2", "max_users": 75}
    ]
  }' | jq
```

### Verify in Database
```sql
-- Check created tenants
SELECT company_name, company_slug, domain, admin_email, created_at 
FROM tenant_companies 
ORDER BY created_at DESC 
LIMIT 5;

-- Check admin users
SELECT tu.username, tu.email, tc.company_name 
FROM tenant_users tu
JOIN tenant_companies tc ON tu.tenant_id = tc.id
WHERE tu.role = 'admin'
ORDER BY tu.created_at DESC 
LIMIT 5;
```

---

## 📁 Files Modified

### Backend
- `api-gateway/src/routes/super-admin.js` (+300 lines)
  - Added bulk-create endpoint
  - Added users bulk-create endpoint
  - Added import-csv endpoint

### Frontend
- `unified-login/src/SuperAdminDashboard.js` (+200 lines)
  - Added bulk import dialog
  - Added CSV upload handler
  - Added preview table
  - Added results dashboard

### Documentation
- `PHASE_3_BULK_OPERATIONS.md` - Complete implementation guide
- `PHASE_3_TESTING_GUIDE.md` - Comprehensive testing scenarios
- `sample_tenants_import.csv` - CSV template

---

## 🎯 Success Criteria

✅ Bulk create multiple tenants at once
✅ CSV import working with preview
✅ Validation prevents duplicates
✅ Progress feedback to user
✅ Detailed success/failed breakdown
✅ Error messages are clear
✅ Admin credentials generated
✅ UI is intuitive
✅ Performance is acceptable
✅ Security measures in place

---

## 🚀 Next Steps (Phase 4)

1. **Bulk Edit Operations** - Update multiple tenants
2. **Bulk Delete Operations** - Delete with confirmation
3. **Export to CSV** - Download tenant list
4. **Scheduled Imports** - Automated CSV processing
5. **Webhook Integration** - Notify external SaaS

---

## 📞 Support

### Troubleshooting
1. Check API gateway logs: `docker logs ssgzone-api-gateway-1`
2. Check database connection: `docker ps | findstr postgres`
3. Verify frontend running: `netstat -ano | findstr :3000`

### Common Issues
- Import button disabled → Upload CSV first
- All imports fail → Check SaaS App ID
- Duplicate errors → Use unique slugs
- CSV not parsing → Check format and encoding

---

## 🎉 Phase 3 Status

**Status**: ✅ COMPLETE

**Endpoints Added**: 3
**UI Components Added**: 1 major dialog
**Documentation Created**: 3 files
**Sample Files**: 1 CSV template

**Ready for Phase 4**: ✅ YES

---

**Last Updated**: March 11, 2026
**Version**: 1.0.0
**Author**: SSGzone Development Team
