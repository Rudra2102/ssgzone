# Understanding SaaS App ID - Complete Guide

## 🎯 What is SaaS App ID?

**SaaS App ID** is the unique identifier of the external SaaS application (like PEMS, LMS, CRM) that will use SSGzone's communication services.

### Simple Explanation
Think of SSGzone as a **communication platform** that multiple applications can use:
- **PEMS** (your education management system) is one SaaS application
- **LMS** (learning management system) could be another
- **CRM** (customer relationship) could be another

Each of these applications gets a unique ID in SSGzone, and when you create tenants (companies), you specify which SaaS application they belong to.

---

## 🏗️ Architecture Overview

```
SSGzone Communication Platform
├── SaaS App 1: PEMS (ID = 1)
│   ├── Tenant: NABC Institute (slug: nabc)
│   ├── Tenant: XYZ School (slug: xyz)
│   └── Tenant: ABC College (slug: abc)
│
├── SaaS App 2: LMS (ID = 2)
│   ├── Tenant: University A (slug: univ-a)
│   └── Tenant: College B (slug: college-b)
│
└── SaaS App 3: CRM (ID = 3)
    ├── Tenant: Company X (slug: company-x)
    └── Tenant: Company Y (slug: company-y)
```

---

## 🔍 Why "1" in Sample CSV?

In the sample CSV file, all entries have `saas_app_id = 1` because:

1. **PEMS is the First Application**: When you set up SSGzone, PEMS was created as the first SaaS application with ID = 1

2. **Sample is for PEMS**: The sample assumes you're creating tenants for PEMS application

3. **Domain Structure**: 
   - Tenant slug: `nabc`
   - SaaS app slug: `pems`
   - Final domain: `nabc.pems.ssgzone.in`

---

## 📊 How to Find Your SaaS App ID

### Method 1: SuperAdmin Dashboard (UI)

**Step-by-Step:**
1. Login as SuperAdmin at http://localhost:3000
2. Go to **Dashboard** (you'll see it by default)
3. Click on **"SaaS Applications"** tab (first tab)
4. You'll see a table with all SaaS applications
5. Note the ID from the table

**Example Table:**
| Name | Slug | Tenants | Status | Actions |
|------|------|---------|--------|---------|
| PEMS | pems | 5 | Active | Edit Delete |
| LMS  | lms  | 2 | Active | Edit Delete |
| CRM  | crm  | 3 | Active | Edit Delete |

The ID is usually visible in the table or you can see it when you edit the application.

### Method 2: Database Query

```bash
# Connect to database
docker exec -it ssgzone-postgres-1 psql -U postgres -d ssgzone_mail

# Query SaaS applications
SELECT id, name, slug, created_at FROM saas_applications ORDER BY created_at;
```

**Example Output:**
```
                  id                  |  name  | slug |       created_at        
--------------------------------------+--------+------+-------------------------
 550e8400-e29b-41d4-a716-446655440000 | PEMS   | pems | 2026-03-10 10:30:00
 660e8400-e29b-41d4-a716-446655440001 | LMS    | lms  | 2026-03-10 11:00:00
 770e8400-e29b-41d4-a716-446655440002 | CRM    | crm  | 2026-03-10 11:30:00
```

### Method 3: API Call

```bash
# Get SuperAdmin token
TOKEN=$(curl -X POST http://localhost:4000/api/v1/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"admin123"}' \
  -s | jq -r '.data.token')

# Get SaaS applications
curl -X GET http://localhost:4000/api/v1/super-admin/saas-apps \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.data[] | {id, name, slug}'
```

**Example Output:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "PEMS",
  "slug": "pems"
}
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "LMS",
  "slug": "lms"
}
```

---

## 🎯 When to Use Which SaaS App ID

### Scenario 1: Creating Tenants for PEMS
If you're creating schools/institutes that will use PEMS:
```csv
company_name,slug,saas_app_id,admin_name,max_users
NABC Institute,nabc,1,John Smith,100
XYZ School,xyz,1,Jane Doe,150
```
**Result:**
- `nabc.pems.ssgzone.in`
- `xyz.pems.ssgzone.in`

### Scenario 2: Creating Tenants for LMS
If you're creating universities that will use LMS:
```csv
company_name,slug,saas_app_id,admin_name,max_users
University A,univ-a,2,Admin A,200
College B,college-b,2,Admin B,150
```
**Result:**
- `univ-a.lms.ssgzone.in`
- `college-b.lms.ssgzone.in`

### Scenario 3: Mixed Applications
If you're creating tenants for different applications:
```csv
company_name,slug,saas_app_id,admin_name,max_users
PEMS School,pems-school,1,Admin 1,100
LMS College,lms-college,2,Admin 2,150
CRM Company,crm-company,3,Admin 3,75
```
**Result:**
- `pems-school.pems.ssgzone.in`
- `lms-college.lms.ssgzone.in`
- `crm-company.crm.ssgzone.in`

---

## 🔄 How Domain Names are Generated

### Formula
```
{tenant_slug}.{saas_app_slug}.ssgzone.in
```

### Example Breakdown
**Input:**
- Tenant slug: `nabc`
- SaaS App ID: `1` (which has slug: `pems`)

**Process:**
1. System looks up SaaS App with ID = 1
2. Finds slug = `pems`
3. Combines: `nabc` + `pems` + `ssgzone.in`

**Output:**
- Domain: `nabc.pems.ssgzone.in`
- Admin Email: `admin@nabc.pems.ssgzone.in`

---

## 📝 Updated Sample CSV with Explanation

### For PEMS Application (ID = 1)
```csv
company_name,slug,saas_app_id,admin_name,max_users
NABC Institute,nabc,1,John Smith,100
XYZ School,xyz,1,Jane Doe,150
ABC College,abc,1,Bob Wilson,75
```

**Why all have "1"?**
- All these schools/institutes will use PEMS application
- PEMS has ID = 1 in the system
- All will get domains like: `*.pems.ssgzone.in`

### For Multiple Applications
```csv
company_name,slug,saas_app_id,admin_name,max_users
NABC Institute,nabc,1,John Smith,100
XYZ School,xyz,1,Jane Doe,150
University A,univ-a,2,Admin A,200
College B,college-b,2,Admin B,150
Company X,company-x,3,Admin X,50
```

**Explanation:**
- Row 1-2: PEMS tenants (ID=1) → `*.pems.ssgzone.in`
- Row 3-4: LMS tenants (ID=2) → `*.lms.ssgzone.in`
- Row 5: CRM tenant (ID=3) → `*.crm.ssgzone.in`

---

## 🎓 Real-World Example

### Your Current Setup (PEMS)

**SaaS Application:**
- Name: PEMS
- Slug: pems
- ID: 1 (or a UUID like `550e8400-e29b-41d4-a716-446655440000`)

**When You Create Tenants:**
```csv
company_name,slug,saas_app_id,admin_name,max_users
NABC Institute,nabc,1,Pradeep Singh,100
```

**What Gets Created:**
1. **Tenant Company:**
   - Name: NABC Institute
   - Slug: nabc
   - Domain: `nabc.pems.ssgzone.in`
   - SaaS App: PEMS (ID=1)

2. **Admin User:**
   - Username: admin
   - Email: `admin@nabc.pems.ssgzone.in`
   - Password: Welcome@123
   - Name: Pradeep Singh

3. **Communication Settings:**
   - Email: Enabled
   - Chat: Enabled
   - WhatsApp: Disabled
   - Notifications: Enabled

---

## ❓ Common Questions

### Q1: Can I use any number for saas_app_id?
**A:** No! You must use an ID that exists in your system. Check the Applications tab to see valid IDs.

### Q2: Why is "1" used in all samples?
**A:** Because PEMS is typically the first application created, so it gets ID=1. If you're creating tenants for PEMS, use 1.

### Q3: What if I have multiple SaaS applications?
**A:** Each application has its own ID. Use the correct ID for each tenant based on which application they'll use.

### Q4: Can I change the SaaS App ID later?
**A:** Not recommended. The SaaS App ID determines the domain structure. Changing it would require recreating the tenant.

### Q5: How do I create a new SaaS Application?
**A:** 
1. Go to SuperAdmin Dashboard
2. Click "SaaS Applications" tab
3. Click "Add SaaS App" button
4. Fill in Name, Slug, Description
5. The system will generate an ID automatically

---

## 🔧 Troubleshooting

### Error: "Invalid SaaS application ID"

**Cause:** The saas_app_id in your CSV doesn't exist in the database

**Solution:**
1. Check existing SaaS Apps in the dashboard
2. Use the correct ID from the Applications tab
3. Or create a new SaaS Application first

**Example Fix:**
```csv
# Wrong (ID 999 doesn't exist)
company_name,slug,saas_app_id,admin_name,max_users
NABC Institute,nabc,999,John Smith,100

