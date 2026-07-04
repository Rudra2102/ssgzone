# SSGhub Mail - Production Testing Guide

## **CRITICAL: Production Environment Testing**

This guide will test your SSGhub Mail platform in a production-like environment to ensure everything works correctly before going live.

---

## **Phase 1: Environment Setup (5 minutes)**

### **Step 1: Configure Production Environment**
```cmd
cd d:\Pradeep_Singh\Creations\Softwares\SSGhub
copy config\production.env .env
```

**IMPORTANT**: Edit `.env` file and replace these placeholders:
- `your_secure_db_password_here` → Strong password (e.g., `SSGhub2024!Prod`)
- `your_jwt_secret_here` → Random 64-char string
- `your_32_character_encryption_key_here` → 32-character key
- `your_cloudflare_token_here` → Your Cloudflare API token (if using)
- `your_aws_access_key_here` → Your AWS access key (if using)

### **Step 2: SSL Certificate Setup (Production)**
```cmd
# Create SSL directory
mkdir config\ssl\certs
mkdir config\ssl\private

# For testing, create self-signed certificates
openssl req -x509 -newkey rsa:4096 -keyout config\ssl\private\ssghub.com.key -out config\ssl\certs\ssghub.com.crt -days 365 -nodes -subj "/CN=ssghub.com"
```

---

## **Phase 2: Database & Infrastructure (10 minutes)**

### **Step 3: Initialize Database**
```cmd
# Start database first
docker-compose up -d postgres redis

# Wait for database to be ready
timeout /t 30 /nobreak

# Run database migrations
docker exec ssghub-postgres-1 psql -U ssghub -d ssghub_mail -f /docker-entrypoint-initdb.d/01_schema.sql
```

### **Step 4: Start All Services**
```cmd
# Start all services in production mode
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Verify all services are running
docker-compose ps
```

**Expected Output**: 9 services should be "Up"
- postgres, redis, elasticsearch, minio
- api-gateway, mail-server, calendar-service, ip-warmup-service
- admin-portal, webmail-client

---

## **Phase 3: Core Functionality Testing (15 minutes)**

### **Step 5: API Gateway Health Check**
```cmd
curl -s http://localhost:4000/health
```
**Expected**: `{"status":"OK","timestamp":"..."}`

### **Step 6: Register SaaS Application**
```cmd
curl -X POST http://localhost:4000/api/v1/saas/register ^
  -H "Content-Type: application/json" ^
  -d "{\"saas_name\":\"TestLMS\",\"saas_slug\":\"testlms\"}"
```
**Expected**: Response with `api_key` field

### **Step 7: Provision Tenant**
```cmd
# Use the API key from Step 6
set API_KEY=your_api_key_here

curl -X POST http://localhost:4000/api/v1/tenant/provision ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"company_name\":\"Test Company\",\"tenant_slug\":\"testco\"}"
```
**Expected**: Response with tenant domain information

### **Step 8: Create User Account**
```cmd
curl -X POST http://localhost:4000/api/v1/user/create ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"testco\",\"username\":\"testuser\",\"password\":\"TestPass123\",\"first_name\":\"Test\",\"last_name\":\"User\"}"
```
**Expected**: Response with email address `testuser@testco.testlms.ssghub.com`

---

## **Phase 4: Mail Server Testing (10 minutes)**

### **Step 9: Test SMTP Connectivity**
```cmd
# Test SMTP port
telnet localhost 25
# Type: QUIT and press Enter to exit

# Test IMAP port
telnet localhost 993
# Type: QUIT and press Enter to exit
```
**Expected**: Connection successful for both ports

### **Step 10: Test Email Sending (Advanced)**
```cmd
# Create test email
echo Subject: Test Email > test_email.txt
echo. >> test_email.txt
echo This is a test email from SSGhub Mail. >> test_email.txt

# Send via SMTP (requires SMTP client or use webmail)
```

---

## **Phase 5: Enterprise Features Testing (15 minutes)**

### **Step 11: Test IP Warmup Service**
```cmd
curl -X POST http://localhost:4004/warmup/initialize/192.168.1.100
```
**Expected**: `{"status":"initialized","ip":"192.168.1.100"}`

### **Step 12: Test DMARC Reporting**
```cmd
curl -X GET http://localhost:4000/api/v1/dmarc/reports ^
  -H "X-API-Key: %API_KEY%"
```
**Expected**: JSON response with DMARC data (may be empty initially)

### **Step 13: Test Signature Management**
```cmd
curl -X POST http://localhost:4000/api/v1/signatures/tenant/signature ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: %API_KEY%" ^
  -d "{\"tenant_slug\":\"testco\",\"signature_html\":\"<p>Best regards,<br>Test Company</p>\"}"
```
**Expected**: Success response

### **Step 14: Test Data Export**
```cmd
curl -X GET http://localhost:4000/api/v1/export/tenant/data ^
  -H "X-API-Key: %API_KEY%" ^
  -d "tenant_slug=testco"
```
**Expected**: Export data response

---

