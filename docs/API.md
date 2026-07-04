# SSGhub Mail API Documentation

## Overview
The SSGhub Mail API provides endpoints for SaaS applications to integrate email services for their tenants and users.

## Base URL
```
https://api.ssghub.com/api/v1
```

## Authentication
All API requests require an API key in the header:
```
X-API-Key: your_api_key_here
```

## Core API Endpoints

### 1. SaaS Application Management

#### Register SaaS Application
```http
POST /saas/register
Content-Type: application/json

{
  "saas_name": "Learning Management System",
  "saas_slug": "lms"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "saas_name": "Learning Management System",
    "saas_slug": "lms",
    "api_key": "uuid-generated-api-key",
    "status": "active"
  }
}
```

#### Get API Keys
```http
GET /saas/keys
X-API-Key: your_api_key
```

### 2. Tenant (Company) Provisioning

#### Provision New Tenant
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

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "NABC Institute",
    "tenant_slug": "nabc",
    "domain": "nabc.lms.ssghub.com",
    "status": "active",
    "dns_status": "provisioning"
  }
}
```

#### Get Tenant Details
```http
GET /tenant/{tenant_slug}
X-API-Key: your_api_key
```

#### List All Tenants
```http
GET /tenant
X-API-Key: your_api_key
```

### 3. User (Mailbox) Management

#### Create User Mailbox
```http
POST /user/create
X-API-Key: your_api_key
Content-Type: application/json

{
  "tenant_slug": "nabc",
  "saas_slug": "lms",
  "first_name": "Amit",
  "last_name": "Shah",
  "password": "secure_password_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "amit.shah@nabc.lms.ssghub.com",
    "first_name": "Amit",
    "last_name": "Shah",
    "status": "active",
    "storage_quota": 1073741824,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Suspend User
```http
POST /user/suspend
X-API-Key: your_api_key
Content-Type: application/json

{
  "email": "amit.shah@nabc.lms.ssghub.com"
}
```

#### Delete User
```http
DELETE /user/delete
X-API-Key: your_api_key
Content-Type: application/json

{
  "email": "amit.shah@nabc.lms.ssghub.com"
}
```

#### Reset Password
```http
POST /user/password/reset
X-API-Key: your_api_key
Content-Type: application/json

{
  "email": "amit.shah@nabc.lms.ssghub.com",
  "new_password": "new_secure_password_456"
}
```

#### Get User Details
```http
GET /user/{email}
X-API-Key: your_api_key
```

## Email Structure Examples

### LMS Integration
- **Domain Pattern:** `tenant_slug.lms.ssghub.com`
- **Example:** `amit.shah@nabc.lms.ssghub.com`

### Rupyo Integration
- **Domain Pattern:** `tenant_slug.rupyo.ssghub.com`
- **Example:** `ajay.singh@abcdevelopers.rupyo.ssghub.com`

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (inactive SaaS application)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limits
- **Default:** 100 requests per 15 minutes per API key
- **Burst:** Up to 10 requests per second

## Webhooks (Optional)
Configure webhooks to receive notifications about:
- New email received
- User mailbox full
- DNS propagation status
- System maintenance

## OAuth 2.0 Support

For integrating SaaS applications that need OAuth 2.0:

```http
# Authorization
GET /api/v1/oauth/authorize?client_id=lms&redirect_uri=https://your-app.com/callback&scope=read:emails+write:emails&state=xyz

# Token Exchange
POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=AUTH_CODE&client_id=lms&client_secret=SECRET
```

## SDK Examples

### Node.js
```javascript
const SSGhubMail = require('@ssghub/mail-sdk');

const client = new SSGhubMail({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.ssghub.com'
});

// Create user
const user = await client.users.create({
  tenant_slug: 'nabc',
  saas_slug: 'lms',
  first_name: 'Amit',
  last_name: 'Shah',
  password: 'secure_password'
});
```

### PHP
```php
use SSGhub\\Mail\\Client;

$client = new Client([
    'api_key' => 'your_api_key',
    'base_url' => 'https://api.ssghub.com'
]);

// Create user
$user = $client->users()->create([
    'tenant_slug' => 'nabc',
    'saas_slug' => 'lms',
    'first_name' => 'Amit',
    'last_name' => 'Shah',
    'password' => 'secure_password'
]);
```

## Support
- **Documentation:** https://docs.ssghub.com
- **Support Email:** support@ssghub.com
- **Status Page:** https://status.ssghub.com