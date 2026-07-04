# 📋 CSV Import Templates - Quick Access

## 🎯 Where to Get CSV Template

### ✅ Method 1: Download from UI (EASIEST)
1. Go to http://localhost:3000
2. Login as SuperAdmin (superadmin/admin123)
3. Click **Dashboard** → **Tenant Management** tab
4. Click **"Bulk Import"** button
5. Click **"Download Template"** button
6. File `tenant_import_template.csv` will download automatically

### ✅ Method 2: Use Sample Files
Located in project root:
- **`sample_tenants_import.csv`** - Ready-to-use sample with 5 tenants
- **`tenant_import_template_with_instructions.csv`** - Template with detailed instructions

### ✅ Method 3: Copy & Paste
Copy this and save as `.csv`:
```csv
company_name,slug,saas_app_id,admin_name,max_users
TechCorp Solutions,techcorp,1,John Smith,100
Global Enterprises,globalent,1,Sarah Johnson,150
Innovation Labs,innovlab,1,Michael Chen,75
```

---

## 📊 CSV Format (CRITICAL)

### Required Format
```
company_name,slug,saas_app_id,admin_name,max_users
```

### Column Descriptions
| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| company_name | ✅ Yes | Full company name | TechCorp Solutions |
| slug | ✅ Yes | URL identifier (lowercase) | techcorp |
| saas_app_id | ✅ Yes | SaaS App ID (from Applications tab) | 1 |
| admin_name | ✅ Yes | Tenant admin full name | John Smith |
| max_users | ❌ No | Max users (default: 50) | 100 |

---

## ⚠️ Important Rules

### ✅ DO:
- Use lowercase for slug
- Use unique slugs
- Get saas_app_id from Applications tab
- Save as UTF-8 encoding
- Keep header row exactly as shown

### ❌ DON'T:
- Use uppercase in slug
- Use spaces in slug (use hyphens instead)
- Use duplicate slugs
- Change header names
- Use invalid saas_app_id

---

## 🚀 Quick Start

### 1. Get SaaS App ID
```
Dashboard → Applications tab → Note the ID
```

### 2. Prepare CSV
```csv
company_name,slug,saas_app_id,admin_name,max_users
My Company,mycompany,1,Admin Name,100
```

### 3. Import
```
Dashboard → Tenant Management → Bulk Import → Upload CSV
```

---

## 📁 File Locations

```
SSGzone/
├── sample_tenants_import.csv                          ← Ready to use
├── tenant_import_template_with_instructions.csv       ← With instructions
├── CSV_FORMAT_GUIDE.md                                ← Complete guide
└── README_CSV_TEMPLATES.md                            ← This file
```

---

## 📖 Complete Documentation

For detailed information, see:
- **`CSV_FORMAT_GUIDE.md`** - Complete format specification
- **`PHASE_3_BULK_OPERATIONS.md`** - Full implementation guide
- **`PHASE_3_TESTING_GUIDE.md`** - Testing scenarios

---

## 🎯 Example CSV Files

### Example 1: Basic
```csv
company_name,slug,saas_app_id,admin_name,max_users
ABC School,abc-school,1,John Doe,50
XYZ College,xyz-college,1,Jane Smith,100
```

### Example 2: With Special Characters
```csv
company_name,slug,saas_app_id,admin_name,max_users
"Smith, Johnson & Co",smith-johnson,1,Robert Smith,75
O'Reilly Tech,oreilly-tech,1,Patrick O'Brien,60
```

### Example 3: Multiple Apps
```csv
company_name,slug,saas_app_id,admin_name,max_users
PEMS School 1,pems-school1,1,Admin One,100
PEMS School 2,pems-school2,1,Admin Two,150
LMS College 1,lms-college1,2,Admin Three,200
```

---

## 🐛 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required columns" | Wrong headers | Use exact headers from template |
| "Tenant with slug already exists" | Duplicate slug | Use unique slug |
| "Invalid SaaS application ID" | Wrong ID | Get correct ID from Applications tab |
| CSV not parsing | Wrong encoding | Save as UTF-8 |

---

## 💡 Pro Tips

1. **Test First**: Import 2-3 tenants first to verify format
2. **Download Template**: Always use the template from UI
3. **Check SaaS ID**: Verify SaaS App ID before importing
4. **Unique Slugs**: Make sure all slugs are unique
5. **UTF-8 Encoding**: Always save CSV as UTF-8

---

## 📞 Need Help?

1. Check **`CSV_FORMAT_GUIDE.md`** for detailed format info
2. Review error messages in import results
3. Check API logs: `docker logs ssgzone-api-gateway-1`
4. Use sample files as reference

---

**Quick Access**: All CSV templates are in the project root directory!

**Last Updated**: March 11, 2026
