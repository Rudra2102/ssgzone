# SSGzone Mail - Technical Specifications & API Reference

## Document Version: 1.0
**Last Updated:** January 2024  
**Status:** Final

---

## Table of Contents
1. API Endpoints Reference
2. Database Schema Details
3. System Architecture
4. Integration Guide
5. Security Specifications
6. Performance Specifications

---

## 1. API ENDPOINTS REFERENCE

### Base URL
```
https://api.ssgzone.in/api/v1
```

### Authentication
All requests require one of:
- **API Key:** `X-API-Key: your_api_key_here`
- **JWT Token:** `Authorization: Bearer your_jwt_token`

### Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

---

## SaaS Application Management

### Register SaaS Application
```http
POST /saas/register
Content-Type: application/json

{
  "saas_name": "Learning Management System",
  "saas_slug": "lms"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "saas_name": "Learning Management System",
    "saas_slug": "lms",
    "api_key": "sk_live_abc123xyz789",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get SaaS Details
```http
GET /saas/{id}
X-API-Key: your_api_key
```

### List All SaaS Applications
```http
GET /saas
X-API-Key: your_api_key
```

---

## Tenant Management

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

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "NABC Institute",
    "tenant_slug": "nabc",
    "domain": "nabc.lms.ssgzone.in",
    "status": "active",
    "dns_status": "provisioning",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Tenant Details
```http
GET /tenant/{tenant_slug}
X-API-Key: your_api_key
```

### List All Tenants
```http
GET /tenant
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

## User Management

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

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "amit.shah@nabc.lms.ssgzone.in",
    "first_name": "Amit",
    "last_name": "Shah",
    "status": "active",
    "storage_quota": 1073741824,
    "storage_used": 0,
    "created_at": "2024-01-15T10:30:00Z"
  }
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

---

## Email Operations

### Get Inbox Messages
```http
GET /email/inbox?limit=50&offset=0
Authorization: Bearer user_jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message_id": "msg_abc123",
      "subject": "Welcome to SSGzone",
      "sender": "support@ssgzone.in",
      "recipients": ["amit.shah@nabc.lms.ssgzone.in"],
      "received_at": "2024-01-15T10:30:00Z",
      "flags": ["\\Seen"],
      "size": 2048
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### Send Email
```http
POST /email/send
Authorization: Bearer user_jwt_token
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Test Email",
  "body_text": "Plain text body",
  "body_html": "<p>HTML body</p>",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64_encoded_content",
      "mimetype": "application/pdf"
    }
  ]
}
```

### Get Email Details
```http
GET /email/{message_id}
Authorization: Bearer user_jwt_token
```

### Delete Email
```http
DELETE /email/{message_id}
Authorization: Bearer user_jwt_token
```

### Search Emails
```http
GET /email/search?q=keyword&folder=INBOX&limit=50
Authorization: Bearer user_jwt_token
```

---

## Admin Operations

### Get System Statistics
```http
GET /admin/stats/overview
X-API-Key: admin_api_key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSaas": 5,
    "totalTenants": 25,
    "totalUsers": 1250,
    "totalEmails": 45000,
    "activeUsers": 890,
    "storageUsed": 536870912000
  }
}
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

### System Health Check
```http
GET /admin/health
X-API-Key: admin_api_key
```

---

## DNS Management

### Provision DNS Records
```http
POST /dns/provision
X-API-Key: your_api_key
Content-Type: application/json

{
  "tenant_id": 1,
  "provider": "cloudflare",
  "api_token": "your_cloudflare_token"
}
```

### Get DNS Status
```http
GET /dns/status/{tenant_id}
X-API-Key: your_api_key
```

### Update DNS Record
```http
PUT /dns/{record_id}
X-API-Key: your_api_key
Content-Type: application/json

{
  "value": "new_value",
  "ttl": 3600
}
```

---

## Enterprise APIs

### Create Mailing List
```http
POST /groups/create
X-API-Key: your_api_key
Content-Type: application/json

{
  "tenant_id": 1,
  "group_name": "Engineering Team",
  "group_email": "engineering@nabc.lms.ssgzone.in",
  "members": ["user1@nabc.lms.ssgzone.in", "user2@nabc.lms.ssgzone.in"]
}
```

