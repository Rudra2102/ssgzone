# SSGzone SaaS Admin Portal - Docker Setup

## 🐳 Database Migration (Docker)

Since the PostgreSQL database is running in Docker, follow these steps:

### Option 1: Execute Migration via Docker Exec
```bash
# Copy migration file to Docker container
docker cp api-gateway/migrations/021_create_saas_admin_users.sql ssgzone-postgres:/tmp/

# Execute migration inside container
docker exec -it ssgzone-postgres psql -U postgres -d ssgzone -f /tmp/021_create_saas_admin_users.sql
```

### Option 2: Execute via Docker Compose
```bash
# If you have docker-compose exec access
docker-compose exec postgres psql -U postgres -d ssgzone -f /tmp/021_create_saas_admin_users.sql
```

### Option 3: Execute via psql Client (Connecting to Docker)
```bash
# Connect to Docker PostgreSQL from host
psql -h localhost -p 5432 -U postgres -d ssgzone -f api-gateway/migrations/021_create_saas_admin_users.sql
```

### Option 4: Manual Execution via Docker Shell
```bash
# Enter PostgreSQL container
docker exec -it ssgzone-postgres bash

# Inside container, run psql
psql -U postgres -d ssgzone

# Copy-paste the SQL from 021_create_saas_admin_users.sql
```

## 🔍 Verify Migration

```bash
# Check if table was created
docker exec -it ssgzone-postgres psql -U postgres -d ssgzone -c "SELECT * FROM saas_admin_users;"

# Check if default admin user exists
docker exec -it ssgzone-postgres psql -U postgres -d ssgzone -c "SELECT email, name, is_active FROM saas_admin_users;"
```

## 🚀 Complete Setup Steps

### 1. Run Database Migration (Docker)
```bash
# Copy migration to container
docker cp api-gateway/migrations/021_create_saas_admin_users.sql ssgzone-postgres:/tmp/

# Execute migration
docker exec -it ssgzone-postgres psql -U postgres -d ssgzone -f /tmp/021_create_saas_admin_users.sql
```

### 2. Restart API Gateway (Docker)
```bash
# Restart to load new saas-admin routes
docker-compose restart api-gateway

# Or rebuild if needed
docker-compose up -d --build api-gateway
```

### 3. Install Frontend Dependencies
```bash
cd saas-admin-portal
npm install
```

### 4. Start Frontend
```bash
npm start
```

### 5. Access Portal
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Login:** admin@prashast.com / admin123

## 🐛 Troubleshooting

### Find PostgreSQL Container Name
```bash
docker ps | grep postgres
```

### Check API Gateway Logs
```bash
docker-compose logs -f api-gateway
```

### Check PostgreSQL Logs
```bash
docker-compose logs -f postgres
```

### Verify Backend Route is Loaded
```bash
# Test health endpoint
curl http://localhost:4000/health

# Test saas-admin login endpoint
curl -X POST http://localhost:4000/api/saas-admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prashast.com","password":"admin123"}'
```

## 📝 Docker Environment Notes

- PostgreSQL runs in Docker container (usually port 5432)
- API Gateway runs in Docker container (port 4000)
- Frontend runs on host machine (port 3000)
- Database connection from API Gateway uses Docker network
- Frontend connects to API Gateway via localhost:4000

## 🔧 Docker Compose Configuration

Ensure your `docker-compose.yml` has:

```yaml
services:
  postgres:
    container_name: ssgzone-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ssgzone
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  api-gateway:
    depends_on:
      - postgres
    ports:
      - "4000:4000"
    environment:
      DB_HOST: postgres  # Docker service name
      DB_PORT: 5432
      DB_NAME: ssgzone
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
```

---

**Ready for Day 3 after migration is complete!** 🚀
