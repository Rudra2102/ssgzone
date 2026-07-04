# CSV Import Format Guide

## 📋 Overview

This guide explains the CSV format required for bulk tenant import in SSGzone. The CSV format is **critical** for successful imports.

---

## 📥 How to Get the CSV Template

### Method 1: Download from UI (Recommended)
1. Login as SuperAdmin at http://localhost:3000
2. Go to **Dashboard** → **Tenant Management** tab
3. Click **"Bulk Import"** button
4. Click **"Download Template"** button in the dialog
5. A file named `tenant_import_template.csv` will be downloaded

### Method 2: Copy from Project Files
The sample CSV files are located at:
```
d:\Pradeep_Singh\Creations\Softwares\SSGzone\sample_tenants_import.csv
d:\Pradeep_Singh\Creations\Softwares\SSGzone\tenant_import_template_with_instructions.csv
```

### Method 3: Create Manually
Copy the following content and save as `.csv` file:
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp Solutions,techcorp,1,John Smith,100
Global Enterprises,globalent,1,Sarah Johnson,150
Innovation Labs,innovlab,1,Michael Chen,75
```

---

## 📊 CSV Format Specification

### Header Row (Required)
The first row MUST contain these exact column names (case-sensitive):
```
company_name,slug,saas_app_id,admin_name,max_users
```

### Column Details

#### 1. company_name (Required)
- **Description**: Full legal name of the company
- **Format**: Text, can contain spaces and special characters
- **Example**: `TechCorp Solutions`, `ABC Institute of Technology`
- **Validation**: Cannot be empty
- **Notes**: Use quotes if name contains commas: `"Smith, Johnson & Associates"`

#### 2. slug (Required)
- **Description**: URL-friendly identifier for the company
- **Format**: Lowercase letters, numbers, hyphens only
- **Example**: `techcorp`, `abc-institute`, `company123`
- **Validation**: 
  - Must be unique across all tenants
  - Lowercase only
  - No spaces or special characters (except hyphens)
  - Cannot be empty
- **Notes**: This becomes part of the domain: `{slug}.{saas_app}.ssgzone.in`

#### 3. saas_app_id (Required)
- **Description**: ID of the SaaS application this tenant belongs to
- **Format**: Number or UUID
- **Example**: `1`, `2`, `550e8400-e29b-41d4-a716-446655440000`
- **How to Get**: 
  1. Go to SuperAdmin Dashboard → Applications tab
  2. Find your SaaS application in the table
  3. Note the ID (usually visible in the URL or table)
- **Validation**: Must exist in the `saas_applications` table
- **Notes**: All tenants in one CSV should typically use the same saas_app_id

#### 4. admin_name (Required)
- **Description**: Full name of the tenant administrator
- **Format**: Text, first and last name
- **Example**: `John Smith`, `Sarah Johnson`, `Dr. Michael Chen`
- **Validation**: Cannot be empty
- **Notes**: This is used to create the admin user account

#### 5. max_users (Optional)
- **Description**: Maximum number of users allowed for this tenant
- **Format**: Positive integer
- **Example**: `50`, `100`, `500`
- **Default**: `50` (if not provided)
- **Validation**: Must be a positive number
- **Notes**: Can be left empty to use default value

---

## ✅ Valid CSV Examples

### Example 1: Minimal (Required Fields Only)
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp Solutions,techcorp,1,John Smith,
Global Enterprises,globalent,1,Sarah Johnson,
```
Note: Empty max_users will default to 50

### Example 2: Complete (All Fields)
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp Solutions,techcorp,1,John Smith,100
Global Enterprises,globalent,1,Sarah Johnson,150
Innovation Labs,innovlab,1,Michael Chen,75
Digital Dynamics,digitaldyn,1,Emily Davis,200
Future Systems,futuresys,1,David Wilson,50
```

### Example 3: With Special Characters
```csv
company_name,slug,saas_app_id,admin_name,max_users
"Smith, Johnson & Associates",smith-johnson,1,John Smith Jr.,100
O'Reilly Technologies,oreilly-tech,1,Patrick O'Brien,75
Müller GmbH,muller-gmbh,1,Hans Müller,50
```
Note: Use quotes when company name contains commas

### Example 4: Multiple SaaS Apps
```csv
company_name,slug,saas_app_id,admin_name,max_users
PEMS School 1,pems-school1,1,Admin One,100
PEMS School 2,pems-school2,1,Admin Two,150
LMS College 1,lms-college1,2,Admin Three,200
LMS College 2,lms-college2,2,Admin Four,250
```

---

## ❌ Common Mistakes to Avoid

### 1. Wrong Header Names
❌ **Wrong:**
```csv
Company Name,Slug,SaaS App ID,Admin Name,Max Users
```
✅ **Correct:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
```

### 2. Uppercase Slugs
❌ **Wrong:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,TechCorp,1,John Smith,100
```
✅ **Correct:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,techcorp,1,John Smith,100
```

### 3. Spaces in Slugs
❌ **Wrong:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,tech corp,1,John Smith,100
```
✅ **Correct:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,tech-corp,1,John Smith,100
```

### 4. Missing Required Fields
❌ **Wrong:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,,1,John Smith,100
```
✅ **Correct:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,techcorp,1,John Smith,100
```

