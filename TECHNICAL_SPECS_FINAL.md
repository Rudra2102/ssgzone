# SSGzone Mail - Technical Specifications

**Version:** 1.0  
**Date:** January 2024  
**Status:** Final

---

## API Endpoints Reference

### Base URL
```
https://api.ssgzone.in/api/v1
```

### Authentication
- **API Key:** `X-API-Key: your_api_key_here`
- **JWT Token:** `Authorization: Bearer your_jwt_token`

---

## SaaS Management APIs

### Register SaaS Application
```http
POST /saas/register
Content-Type: application/json

{
  "saas_name": "Learning Management System",
  "saas_slug": "lms"
}
```

### List SaaS Applications
```http
GET /saas
X-API-Key: your_api_key
```

### Get SaaS Details
```http
GET /saas/{id}
X-API-Key: your_api_key
```

---

## Tenant Management APIs

### Provision New Tenant
```http
POST /tenant/provision
X-API-Key: your_api_key
Content-Type: application/json

{
  "saas_slug": "lms",
  "company_name": "NABC Institute",
  "tenant_slug": "nabc"
}
```

### List All Tenants
```http
GET /tenant
X-API-Key: your_api_key
```

### Get Tenant Details
```http
GET /tenant/{tenant_slug}
X-API-Key: your_api_key
```

### Update Tenant
```http
PUT /tenant/{id}
X-API-Key: your_api_key
Content-Type: application/json

{
  "company_name": "Updated Name",
  "status": "active"
}
```

### Delete Tenant
```http
DELETE /tenant/{id}
X-API-Key: your_api_key
```

---

## User Management APIs

### Create User Mailbox
```http
POST /user/create
X-API-Key: your_api_key
Content-Type: application/json

{
  "tenant_slug": "nabc",
  "saas_slug": "lms",
  "first_name": "Amit",
  "last_name": "Shah",
  "password": "SecurePassword123!"
}
```

### Get User Details
```http
GET /user/{email}
X-API-Key: your_api_key
```

### Update User
```http
PUT /user/{id}
X-API-Key: your_api_key
Content-Type: application/json

{
  "first_name": "Amit",
  "last_name": "Shah",
  "status": "active"
}
```

### Suspend User
```http
POST /user/suspend
X-API-Key: your_api_key
Content-Type: application/json

{
  "email": "amit.shah@nabc.lms.ssgzone.in"
}
```

### Delete User
```http
DELETE /user/delete
X-API-Key: your_api_key
Content-Type: application/json

{
  "email": "amit.shah@nabc.lms.ssgzone.in"
}
```

### Reset Password
```http
POST /user/password/reset
X-API-Key: your_api_key
Content-Type: application/json

{
  "email": "amit.shah@nabc.lms.ssgzone.in",
  "new_password": "NewSecurePassword456!"
}
```

### List Users
```http
GET /user
X-API-Key: your_api_key
```

---

## Webmail APIs

### Get Inbox Messages
```http
GET /webmail/inbox?limit=50&offset=0
Authorization: Bearer user_jwt_token
```

### Send Email
```http
POST /webmail/send
Authorization: Bearer user_jwt_token
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "subject": "Test Email",
  "body_html": "<p>HTML body</p>",
  "attachments": []
}
```

### Get Email Details
```http
GET /webmail/{message_id}
Authorization: Bearer user_jwt_token
```

### Delete Email
```http
DELETE /webmail/{message_id}
Authorization: Bearer user_jwt_token
```

### Search Emails
```http
GET /webmail/search?q=keyword&folder=INBOX&limit=50
Authorization: Bearer user_jwt_token
```

---

## Admin APIs

### Get System Statistics
```http
GET /admin/stats/overview
X-API-Key: admin_api_key
```

### Get Email Volume Data
```http
GET /admin/stats/email-volume?days=7
X-API-Key: admin_api_key
```

### Get Tenant Distribution
```http
GET /admin/stats/tenant-distribution
X-API-Key: admin_api_key
```

### Get Recent Activity
```http
GET /admin/activity/recent?limit=100
X-API-Key: admin_api_key
```

---

## Communication Platform APIs

### Send Communication
```http
POST /communication/send
X-API-Key: your_api_key
Content-Type: application/json

{
  "tenant_id": 1,
  "recipient_id": 1,
  "message": "Communication message",
  "type": "notification"
}
```

### Get Communication History
```http
GET /communication/history?tenant_id=1&limit=50
X-API-Key: your_api_key
```

### Get Communication Templates
```http
GET /communication/templates
X-API-Key: your_api_key
```

---

## Tenant Admin APIs

### Get Dashboard Data
```http
GET /tenant-admin/dashboard
Authorization: Bearer tenant_admin_jwt
```

### List Users
```http
GET /tenant-admin/users
Authorization: Bearer tenant_admin_jwt
```

### Create User
```http
POST /tenant-admin/users
Authorization: Bearer tenant_admin_jwt
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePassword123!"
}
```

### Get Analytics
```http
GET /tenant-admin/analytics
Authorization: Bearer tenant_admin_jwt
```

---

## Super Admin APIs

