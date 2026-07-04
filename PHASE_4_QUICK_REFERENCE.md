# Phase 4 - External SaaS Integration APIs - Quick Reference

## 🎯 Overview

Phase 4 enables external SaaS applications (like PEMS) to programmatically integrate with SSGzone for tenant and user management.

---

## 🔑 Authentication

**Method 1: X-API-Key Header** (Recommended)
```bash
curl -H "X-API-Key: ssg_live_pems_1710145200000" ...
```

**Method 2: Authorization Bearer**
```bash
curl -H "Authorization: Bearer ssg_live_pems_1710145200000" ...
```

---

## 📋 API Endpoints Quick Reference

### 1. Register SaaS App
```bash
POST /api/v1/saas/auth/register
{
  "name": "PEMS",
  "slug": "pems",
  "description": "...",
  "webhook_url": "https://..."
}
```
**Returns**: API credentials (store securely!)

### 2. Provision Tenant
```bash
POST /api/v1/saas/tenants/provision
X-API-Key: YOUR_KEY
{
  "company_name": "NABC Institute",
  "slug": "nabc",
  "admin_name": "Pradeep Singh",
  "max_users": 100
}
```
**Returns**: Tenant ID + admin credentials

### 3. Provision User
```bash
POST /api/v1/saas/users/provision
X-API-Key: YOUR_KEY
{
  "tenant_id": "uuid",
  "username": "john.doe",
  "email": "john@...",
  "first_name": "John",
  "last_name": "Doe"
}
```
**Returns**: User ID + default password

### 4. Sync Companies
```bash
GET /api/v1/saas/sync/companies?page=1&limit=100
X-API-Key: YOUR_KEY
```
**Returns**: List of all your tenants

### 5. Sync Users
```bash
GET /api/v1/saas/sync/users?tenant_id=uuid&page=1&limit=100
X-API-Key: YOUR_KEY
```
**Returns**: List of users for a tenant

### 6. Get SaaS Info
```bash
GET /api/v1/saas/info
X-API-Key: YOUR_KEY
```
**Returns**: Your SaaS app details

### 7. Health Check
```bash
GET /api/v1/saas/health
```
**Returns**: API health status

---

## 🚀 Quick Start (3 Steps)

### Step 1: Register
```bash
curl -X POST http://ssgzone.in/api/v1/saas/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"PEMS","slug":"pems","description":"..."}'
```
**Save the API key!**

### Step 2: Activate (SuperAdmin)
1. Login to SuperAdmin dashboard
2. Go to Applications tab
3. Change status to "active"

### Step 3: Start Provisioning
```bash
API_KEY="your_api_key_here"

# Create tenant
curl -X POST http://ssgzone.in/api/v1/saas/tenants/provision \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"NABC","slug":"nabc","admin_name":"Admin"}'
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## ⚠️ Common Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Invalid API key | Check your API key |
| 403 | App not active | Contact SuperAdmin to activate |
| 400 | Missing fields | Check required fields |
| 404 | Not found | Verify tenant/user ID |
| 500 | Server error | Check logs |

---

## 🔐 Security Best Practices

1. **Store API keys securely** - Use environment variables
2. **Use HTTPS** - Never send keys over HTTP
3. **Rotate keys regularly** - Regenerate via SuperAdmin
4. **Monitor usage** - Track API calls
5. **Validate responses** - Always check success field

---

## 📝 Required Fields

### Tenant Provisioning
- ✅ company_name
- ✅ slug
- ✅ admin_name
- ❌ admin_email (optional)
- ❌ max_users (optional, default: 50)

### User Provisioning
- ✅ tenant_id
- ✅ username
- ✅ email
- ✅ first_name
- ✅ last_name
- ❌ role (optional, default: "user")
- ❌ department_id (optional)

---

## 🎯 Integration Patterns

### Pattern 1: Sync on Startup
```javascript
// When your app starts
const companies = await fetch('/api/v1/saas/sync/companies', {
  headers: { 'X-API-Key': API_KEY }
});
// Store in local database
```

### Pattern 2: Provision on Demand
```javascript
// When user creates company in your app
const tenant = await fetch('/api/v1/saas/tenants/provision', {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    company_name: companyName,
    slug: companySlug,
    admin_name: adminName
  })
});
```

### Pattern 3: Batch Provisioning
```javascript
// Provision multiple users
for (const user of users) {
  await fetch('/api/v1/saas/users/provision', {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      ...user
    })
  });
}
```

---

## 🔄 Pagination

All sync endpoints support pagination:

```bash
# Page 1
GET /api/v1/saas/sync/companies?page=1&limit=100

# Page 2
GET /api/v1/saas/sync/companies?page=2&limit=100
```

**Response includes:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "total_pages": 3
  }
}
```

---

## 🛠️ Troubleshooting

### Issue: "API key required"
**Solution**: Add X-API-Key header

### Issue: "SaaS application is not active"
**Solution**: Contact SuperAdmin to activate your app

### Issue: "Tenant with slug already exists"
**Solution**: Use a different slug

### Issue: "Invalid SaaS application ID"
**Solution**: Verify your API key is correct

---

## 📚 Documentation Files

- **PHASE_4_EXTERNAL_SAAS_INTEGRATION.md** - Complete implementation guide
- **PHASE_4_TESTING_GUIDE.md** - Testing scenarios with examples
- **PHASE_4_QUICK_REFERENCE.md** - This file

---

## 🎓 Example: PEMS Integration

```javascript
// pems-backend/services/ssgzone.js

const SSGZONE_API = 'https://ssgzone.in/api/v1/saas';
const API_KEY = process.env.SSGZONE_API_KEY;

class SSGzoneService {
  async createTenant(companyData) {
    const response = await fetch(`${SSGZONE_API}/tenants/provision`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_name: companyData.name,
        slug: companyData.slug,
        admin_name: companyData.adminName,
        max_users: companyData.maxUsers || 100,
        metadata: {
          pems_company_id: companyData.id,
          plan: companyData.plan
        }
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Store tenant_id and credentials in PEMS database
    await this.storeTenantCredentials(
      companyData.id,
      result.data.tenant_id,
      result.data.admin_credentials
    );
    
    return result.data;
  }
  
  async createUser(userData) {
    const response = await fetch(`${SSGZONE_API}/users/provision`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: userData.tenantId,
        username: userData.username,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        metadata: {
          pems_user_id: userData.id
        }
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }
  
  async syncCompanies() {
    let page = 1;
    let allCompanies = [];
    
    while (true) {
      const response = await fetch(
        `${SSGZONE_API}/sync/companies?page=${page}&limit=100`,
        {
          headers: { 'X-API-Key': API_KEY }
        }
      );
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      allCompanies = allCompanies.concat(result.data.companies);
      
      if (page >= result.data.pagination.total_pages) {
        break;
      }
      
      page++;
    }
    
    return allCompanies;
  }
}

module.exports = new SSGzoneService();
```

---

## ✅ Success Criteria

✅ External SaaS can authenticate
✅ External SaaS can create tenants
✅ External SaaS can create users
✅ Webhook system ready
✅ Data synchronization working

---

## 🚀 Next Steps

1. Implement webhook notifications
2. Add rate limiting
3. Add API versioning
4. Add batch operations
5. Add update/delete operations

---

**Phase 4 Status**: ✅ COMPLETE

**Ready for Integration**: ✅ YES

---

*Last Updated: March 11, 2026*
