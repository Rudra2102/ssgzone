# SSGzone API Access Troubleshooting Guide

## Issue: Cannot See APIs in SuperAdmin Dashboard

### Root Cause
The SuperAdmin Dashboard frontend cannot connect to the API Gateway backend.

---

## Solution Steps

### Step 1: Verify API Gateway is Running

**Check Docker containers:**
```bash
docker ps
```

**Expected output should include:**
- `ssgzone-api-gateway-1` running on port 4000

**If NOT running, start it:**
```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone
docker-compose up -d api-gateway
```

---

### Step 2: Test API Gateway Directly

**Test health endpoint:**
```bash
curl http://localhost:4000/health
```

**Expected response:**
```json
{"status":"OK","timestamp":"2024-01-15T10:30:00.000Z"}
```

**Test Super Admin login:**
```bash
curl -X POST http://localhost:4000/api/v1/super-admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"superadmin\",\"password\":\"admin123\"}"
```

**Expected response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

---

### Step 3: Verify Frontend Configuration

**Check .env file exists:**
```
d:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login\.env
```

**Content should be:**
```
REACT_APP_API_URL=http://localhost:4000
PORT=3000
```

**Check package.json proxy:**
```json
{
  "proxy": "http://localhost:4000"
}
```

---

### Step 4: Restart Frontend

**Stop the frontend** (Ctrl+C in the terminal where it's running)

**Start it again:**
```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone\unified-login
npm start
```

**Frontend should open at:** http://localhost:3000

---

### Step 5: Check Browser Console

1. Open SuperAdmin Dashboard in browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for errors like:
   - `Failed to fetch`
   - `Network error`
   - `CORS error`
   - `404 Not Found`

**Common Console Errors:**

**Error:** `Failed to fetch dashboard stats`
**Solution:** API Gateway is not running. Go to Step 1.

**Error:** `401 Unauthorized`
**Solution:** Token expired or invalid. Log out and log in again.

**Error:** `CORS policy blocked`
**Solution:** API Gateway CORS not configured. Check api-gateway/src/server.js

---

### Step 6: Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for API calls to `/api/v1/super-admin/...`

**What to check:**
- **Status Code:** Should be 200 (success) or 401 (need login)
- **Request URL:** Should be `http://localhost:4000/api/v1/...`
- **Response:** Check if data is returned

---

## Quick Verification Script

Run this script to check everything:
```bash
d:\Pradeep_Singh\Creations\Softwares\SSGzone\CHECK_API_ACCESS.cmd
```

---

## Common Issues & Solutions

### Issue 1: API Gateway Not Running
**Symptoms:** 
- `curl http://localhost:4000/health` fails
- Browser shows "Failed to fetch"

**Solution:**
```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone
docker-compose up -d api-gateway
```

---

### Issue 2: Frontend Not Using Proxy
**Symptoms:**
- API calls go to `http://localhost:3000/api/...` instead of `http://localhost:4000/api/...`

**Solution:**
1. Verify `package.json` has `"proxy": "http://localhost:4000"`
2. Restart frontend: Stop (Ctrl+C) and run `npm start` again
3. Clear browser cache (Ctrl+Shift+Delete)

---

### Issue 3: Database Not Initialized
**Symptoms:**
- API returns errors about missing tables
- Login fails with database errors

**Solution:**
```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone
docker-compose down
docker-compose up -d postgres
# Wait 10 seconds for database to start
docker exec -it ssgzone-postgres-1 psql -U postgres -d ssgzone_mail -f /docker-entrypoint-initdb.d/01_schema.sql
docker-compose up -d api-gateway
```

---

### Issue 4: Token Not Saved
**Symptoms:**
- Dashboard shows "No authentication token found"
- API calls return 401 Unauthorized

**Solution:**
1. Log out completely
2. Clear browser localStorage (F12 → Application → Local Storage → Clear)
3. Log in again with: username=`superadmin`, password=`admin123`

---

### Issue 5: Port Already in Use
**Symptoms:**
- `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Restart API Gateway
docker-compose restart api-gateway
```

---

## API Endpoints Reference

### Super Admin APIs
- **Base URL:** `http://localhost:4000/api/v1/super-admin`
- **Login:** `POST /login`
- **Dashboard Stats:** `GET /dashboard/stats`
- **SaaS Apps:** `GET /saas-apps`, `POST /saas-apps`, `PUT /saas-apps/:id`, `DELETE /saas-apps/:id`
- **Tenants:** `GET /tenants`, `POST /tenants`, `POST /tenants/import-csv`

### Tenant Admin APIs
- **Base URL:** `http://localhost:4000/api/v1/tenant-admin`
- **Login:** `POST /login`
- **Dashboard Stats:** `GET /dashboard/stats`
- **Users:** `GET /users`, `POST /users`

### External SaaS Integration APIs
- **Base URL:** `http://localhost:4000/api/v1/saas`
- **Register:** `POST /register`
- **Provision Tenant:** `POST /tenants`
- **Provision User:** `POST /users`
- **Sync Companies:** `GET /sync/companies`
- **Sync Users:** `GET /sync/users`

---

## Testing Checklist

- [ ] API Gateway running on port 4000
- [ ] Database running and initialized
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:4000/health
- [ ] Can login with superadmin/admin123
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
- [ ] Dashboard displays stats and data

---

## Still Having Issues?

1. **Check Docker logs:**
   ```bash
   docker logs ssgzone-api-gateway-1
   ```

2. **Check database connection:**
   ```bash
   docker exec -it ssgzone-postgres-1 psql -U postgres -d ssgzone_mail -c "SELECT * FROM super_admins;"
   ```

3. **Restart everything:**
   ```bash
   docker-compose down
   docker-compose up -d
   cd unified-login
   npm start
   ```

4. **Review documentation:**
   - PHASE_4_EXTERNAL_SAAS_INTEGRATION.md
   - PHASE_4_TESTING_GUIDE.md
   - README_SSGZONE.md

---

**Last Updated:** Phase 4 Implementation Complete
