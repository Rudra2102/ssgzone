# SSGzone Mail - Server Deployment Guide

## Server Access Details

**Server IP:** `223.177.40.176`
**SSH Port:** `22`
**Username:** `root`
**Password:** [Contact Admin]

## Project Location

**Primary Directory:** `/opt/ssgzone/`

### Directory Structure
```
/opt/ssgzone/
├── .env                          # Environment configuration
├── .env.server.backup            # Backup of server env
├── .gitignore                    # Git ignore rules
├── api-gateway/                  # API Gateway service
│   ├── src/
│   │   ├── server.js            # Main server file
│   │   ├── routes/              # API route handlers
│   │   ├── middleware/          # Express middleware
│   │   ├── services/            # Business logic services
│   │   └── utils/               # Utility functions
│   ├── package.json
│   └── node_modules/
├── unified-login/               # Unified login portal (React)
│   ├── src/
│   ├── public/
│   ├── build/
│   └── node_modules/
├── database/                    # Database configuration
│   ├── init/                    # Initial schema
│   ├── migrations/              # Database migrations (23 files)
│   └── seeds/                   # Sample data
└── uploads/                     # User uploads
    └── branding/                # Branding assets
```

## Database Configuration

**Type:** PostgreSQL 14.23
**Host:** localhost
**Port:** 5432
**Database:** ssgzone_mail
**User:** postgres
**Password:** academy

### Database Tables
- chat_messages
- chat_participants
- chat_reactions (new)
- chat_read_receipts (new)
- chat_rooms
- [+ 50+ other tables]

## Running Services

### 1. API Gateway
- **Location:** `/opt/ssgzone/api-gateway/src/server.js`
- **Port:** 4000
- **Status:** Running (PM2 managed)
- **Health Check:** `curl http://localhost:4000/health`
- **Test Endpoint:** `curl http://localhost:4000/test`

### 2. Process Manager
- **Type:** PM2 v7.0.1
- **Command:** `pm2 list` (to see all processes)
- **Restart:** `pm2 restart ssgzone-api`
- **Logs:** `pm2 logs ssgzone-api`

## Environment Variables (.env)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ssgzone_mail
DB_USER=postgres
DB_PASSWORD=academy
API_PORT=4000
JWT_SECRET=ssgzone_pems_production_secret_2025_secure
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
WEBMAIL_PORT=4002
DOMAIN=ssgzone.in
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
SSL_ENABLED=false
ENCRYPTION_KEY=ssgzone_encryption_key_production_32c
SES_SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USER=AKIAT5ZX2F2NFGUTFQQA
SES_SMTP_PASS=BOIrYvLPdVq4fd/kPRI1nYgx8yiS+VjgI2zKeWkABXwI
SES_FROM_EMAIL=noreply@ssgzone.in
SES_FROM_NAME=SSGzone
```

## Git Repository

**GitHub URL:** https://github.com/Rudra2102/ssgzone
**Branch:** main
**Remote:** origin

### Git Commands
```bash
# Check status
cd /opt/ssgzone && git status

# Pull latest changes
git pull origin main

# View commit history
git log --oneline -10

# Check current branch
git branch
```

## API Routes (Active)

- `/api/saas-admin` - SaaS admin endpoints
- `/api/v1/super-admin` - Super admin endpoints
- `/api/v1/tenant-admin` - Tenant admin endpoints
- `/api/v1/saas` - SaaS endpoints
- `/api/v1/tenant` - Tenant endpoints
- `/api/v1/user` - User endpoints
- `/api/v1/user-dashboard` - User dashboard
- `/api/v1/admin` - Admin endpoints
- `/api/v1/webmail` - Webmail endpoints
- `/api/v1/communication` - Communication endpoints

## Common Tasks

### 1. Restart API Gateway
```bash
pm2 restart ssgzone-api
```

### 2. View Logs
```bash
pm2 logs ssgzone-api
tail -f /root/.pm2/logs/ssgzone-api-error.log
```

### 3. Install Dependencies
```bash
cd /opt/ssgzone/api-gateway
npm install
```

### 4. Run Database Migration
```bash
psql -h localhost -U postgres -d ssgzone_mail -f /opt/ssgzone/database/migrations/<migration_file>.sql
```

### 5. Pull Latest Code
```bash
cd /opt/ssgzone
git pull origin main
```

### 6. Check Port Usage
```bash
lsof -i :4000
netstat -tlnp | grep 4000
```

## Infrastructure Services

**PostgreSQL Database:** port 5432
**Redis Cache:** port 6379
**Elasticsearch:** port 9200
**MinIO Object Storage:** ports 9000-9001

## Key Features

✅ Multi-tenant email service
✅ API-first architecture
✅ JWT authentication
✅ Rate limiting (100 requests per 15 minutes)
✅ AWS SES integration for SMTP
✅ PostgreSQL database
✅ Express.js framework
✅ WebSocket/Socket.io support
✅ Real-time chat with reactions & read receipts
✅ CORS enabled
✅ Helmet security headers

## Important Notes

- SSL is currently disabled (SSL_ENABLED=false)
- PM2 automatically restarts crashed processes
- Database backups should be taken regularly
- Environment variables should never be committed to git
- `.env` file is in `.gitignore` for security

## Support & Troubleshooting

For issues:
1. Check PM2 logs: `pm2 logs ssgzone-api`
2. Check database connection: `psql -h localhost -U postgres -d ssgzone_mail -c "SELECT 1"`
3. Check port availability: `lsof -i :4000`
4. Restart service: `pm2 restart ssgzone-api`

## Contact

For questions or issues, contact the development team.