# Correct (ID 1 exists - PEMS)
company_name,slug,saas_app_id,admin_name,max_users
NABC Institute,nabc,1,John Smith,100
```

---

## 📊 Quick Reference Table

| SaaS App | Typical ID | Slug | Domain Pattern | Use Case |
|----------|-----------|------|----------------|----------|
| PEMS | 1 | pems | `*.pems.ssgzone.in` | Schools, Institutes |
| LMS | 2 | lms | `*.lms.ssgzone.in` | Universities, Colleges |
| CRM | 3 | crm | `*.crm.ssgzone.in` | Companies, Businesses |

**Note:** Actual IDs may be UUIDs instead of numbers (1, 2, 3)

---

## 🎯 Best Practice

### For Single Application (Most Common)
If you're only using PEMS:
1. Find PEMS ID (usually 1)
2. Use that ID for all tenants
3. All CSV rows will have the same saas_app_id

```csv
company_name,slug,saas_app_id,admin_name,max_users
School 1,school1,1,Admin 1,100
School 2,school2,1,Admin 2,150
School 3,school3,1,Admin 3,75
```

### For Multiple Applications
If you have multiple SaaS apps:
1. Group tenants by application
2. Use correct ID for each group
3. Consider separate CSV files per application

---

## 📞 Need Help?

**To find your SaaS App ID:**
1. Login to SuperAdmin Dashboard
2. Go to "SaaS Applications" tab
3. Look at the table - the ID is there
4. Use that ID in your CSV

**Still confused?**
- Check `PHASE_3_BULK_OPERATIONS.md` for more details
- Review `CSV_FORMAT_GUIDE.md` for format help
- Contact system administrator

---

**Key Takeaway:** 
- SaaS App ID = Which application (PEMS, LMS, CRM) the tenant belongs to
- "1" in samples = PEMS application (the first one created)
- Always use the actual ID from your system's Applications tab

---

**Last Updated**: March 11, 2026
