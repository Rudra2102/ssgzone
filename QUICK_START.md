# SSGhub Mail - Quick Start Guide

## Overview
SSGhub Mail is an independent, scalable email service platform that provides custom email accounts for multi-tenant SaaS applications using the `ssgzone.in` domain.

## Email Structure
```
username@tenant_slug.saas_slug.ssgzone.in
```

**Examples:**
- `amit.shah@nabc.lms.ssgzone.in` (LMS integration)
- `ajay.singh@abcdevelopers.rupyo.ssgzone.in` (Rupyo integration)

## Quick Setup (Development)

### Prerequisites
- Docker & Docker Compose
- 8GB+ RAM
- 10GB+ free disk space

### 1. Clone & Setup
```bash
# Windows
git clone https://github.com/ssghub/mail-platform.git
cd mail-platform
setup.bat

# Linux/macOS
git clone https://github.com/ssghub/mail-platform.git
cd mail-platform
chmod +x setup.sh
./setup.sh
```

### 2. Access Services
- **Admin Portal:** http://localhost:3001
- **API Gateway:** http://localhost:3005
- **Webmail Client:** http://localhost:3002

## Integration Example

### Step 1: Register Your SaaS Application
```bash
curl -X POST http://localhost:3005/api/v1/saas/register \
  -H "Content-Type: application/json" \
  -d '{
    "saas_name": "Learning Management System",
    "saas_slug": "lms"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "saas_name": "Learning Management System",
    "saas_slug": "lms",
    "api_key": "your-generated-api-key",
    "status": "active"
  }
}
```

### Step 2: Provision a Tenant (Company)
```bash
curl -X POST http://localhost:3005/api/v1/tenant/provision \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-generated-api-key" \
  -d '{
    "saas_slug": "lms",
    "company_name": "NABC Institute",
    "tenant_slug": "nabc"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "NABC Institute",
    "tenant_slug": "nabc",
    "domain": "nabc.lms.ssgzone.in",
    "status": "active",
    "dns_status": "provisioning"
  }
}
```

### Step 3: Create User Mailbox
```bash
curl -X POST http://localhost:3005/api/v1/user/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-generated-api-key" \
  -d '{
    "tenant_slug": "nabc",
    "saas_slug": "lms",
    "first_name": "Amit",
    "last_name": "Shah",
    "password": "secure_password_123"
  }'
```

**Response:**
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
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Email Client Configuration

### SMTP Settings (Sending)
- **Server:** mail.ssgzone.in
- **Port:** 587 (STARTTLS) or 465 (SSL)
- **Username:** amit.shah@nabc.lms.ssgzone.in
- **Password:** secure_password_123
- **Authentication:** Required

### IMAP Settings (Receiving)
- **Server:** mail.ssgzone.in
- **Port:** 993 (SSL) or 143 (STARTTLS)
- **Username:** amit.shah@nabc.lms.ssgzone.in
- **Password:** secure_password_123
- **Authentication:** Required

## Webmail Access
Users can access their email via the webmail client:
```
https://webmail.ssgzone.in
```

Login with:
- **Email:** amit.shah@nabc.lms.ssgzone.in
- **Password:** secure_password_123

## Integration Code Examples

### Node.js
```javascript
const axios = require('axios');

class SSGhubMailClient {
  constructor(apiKey, baseUrl = 'http://localhost:3005') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async createUser(tenantSlug, saasSlug, firstName, lastName, password) {
    const response = await axios.post(`${this.baseUrl}/api/v1/user/create`, {
      tenant_slug: tenantSlug,
      saas_slug: saasSlug,
      first_name: firstName,
      last_name: lastName,
      password: password
    }, {
      headers: { 'X-API-Key': this.apiKey }
    });
    
    return response.data;
  }

  async suspendUser(email) {
    const response = await axios.post(`${this.baseUrl}/api/v1/user/suspend`, {
      email: email
    }, {
      headers: { 'X-API-Key': this.apiKey }
    });
    
    return response.data;
  }
}

// Usage
const mailClient = new SSGhubMailClient('your-api-key');
const user = await mailClient.createUser('nabc', 'lms', 'Amit', 'Shah', 'password123');
console.log(`Created user: ${user.data.email}`);
```

### PHP
```php
<?php
class SSGhubMailClient {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'http://localhost:3005') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    public function createUser($tenantSlug, $saasSlug, $firstName, $lastName, $password) {
        $data = [
            'tenant_slug' => $tenantSlug,
            'saas_slug' => $saasSlug,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'password' => $password
        ];
        
        $options = [
            'http' => [
                'header' => [
                    'Content-Type: application/json',
                    'X-API-Key: ' . $this->apiKey
                ],
                'method' => 'POST',
                'content' => json_encode($data)
            ]
        ];
        
        $context = stream_context_create($options);
        $result = file_get_contents($this->baseUrl . '/api/v1/user/create', false, $context);
        
        return json_decode($result, true);
    }
}

// Usage
$mailClient = new SSGhubMailClient('your-api-key');
$user = $mailClient->createUser('nabc', 'lms', 'Amit', 'Shah', 'password123');
echo "Created user: " . $user['data']['email'];
?>
```

### Python
```python
import requests

class SSGhubMailClient:
    def __init__(self, api_key, base_url='http://localhost:3005'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
    
    def create_user(self, tenant_slug, saas_slug, first_name, last_name, password):
        data = {
            'tenant_slug': tenant_slug,
            'saas_slug': saas_slug,
            'first_name': first_name,
            'last_name': last_name,
            'password': password
        }
        
        response = requests.post(
            f'{self.base_url}/api/v1/user/create',
            json=data,
            headers=self.headers
        )
        
        return response.json()
    
    def suspend_user(self, email):
        data = {'email': email}
        
        response = requests.post(
            f'{self.base_url}/api/v1/user/suspend',
            json=data,
            headers=self.headers
        )
        
        return response.json()

# Usage
mail_client = SSGhubMailClient('your-api-key')
user = mail_client.create_user('nabc', 'lms', 'Amit', 'Shah', 'password123')
print(f"Created user: {user['data']['email']}")
```

## Production Deployment

For production deployment with proper DNS, SSL, and security:

1. **See:** `docs/DEPLOYMENT.md`
2. **Configure DNS:** Set up MX, SPF, DKIM records
3. **SSL Certificates:** Use Let's Encrypt or commercial certs
4. **Security:** Enable firewall, fail2ban, monitoring
5. **Backup:** Set up automated backups

## Support & Documentation

- **Full API Docs:** `docs/API.md`
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Support:** support@ssghub.com

## Common Use Cases

### 1. LMS Integration
- Students get: `student.name@school.lms.ssgzone.in`
- Teachers get: `teacher.name@school.lms.ssgzone.in`
- Admins get: `admin.name@school.lms.ssgzone.in`

### 2. HRMS Integration
- Employees get: `first.last@company.hrms.ssgzone.in`
- Managers get: `manager.name@company.hrms.ssgzone.in`

### 3. Multi-tenant SaaS
- Each client company gets their own subdomain
- Users within each company get individual mailboxes
- Complete isolation between tenants

## Next Steps

1. **Test the API** with your SaaS application
2. **Configure DNS** for your domain
3. **Set up monitoring** and backups
4. **Deploy to production** following the deployment guide
5. **Integrate** with your existing user management system