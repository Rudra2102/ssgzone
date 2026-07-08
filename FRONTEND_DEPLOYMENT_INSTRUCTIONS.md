# Frontend Deployment Instructions

## Pre-Deployment Checklist

- [ ] All files created locally
- [ ] No console errors in development
- [ ] Database migration file ready
- [ ] API routes configured
- [ ] Git repository updated
- [ ] Backup of current production code

## Deployment Steps

### Step 1: Commit Changes to Git

```bash
cd d:\Pradeep_Singh\Creations\Softwares\SSGzone

# Add all new files
git add super-admin-portal/src/components/EnhancedMetricCard.*
git add super-admin-portal/src/components/EmailOverview.*
git add super-admin-portal/src/components/SystemActivity.*
git add super-admin-portal/src/components/EmailHealthMetrics.*
git add super-admin-portal/src/components/StorageUsage.*
git add super-admin-portal/src/pages/UnifiedDashboard.js
git add super-admin-portal/src/pages/Dashboard.css
git add api-gateway/src/routes/dashboard.js
git add api-gateway/src/server.js
git add database/migrations/26_activity_logs.sql
git add ENHANCED_DASHBOARD_README.md
git add FRONTEND_IMPLEMENTATION_GUIDE.md
git add FRONTEND_IMPLEMENTATION_SUMMARY.md

# Commit
git commit -m "feat: Enhanced frontend dashboard with metrics, charts, and activity tracking

- Added 5 new React components (EnhancedMetricCard, EmailOverview, SystemActivity, EmailHealthMetrics, StorageUsage)
- Updated UnifiedDashboard with new components and enhanced data fetching
- Created dashboard API endpoints for role-based metrics
- Added activity_logs table migration for system activity tracking
- Implemented responsive design and performance optimizations
- Added comprehensive documentation"

# Push to GitHub
git push origin main
```

### Step 2: Pull Changes on Production Server

```bash
# SSH into production server
ssh root@your_server_ip

# Navigate to project directory
cd /opt/ssgzone

# Pull latest changes
git pull origin main

# Verify files were pulled
ls -la super-admin-portal/src/components/ | grep -E "Enhanced|Email|System|Storage"
```

### Step 3: Apply Database Migration

```bash
# Connect to PostgreSQL
psql -U postgres -d ssgzone

# Run migration
\i /opt/ssgzone/database/migrations/26_activity_logs.sql

# Verify tables created
\dt activity_logs
\dv recent_activities

# Exit psql
\q
```

### Step 4: Restart API Gateway

```bash
# Navigate to API gateway
cd /opt/ssgzone/api-gateway

# Restart PM2 service
pm2 restart ssgzone-api

# Verify it's running
pm2 status

# Check logs
pm2 logs ssgzone-api --lines 50
```

### Step 5: Build and Deploy Frontend

```bash
# Navigate to super-admin-portal
cd /opt/ssgzone/super-admin-portal

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Verify build succeeded
ls -la build/

# If using Docker, rebuild image
docker build -t ssgzone-super-admin:latest .

# If using PM2, restart frontend
pm2 restart ssgzone-super-admin
```

### Step 6: Verify Deployment

#### Test API Endpoints

```bash
# Get authentication token
TOKEN=$(curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ssgzone.in","password":"admin@123"}' \
  | jq -r '.token')

# Test metrics endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/dashboard/metrics | jq

# Test activities endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/dashboard/activities?limit=8 | jq
```

#### Test Frontend

1. Open browser: `http://your_server_ip:3000`
2. Login with credentials
3. Navigate to dashboard
4. Verify all components load:
   - [ ] Enhanced metric cards display
   - [ ] Email overview shows data
   - [ ] System activity feed loads
   - [ ] Health metrics display
   - [ ] Storage usage shows
5. Check browser console for errors
6. Test on mobile device

#### Check Database

```bash
# Connect to database
psql -U postgres -d ssgzone

# Check activity_logs table
SELECT COUNT(*) FROM activity_logs;

# Check recent activities
SELECT * FROM recent_activities LIMIT 5;

# Check indexes
\d activity_logs
```