### Register Webhook
```http
POST /webhooks/register
X-API-Key: your_api_key
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/ssgzone",
  "events": ["email.received", "email.sent", "user.created"],
  "active": true
}
```

### Set DMARC Policy
```http
POST /dmarc/policy
X-API-Key: your_api_key
Content-Type: application/json

{
  "tenant_id": 1,
  "policy": "reject",
  "rua_email": "dmarc-reports@your-domain.com",
  "ruf_email": "dmarc-forensics@your-domain.com"
}
```

### Get Audit Logs
```http
GET /audit/logs?limit=100&offset=0&action=user.created
X-API-Key: admin_api_key
```

### Set Retention Policy
```http
POST /retention/policy
X-API-Key: your_api_key
Content-Type: application/json

{
  "tenant_id": 1,
  "retention_days": 365,
  "auto_delete": true
}
```

---

## 2. DATABASE SCHEMA DETAILS

### Core Tables

#### saas_applications
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

#### tenants
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

#### users
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

#### messages
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

#### audit_logs
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

#### dns_records
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

#### usage_analytics
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

## 3. SYSTEM ARCHITECTURE

### Deployment Architecture
```
┌─────────────────────────────────────────┐
│         Nginx Reverse Proxy             │
│      (SSL/TLS Termination)              │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼──┐  ┌───▼──┐  ┌───▼──┐
│ API  │  │Admin │  │Web   │
│Gate  │  │Portal│  │mail  │
│way   │  │      │  │      │
└───┬──┘  └──────┘  └──────┘
    │
┌───▼──────────────────────────┐
│   Backend Services           │
├──────────────────────────────┤
│ • Mail Server (SMTP/IMAP)    │
│ • Calendar Service           │
│ • DNS Manager                │
│ • IP Warmup Service          │
└───┬──────────────────────────┘
    │
┌───▼──────────────────────────┐
│   Data Layer                 │
├──────────────────────────────┤
│ • PostgreSQL (Primary DB)    │
│ • Redis (Cache)              │
│ • Elasticsearch (Search)     │
│ • MinIO (Object Storage)     │
└──────────────────────────────┘
```

### Service Ports
| Service | Port | Protocol |
|---------|------|----------|
| API Gateway | 3000 | HTTP/HTTPS |
| Admin Portal | 3001 | HTTP/HTTPS |
| DNS Manager | 3002 | HTTP/HTTPS |
| Mail Server (SMTP) | 25 | SMTP |
| Mail Server (IMAP) | 143 | IMAP |
| Mail Server (POP3) | 110 | POP3 |
| Calendar Service | 8008 | HTTP/HTTPS |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Elasticsearch | 9200 | HTTP |
| MinIO | 9000 | HTTP |
| Webmail Client | 4002 | HTTP/HTTPS |

---

## 4. INTEGRATION GUIDE

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

## 5. SECURITY SPECIFICATIONS

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
   - Implicit Flow (for web apps)
   - Client Credentials Flow (for services)

### Encryption Standards
- **Data at Rest:** AES-256
- **Data in Transit:** TLS 1.3
- **Password Hashing:** bcrypt (10 rounds)
- **API Keys:** SHA-256

### Rate Limiting
- **Default:** 100 requests per 15 minutes per API key
- **Burst:** 10 requests per second
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### CORS Policy
```
Allowed Origins: https://your-domain.com
Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
Allowed Headers: Content-Type, Authorization, X-API-Key
Credentials: true
```

---

## 6. PERFORMANCE SPECIFICATIONS

### SLA Guarantees
- **Uptime:** 99.9% (8.76 hours downtime/year)
- **Response Time:** <150ms (p95)
- **Email Delivery:** 99.95%
- **Failover Recovery:** 45 seconds

### Capacity Limits
- **Max Email Size:** 25 MB
- **Max Attachment Size:** 25 MB
- **Max Recipients:** 100 per email
- **Storage Quota:** Configurable per user
- **API Rate Limit:** 100 req/15min per key

### Scalability
- **Concurrent Users:** 10,000+
- **Emails/Minute:** 12,000+
- **Tenants:** Unlimited
- **Users per Tenant:** Unlimited
- **Storage:** Petabyte-scale

---

**End of Technical Specifications Document**
