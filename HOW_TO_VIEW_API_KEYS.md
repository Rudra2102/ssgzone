# How to View API Keys in SuperAdmin Dashboard

## ✅ FIXED - API Keys Now Visible!

I've added a **"View API Keys"** button to the SuperAdmin Dashboard.

---

## 📍 Where to Find API Keys

### Step 1: Login to SuperAdmin Dashboard
- Go to: http://localhost:3000
- Username: `superadmin`
- Password: `admin123`

### Step 2: Navigate to SaaS Applications Tab
1. After login, you'll see the dashboard with stats cards
2. Below the stats, there are **5 tabs**
3. Click on the **first tab**: **"SaaS Applications"**

### Step 3: View API Keys
1. In the SaaS Applications table, you'll see your apps
2. Each row has **3 action buttons**:
   - **🔑 Key Icon** (View API Keys) - **NEW!**
   - **✏️ Edit Icon** (Edit Application)
   - **🗑️ Delete Icon** (Delete Application)
3. Click the **Key Icon** (🔑) to view API credentials

### Step 4: API Keys Dialog
A dialog will open showing:

#### 🔐 API Credentials:
- **API Key**: `ssg_live_pems_1234567890`
- **API Secret**: `ssg_secret_pems_xxxxx`
- **Webhook Secret**: `whk_pems_xxxxx` (if webhook URL was provided)

#### 📋 Copy to Clipboard:
- Each credential has a **copy button** (📋)
- Click to copy the value instantly

#### 📚 Usage Example:
```bash
curl -X POST http://localhost:4000/api/v1/saas/tenants \
  -H "X-API-Key: ssg_live_pems_1234567890" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Corp","slug":"testcorp"}'
```

#### 🔗 API Endpoints List:
- Base URL: `http://localhost:4000/api/v1/saas`
- Register: `POST /register`
- Create Tenant: `POST /tenants`
- Create User: `POST /users`
- Sync Companies: `GET /sync/companies`
- Sync Users: `GET /sync/users`

---

## 🎯 Quick Steps to Get API Keys

1. **Restart Frontend** (to apply the fix):
   ```bash
   cd d:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login
   # Press Ctrl+C to stop
   npm start
   ```

2. **Login** to SuperAdmin Dashboard

3. **Create a SaaS App** (if you haven't):
   - Click "Add SaaS App" button
   - Name: PEMS
   - Slug: pems
   - Enable permissions
   - Click "Create"

4. **View API Keys**:
   - Click the **Key Icon** (🔑) next to your app
   - Copy the API Key and Secret
   - Use them in your PEMS integration

---

## 🔒 Security Best Practices

### ⚠️ Important:
- **Never** commit API keys to Git repositories
- **Never** expose API keys in client-side code
- **Never** share API keys publicly
- Store them in environment variables or secure vaults

### ✅ Recommended:
- Use environment variables in PEMS:
  ```properties
  # application.properties
  ssgzone.api.key=${SSGZONE_API_KEY}
  ssgzone.api.secret=${SSGZONE_API_SECRET}
  ```

- Or use a configuration file:
  ```java
  @Value("${ssgzone.api.key}")
  private String ssgzoneApiKey;
  ```

---

## 📊 What You'll See

### SaaS Applications Table:
| Name | Slug | Tenants | Status | Actions |
|------|------|---------|--------|---------|
| PEMS | pems | 0 | Active | 🔑 ✏️ 🗑️ |

### API Keys Dialog:
```
┌─────────────────────────────────────────┐
│ 🔑 API Credentials - PEMS              │
├─────────────────────────────────────────┤
│ ⚠️ Security Warning                     │
│ Keep these credentials secure...        │
├─────────────────────────────────────────┤
│ API Key                            📋   │
│ ssg_live_pems_1710123456789            │
├─────────────────────────────────────────┤
│ API Secret                         📋   │
│ ssg_secret_pems_abc123xyz              │
├─────────────────────────────────────────┤
│ Webhook Secret                     📋   │
│ whk_pems_def456uvw                     │
├─────────────────────────────────────────┤
│ 📚 Usage Example:                       │
│ curl -X POST http://localhost:4000...  │
├─────────────────────────────────────────┤
│ 🔗 API Endpoints:                       │
│ • Base URL: http://localhost:4000...   │
│ • Register: POST /register             │
│ • Create Tenant: POST /tenants         │
└─────────────────────────────────────────┘
```

---

## 🔄 Regenerate API Keys

If you need to regenerate API keys (e.g., if they're compromised):

### Option 1: Via API (Coming Soon)
```bash
curl -X POST http://localhost:4000/api/v1/super-admin/saas-apps/1/regenerate-keys \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

### Option 2: Via UI (Future Enhancement)
- Click "Regenerate Keys" button in the API Keys dialog
- Confirm the action
- New keys will be generated
- **Old keys will be invalidated immediately**

---

## 🧪 Testing the API Keys

### Test 1: Get Application Info
```bash
curl http://localhost:4000/api/v1/saas/info \
  -H "X-API-Key: YOUR_API_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "PEMS",
    "slug": "pems",
    "permissions": {
      "email": true,
      "chat": true,
      "whatsapp": false,
      "calendar": false,
      "notifications": true,
      "file_storage": true
    }
  }
}
```

### Test 2: Create a Tenant
```bash
curl -X POST http://localhost:4000/api/v1/saas/tenants \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "slug": "testco",
    "admin_name": "John Doe",
    "max_users": 50
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "tenant_id": "uuid-here",
    "company_name": "Test Company",
    "domain": "testco.pems.ssgzone.in",
    "admin_email": "admin@testco.pems.ssgzone.in",
    "admin_credentials": {
      "username": "admin",
      "password": "Welcome@123"
    }
  }
}
```

---

## 📞 Need Help?

### Issue: Can't see the Key Icon
**Solution:** Restart the frontend to apply the latest changes

### Issue: API Keys show "Not available"
**Solution:** The app was created before API keys were implemented. Delete and recreate the app.

### Issue: Copy button doesn't work
**Solution:** Your browser might be blocking clipboard access. Copy manually by selecting the text.

---

## 📚 Related Documentation

- **PHASE_4_EXTERNAL_SAAS_INTEGRATION.md** - Complete API integration guide
- **PHASE_4_TESTING_GUIDE.md** - API testing examples
- **PHASE_4_QUICK_REFERENCE.md** - Quick reference for all endpoints
- **API_ACCESS_TROUBLESHOOTING.md** - Troubleshooting guide

---

**Status:** ✅ API Keys are now visible in the SuperAdmin Dashboard!

**Next Steps:**
1. Restart frontend
2. Login to SuperAdmin
3. Click Key Icon (🔑) next to your SaaS app
4. Copy API credentials
5. Use them in PEMS integration
