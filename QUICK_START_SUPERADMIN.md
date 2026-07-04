# Quick Start: Access SuperAdmin Dashboard

## Step 1: Start API Gateway (if not running)

```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone
docker-compose up -d api-gateway
```

## Step 2: Start Frontend

```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login
npm start
```

Frontend will open at: **http://localhost:3000**

## Step 3: Login

**Credentials:**
- Username: `superadmin`
- Password: `admin123`

## Step 4: Access Dashboard

After login, you'll be redirected to the SuperAdmin Dashboard where you can:

### ✅ View Dashboard Stats
- Total SaaS Applications
- Active Tenants
- Total Users
- Emails sent today

### ✅ Manage SaaS Applications
- Create new SaaS apps (PEMS, LMS, CRM, etc.)
- Edit existing applications
- Delete applications
- Set feature permissions (email, chat, whatsapp, calendar, notifications, file_storage)
- View API keys and secrets

### ✅ Manage Tenants
- Create individual tenants
- Bulk import tenants via CSV
- View tenant details
- Monitor user counts

### ✅ Communication Management
- Monitor email services
- Track WhatsApp integration
- View communication policies

---

## API Endpoints Available

All APIs are accessible at: **http://localhost:4000**

### Super Admin APIs
```
POST   http://localhost:4000/api/v1/super-admin/auth/login
GET    http://localhost:4000/api/v1/super-admin/dashboard/stats
GET    http://localhost:4000/api/v1/super-admin/saas-apps
POST   http://localhost:4000/api/v1/super-admin/saas-apps
PUT    http://localhost:4000/api/v1/super-admin/saas-apps/:id
DELETE http://localhost:4000/api/v1/super-admin/saas-apps/:id
GET    http://localhost:4000/api/v1/super-admin/tenants
POST   http://localhost:4000/api/v1/super-admin/tenants
POST   http://localhost:4000/api/v1/super-admin/tenants/import-csv
POST   http://localhost:4000/api/v1/super-admin/saas-apps/:id/regenerate-keys
```

### External SaaS Integration APIs
```
POST   http://localhost:4000/api/v1/saas/register
POST   http://localhost:4000/api/v1/saas/tenants
POST   http://localhost:4000/api/v1/saas/users
GET    http://localhost:4000/api/v1/saas/sync/companies
GET    http://localhost:4000/api/v1/saas/sync/users
GET    http://localhost:4000/api/v1/saas/info
```

---

## Testing API Directly

### Test Health
```bash
curl http://localhost:4000/health
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/v1/super-admin/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}"
```

### Test Dashboard Stats (with token)
```bash
curl http://localhost:4000/api/v1/super-admin/dashboard/stats ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Issue: Cannot see APIs in dashboard

**Solution:**
1. Ensure API Gateway is running: `docker ps | findstr api-gateway`
2. Test API directly: `curl http://localhost:4000/health`
3. Clear browser cache and localStorage
4. Restart frontend: Stop (Ctrl+C) and run `npm start` again

### Issue: Login fails

**Solution:**
1. Check database is running: `docker ps | findstr postgres`
2. Verify super admin exists:
   ```bash
   docker exec -it ssgzone-postgres-1 psql -U postgres -d ssgzone_mail -c "SELECT * FROM super_admins;"
   ```
3. Use correct credentials: `superadmin` / `admin123`

### Issue: CORS errors

**Solution:**
- API Gateway has CORS enabled by default
- If issues persist, check browser console for specific error
- Ensure frontend is running on port 3000

---

## Next Steps

1. **Create PEMS SaaS Application**
   - Go to "Applications" tab
   - Click "Add SaaS App"
   - Name: PEMS, Slug: pems
   - Enable required permissions

2. **Create Tenant Companies**
   - Go to "Tenant Management" tab
   - Click "Create Tenant" or "Bulk Import"
   - Assign to PEMS application

3. **Integrate with PEMS**
   - Use API keys from SaaS app
   - Follow PHASE_4_EXTERNAL_SAAS_INTEGRATION.md
   - Implement provisioning APIs

---

**Documentation:**
- API_ACCESS_TROUBLESHOOTING.md - Detailed troubleshooting
- PHASE_4_EXTERNAL_SAAS_INTEGRATION.md - Integration guide
- PHASE_4_TESTING_GUIDE.md - API testing examples
- PHASE_4_QUICK_REFERENCE.md - Quick reference

**Support:** Check Docker logs if issues persist
```bash
docker logs ssgzone-api-gateway-1
```