### Step 7: Monitor Performance

```bash
# Check API response times
pm2 logs ssgzone-api | grep "response time"

# Monitor database queries
psql -U postgres -d ssgzone -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check system resources
top -b -n 1 | head -20
```

## Rollback Procedure

If issues occur, rollback to previous version:

```bash
# On production server
cd /opt/ssgzone

# Revert git changes
git revert HEAD

# Restart services
pm2 restart ssgzone-api
pm2 restart ssgzone-super-admin

# Verify services are running
pm2 status
```

## Troubleshooting

### Issue: API endpoints returning 404

**Solution:**
```bash
# Check if dashboard routes are registered
grep -n "dashboard" /opt/ssgzone/api-gateway/src/server.js

# Restart API
pm2 restart ssgzone-api

# Check logs
pm2 logs ssgzone-api
```

### Issue: Metrics showing 0 or null

**Solution:**
```bash
# Check if emails table has data
psql -U postgres -d ssgzone -c "SELECT COUNT(*) FROM emails;"

# Check if activity_logs table exists
psql -U postgres -d ssgzone -c "\dt activity_logs"

# Check database connection
psql -U postgres -d ssgzone -c "SELECT 1;"
```

### Issue: Frontend not loading new components

**Solution:**
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Rebuild frontend
cd /opt/ssgzone/super-admin-portal
npm run build

# Restart frontend service
pm2 restart ssgzone-super-admin
```

### Issue: Permission denied errors

**Solution:**
```bash
# Check file permissions
ls -la /opt/ssgzone/super-admin-portal/src/components/

# Fix permissions if needed
chmod -R 755 /opt/ssgzone/super-admin-portal/src/

# Restart services
pm2 restart all
```

## Post-Deployment Verification

### Checklist

- [ ] All API endpoints responding
- [ ] Dashboard loads without errors
- [ ] Metrics display correctly
- [ ] Activities show in feed
- [ ] Health metrics display
- [ ] Storage usage shows
- [ ] Responsive design works
- [ ] No console errors
- [ ] Database queries performing well
- [ ] User permissions working
- [ ] Role-based filtering correct
- [ ] Trends calculating properly

### Performance Metrics

- API response time: < 500ms
- Frontend load time: < 2s
- Database query time: < 100ms
- Memory usage: < 500MB
- CPU usage: < 20%

## Documentation

After deployment, update:

1. **README.md** - Add frontend features section
2. **DEPLOYMENT.md** - Add frontend deployment steps
3. **API.md** - Add dashboard endpoints documentation
4. **CHANGELOG.md** - Document changes

## Support

For issues or questions:

1. Check logs: `pm2 logs ssgzone-api`
2. Review documentation: `ENHANCED_DASHBOARD_README.md`
3. Check database: `psql -U postgres -d ssgzone`
4. Test endpoints: Use curl or Postman

## Success Criteria

✅ Deployment is successful when:

1. All new components render without errors
2. API endpoints return correct data
3. Database migration applied successfully
4. Metrics display real data
5. Activities show in feed
6. Health metrics display
7. Storage usage shows
8. No console errors
9. Responsive design works
10. Performance is acceptable

## Next Steps

After successful deployment:

1. **Monitor** - Watch logs and performance for 24 hours
2. **Gather Feedback** - Collect user feedback on new features
3. **Optimize** - Fine-tune performance based on metrics
4. **Document** - Update documentation with any changes
5. **Plan** - Start planning custom domain system implementation

## Timeline

- **Deployment**: 30 minutes
- **Testing**: 30 minutes
- **Verification**: 30 minutes
- **Monitoring**: 24 hours
- **Total**: ~2 hours active + 24 hours monitoring

## Contact

For deployment support:
- Check logs: `pm2 logs`
- Review documentation: See docs folder
- Test endpoints: Use provided curl commands
- Verify database: Use psql commands