### Get Dashboard Data
```http
GET /super-admin/dashboard
Authorization: Bearer super_admin_jwt
```

### List SaaS Applications
```http
GET /super-admin/saas
Authorization: Bearer super_admin_jwt
```

### List All Tenants
```http
GET /super-admin/tenants
Authorization: Bearer super_admin_jwt
```

---

## Database Schema

### saas_applications
```sql
CREATE TABLE saas_applications (
    id SERIAL PRIMARY KEY,
    saas_name VARCHAR(255) NOT NULL,
    saas_slug VARCHAR(100) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tenants
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    saas_id INTEGER REFERENCES saas_applications(id),
    company_name VARCHAR(255) NOT NULL,
    tenant_slug VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(saas_id, tenant_slug)
);
```

### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    storage_quota BIGINT DEFAULT 1073741824,
    storage_used BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

### messages
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message_id VARCHAR(255) UNIQUE NOT NULL,
    folder VARCHAR(50) DEFAULT 'INBOX',
    subject TEXT,
    sender VARCHAR(255),
    recipients TEXT[],
    body_text TEXT,
    body_html TEXT,
    attachments JSONB,
    size BIGINT,
    flags VARCHAR(50)[],
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    saas_id INTEGER REFERENCES saas_applications(id),
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### dns_records
```sql
CREATE TABLE dns_records (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    record_type VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    ttl INTEGER DEFAULT 3600,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### usage_analytics
```sql
CREATE TABLE usage_analytics (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    date DATE NOT NULL,
    emails_sent INTEGER DEFAULT 0,
    emails_received INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, date)
);
```

---

## Integration Examples

### Node.js SDK
```javascript
const SSGzoneMail = require('ssgzone-mail-sdk');

const client = new SSGzoneMail({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.ssgzone.in'
});

// Create user
const user = await client.users.create({
  tenant_slug: 'nabc',
  saas_slug: 'lms',
  first_name: 'Amit',
  last_name: 'Shah',
  password: 'SecurePassword123!'
});

// Send email
const result = await client.emails.send({
  to: ['recipient@example.com'],
  subject: 'Test Email',
  body_html: '<p>Hello World</p>'
});
```

### Python SDK
```python
from ssgzone_mail import SSGzoneMailClient

client = SSGzoneMailClient(
    api_key='your_api_key',
    base_url='https://api.ssgzone.in'
)

# Create user
user = client.users.create(
    tenant_slug='nabc',
    saas_slug='lms',
    first_name='Amit',
    last_name='Shah',
    password='SecurePassword123!'
)

# Send email
result = client.emails.send(
    to=['recipient@example.com'],
    subject='Test Email',
    body_html='<p>Hello World</p>'
)
```

---

## Security Specifications

### Authentication Methods
1. **API Key Authentication**
   - Header: `X-API-Key: your_api_key`
   - Scope: SaaS-level operations
   - Rotation: Every 90 days recommended

2. **JWT Token Authentication**
   - Header: `Authorization: Bearer token`
   - Expiry: 24 hours
   - Refresh: Via refresh token endpoint

3. **OAuth 2.0**
   - Authorization Code Flow
   - Client Credentials Flow

### Encryption Standards
- **Data at Rest:** AES-256
- **Data in Transit:** TLS 1.3
- **Password Hashing:** bcrypt (10 rounds)

### Rate Limiting
- **Default:** 100 requests per 15 minutes per API key
- **Burst:** 10 requests per second
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Performance Specifications

### SLA Guarantees
- **Uptime:** 99.9%
- **Response Time:** <150ms (p95)
- **Email Delivery:** 99.95%
- **Failover Recovery:** 45 seconds

### Capacity Limits
- **Max Email Size:** 25 MB
- **Max Attachment Size:** 25 MB
- **Max Recipients:** 100 per email
- **API Rate Limit:** 100 req/15min per key

### Scalability
- **Concurrent Users:** 10,000+
- **Emails/Minute:** 12,000+
- **Tenants:** Unlimited
- **Storage:** Petabyte-scale

---

## Deployment Requirements

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- Elasticsearch 8+
- MinIO (optional)
- Nginx (reverse proxy)

### Environment Variables
```
API_PORT=4000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ssgzone_mail
DB_USER=ssgzone
DB_PASSWORD=academy
REDIS_URL=redis://redis:6379
ELASTICSEARCH_URL=http://elasticsearch:9200
DOMAIN=ssgzone.in
```

---

## Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| API Gateway | 4000 | HTTP/HTTPS |
| Admin Portal | 3001 | HTTP/HTTPS |
| DNS Manager | 3002 | HTTP/HTTPS |
| IP Warmup | 3004 | HTTP/HTTPS |
| Mail Server (SMTP) | 25 | SMTP |
| Mail Server (Submission) | 587 | SMTP |
| Mail Server (IMAP) | 143 | IMAP |
| Calendar Service | 8008 | HTTP/HTTPS |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Elasticsearch | 9200 | HTTP |
| MinIO | 9000 | HTTP |
| Webmail Client | 4002 | HTTP/HTTPS |

---

**End of Technical Specifications**