### 5. Invalid SaaS App ID
❌ **Wrong:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,techcorp,999,John Smith,100
```
✅ **Correct:** (Use actual SaaS App ID from your system)
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp,techcorp,1,John Smith,100
```

### 6. Duplicate Slugs
❌ **Wrong:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp 1,techcorp,1,John Smith,100
TechCorp 2,techcorp,1,Jane Doe,150
```
✅ **Correct:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp 1,techcorp1,1,John Smith,100
TechCorp 2,techcorp2,1,Jane Doe,150
```

---

## 🔧 Creating CSV Files

### Using Microsoft Excel
1. Open Excel
2. Enter data in columns (A=company_name, B=slug, etc.)
3. File → Save As
4. Choose **"CSV (Comma delimited) (*.csv)"**
5. Click Save
6. **Important**: Choose **UTF-8** encoding if prompted

### Using Google Sheets
1. Open Google Sheets
2. Enter data in columns
3. File → Download → Comma-separated values (.csv)
4. File will be downloaded automatically

### Using Notepad/Text Editor
1. Open Notepad (or any text editor)
2. Type the CSV content exactly as shown in examples
3. File → Save As
4. File name: `tenants.csv`
5. Save as type: **All Files**
6. Encoding: **UTF-8**
7. Click Save

---

## 📤 Uploading CSV File

### Step-by-Step Process
1. **Login** as SuperAdmin (superadmin/admin123)
2. **Navigate** to Dashboard → Tenant Management tab
3. **Click** "Bulk Import" button
4. **Upload** your CSV file:
   - Click the upload area, OR
   - Drag and drop the file
5. **Review** the preview (first 5 rows)
6. **Verify** the data looks correct
7. **Click** "Import X Tenants" button
8. **Wait** for import to complete
9. **Review** results:
   - Green = Success
   - Red = Failed (with error message)

---

## 🔍 Validation Rules

### Pre-Import Validation
- ✅ CSV must have header row
- ✅ All required columns must be present
- ✅ At least one data row must exist

### Per-Tenant Validation
- ✅ company_name: Not empty
- ✅ slug: Not empty, lowercase, unique
- ✅ saas_app_id: Must exist in database
- ✅ admin_name: Not empty
- ✅ max_users: Positive number (if provided)

### Post-Import Results
- **Success**: Tenant created, admin user created, credentials generated
- **Failed**: Error message explains what went wrong

---

## 🎯 Best Practices

### 1. Test with Small Batch First
- Start with 2-3 tenants
- Verify they import successfully
- Then import larger batches

### 2. Use Consistent Naming
- Follow a naming pattern for slugs
- Example: `company-name-location` → `techcorp-ny`, `techcorp-la`

### 3. Keep Backup
- Save a copy of your CSV before importing
- Helps if you need to retry failed imports

### 4. Verify SaaS App ID
- Double-check the SaaS App ID before importing
- Wrong ID will cause all imports to fail

### 5. Use Unique Slugs
- Check existing tenants before creating CSV
- Avoid duplicate slugs

### 6. Proper Encoding
- Always save CSV as UTF-8
- Prevents issues with special characters

---

## 🐛 Troubleshooting

### Issue: "Missing required columns"
**Cause**: CSV headers don't match expected format
**Solution**: 
- Download template from UI
- Copy headers exactly: `company_name,slug,saas_app_id,admin_name,max_users`

### Issue: "Tenant with slug already exists"
**Cause**: Slug is already used by another tenant
**Solution**: 
- Use a different slug
- Check existing tenants in Tenant Management tab

### Issue: "Invalid SaaS application ID"
**Cause**: saas_app_id doesn't exist in database
**Solution**: 
- Go to Applications tab
- Get correct SaaS App ID
- Update CSV with correct ID

### Issue: CSV not parsing correctly
**Cause**: File encoding or format issue
**Solution**: 
- Save as UTF-8 encoding
- Ensure comma-separated (not semicolon)
- Remove any extra spaces or special characters

### Issue: All imports fail
**Cause**: Usually wrong SaaS App ID
**Solution**: 
- Verify SaaS App ID exists
- Check API gateway logs: `docker logs ssgzone-api-gateway-1`

---

## 📞 Support

### Get Help
- Check error messages in import results
- Review this guide for format requirements
- Check API logs for detailed errors
- Contact system administrator

### Useful Commands
```bash
# Check API logs
docker logs ssgzone-api-gateway-1

# Check database for existing tenants
docker exec -it ssgzone-postgres-1 psql -U postgres -d ssgzone_mail -c "SELECT company_slug FROM tenant_companies;"

# Check SaaS App IDs
docker exec -it ssgzone-postgres-1 psql -U postgres -d ssgzone_mail -c "SELECT id, name, slug FROM saas_applications;"
```

---

## 📚 Additional Resources

- **Phase 3 Documentation**: `PHASE_3_BULK_OPERATIONS.md`
- **Testing Guide**: `PHASE_3_TESTING_GUIDE.md`
- **Quick Reference**: `PHASE_3_QUICK_REFERENCE.md`
- **Sample CSV**: `sample_tenants_import.csv`

---

**Last Updated**: March 11, 2026
**Version**: 1.0.0