## **Phase 6: Web Interface Testing (10 minutes)**

### **Step 15: Test Admin Portal**
```cmd
# Open in browser
start http://localhost:4001
```
**Expected**: SSGhub Admin Portal loads successfully

### **Step 16: Test Webmail Client**
```cmd
# Open in browser
start http://localhost:4002
```
**Expected**: SSGhub Webmail interface loads successfully

### **Step 17: Test Login**
- Navigate to webmail login
- Use credentials: `testuser@testco.testlms.ssghub.com` / `TestPass123`
**Expected**: Successful login to webmail interface

---

## **Phase 7: Performance & Load Testing (10 minutes)**

### **Step 18: API Response Time Test**
```cmd
# Test API response times
for /l %i in (1,1,10) do curl -w "Time: %{time_total}s\n" -s http://localhost:4000/health
```
**Expected**: Response times under 200ms

### **Step 19: Concurrent Request Test**
```cmd
# Simulate concurrent requests
start /b curl -s http://localhost:4000/health
start /b curl -s http://localhost:4000/health
start /b curl -s http://localhost:4000/health
start /b curl -s http://localhost:4000/health
start /b curl -s http://localhost:4000/health
```
**Expected**: All requests complete successfully

---

## **Phase 8: Security & Compliance Testing (10 minutes)**

### **Step 20: Test Rate Limiting**
```cmd
# Send multiple rapid requests
for /l %i in (1,1,20) do curl -s http://localhost:4000/health
```
**Expected**: Some requests may be rate-limited (429 status)

### **Step 21: Test Authentication**
```cmd
# Test without API key (should fail)
curl -X GET http://localhost:4000/api/v1/tenant/list
```
**Expected**: 401 Unauthorized error

### **Step 22: Test Encryption**
```cmd
# Test MinIO storage
curl -s http://localhost:9000/minio/health/live
```
**Expected**: MinIO health check passes

---

## **Phase 9: Failover Testing (5 minutes)**

### **Step 23: Test Service Recovery**
```cmd
# Stop mail server temporarily
docker stop ssghub-mail-server-1

# Wait 30 seconds
timeout /t 30 /nobreak

# Restart mail server
docker start ssghub-mail-server-1

# Test API still works
curl -s http://localhost:4000/health
```
**Expected**: System recovers automatically

---

## **Phase 10: Final Verification (5 minutes)**

### **Step 24: Complete System Check**
```cmd
# Run comprehensive test
COMPREHENSIVE_PRODUCTION_TEST.cmd
```
**Expected**: All tests pass with "READY FOR PRODUCTION" message

### **Step 25: Service Status Verification**
```cmd
docker-compose ps
docker stats --no-stream
```
**Expected**: All services running with reasonable resource usage

---

## **Production Readiness Checklist**

### ✅ **Core Services**
- [ ] Database connectivity
- [ ] API Gateway responding
- [ ] Mail server (SMTP/IMAP) accessible
- [ ] Redis cache working
- [ ] Elasticsearch operational

### ✅ **Business Logic**
- [ ] SaaS registration working
- [ ] Tenant provisioning successful
- [ ] User creation functional
- [ ] Email routing operational

### ✅ **Enterprise Features**
- [ ] IP warmup service active
- [ ] DMARC reporting functional
- [ ] Signature management working
- [ ] Data export operational
- [ ] Failover system tested

### ✅ **Web Interfaces**
- [ ] Admin portal accessible
- [ ] Webmail client functional
- [ ] User authentication working

### ✅ **Security & Performance**
- [ ] Rate limiting active
- [ ] Authentication enforced
- [ ] SSL/TLS configured
- [ ] Response times acceptable
- [ ] Concurrent requests handled

---

## **Troubleshooting Common Issues**

### **Database Connection Issues**
```cmd
# Check database logs
docker logs ssghub-postgres-1

# Restart database
docker restart ssghub-postgres-1
```

### **Service Not Starting**
```cmd
# Check service logs
docker logs ssghub-api-gateway-1

# Check resource usage
docker stats
```

### **Port Conflicts**
```cmd
# Check port usage
netstat -an | findstr :4000
netstat -an | findstr :4001
netstat -an | findstr :4002
```

---

## **Success Criteria**

Your SSGhub Mail platform is **PRODUCTION READY** when:

1. ✅ All 9 services are running
2. ✅ API endpoints respond correctly
3. ✅ Mail server accepts connections
4. ✅ Web interfaces load successfully
5. ✅ User authentication works
6. ✅ Email routing is functional
7. ✅ Enterprise features operational
8. ✅ Performance meets requirements
9. ✅ Security measures active
10. ✅ Failover system tested

---

## **Next Steps After Testing**

1. **Domain Configuration**: Point your domain DNS to the server
2. **SSL Certificates**: Install production SSL certificates
3. **Monitoring Setup**: Configure alerts and monitoring
4. **Backup Strategy**: Implement database and file backups
5. **Customer Onboarding**: Begin pilot customer integrations

---

**🚀 Your SSGhub Mail platform is enterprise-ready for production deployment!**