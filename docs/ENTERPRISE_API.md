# SSGhub Mail Platform - Enterprise API Documentation

## Phase 2 Enterprise Endpoints

### 🔍 Search API
```
GET /api/v1/search/emails
POST /api/v1/search/advanced
```

**Search Emails**
```bash
GET /api/v1/search/emails?q=urgent&folder=inbox&page=1&limit=20
```

**Advanced Search**
```bash
POST /api/v1/search/advanced
{
  "query": "project update",
  "filters": {
    "folder": "inbox",
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "hasAttachments": true
  },
  "pagination": { "offset": 0, "limit": 20 }
}
```

### 📎 Attachments API
```
POST /api/v1/attachments/upload
GET /api/v1/attachments/download/:key
DELETE /api/v1/attachments/:key
```

**Upload Attachment**
```bash
POST /api/v1/attachments/upload
Content-Type: multipart/form-data
file: [binary data]
message_id: "12345"
```

### 👥 Groups API (Mailing Lists)
```
POST /api/v1/groups/create
GET /api/v1/groups
GET /api/v1/groups/:groupId
POST /api/v1/groups/:groupId/members
DELETE /api/v1/groups/:groupId/members/:userId
```

**Create Distribution Group**
```bash
POST /api/v1/groups/create
{
  "name": "Sales Team",
  "email": "sales@nabc.lms.ssghub.com",
  "description": "Sales team distribution list",
  "members": [
    {"user_id": 1, "role": "member"},
    {"user_id": 2, "role": "moderator"}
  ],
  "is_public": false
}
```

### 🤖 Auto-Responder API
```
POST /api/v1/autoresponder/setup
GET /api/v1/autoresponder
POST /api/v1/autoresponder/disable
```

**Setup Out-of-Office**
```bash
POST /api/v1/autoresponder/setup
{
  "subject": "Out of Office",
  "message": "I'm currently out of office until January 20th...",
  "start_date": "2024-01-15T00:00:00Z",
  "end_date": "2024-01-20T23:59:59Z",
  "is_active": true
}
```

### 🔗 Webhooks API
```
POST /api/v1/webhooks/register
GET /api/v1/webhooks
PUT /api/v1/webhooks/:webhookId
DELETE /api/v1/webhooks/:webhookId
GET /api/v1/webhooks/:webhookId/deliveries
POST /api/v1/webhooks/:webhookId/test
```

**Register Webhook**
```bash
POST /api/v1/webhooks/register
{
  "url": "https://your-app.com/webhooks/ssghub",
  "events": ["email.received", "email.bounced", "user.created"],
  "secret": "your-webhook-secret"
}
```

**Webhook Events**
- `email.received` - New email received
- `email.bounced` - Email delivery failed
- `user.created` - New user registered
- `spam.complaint` - Spam complaint received
- `quota.exceeded` - Usage limit exceeded

### 🗄️ Data Retention API
```
POST /api/v1/retention/policies
GET /api/v1/retention/policies
GET /api/v1/retention/stats
POST /api/v1/retention/process
```

**Create Retention Policy**
```bash
POST /api/v1/retention/policies
{
  "name": "Standard Policy",
  "retention_days": 2555,
  "archive_after_days": 365,
  "auto_delete": false
}
```

### 📊 Metrics API
```
GET /api/v1/metrics/tenant
GET /api/v1/metrics/system
```

**Get Tenant Metrics**
```bash
GET /api/v1/metrics/tenant?timeframe=24h
```

**Response**
```json
{
  "success": true,
  "metrics": {
    "emails": {
      "total_emails": 15420,
      "recent_emails": 234,
      "archived_emails": 8500,
      "avg_attachments": 1.2
    },
    "storage": {
      "total_storage_bytes": 2147483648
    },
    "bounces": {
      "total_bounces": 45,
      "hard_bounces": 12,
      "soft_bounces": 33
    },
    "webhooks": {
      "total_deliveries": 1250,
      "successful_deliveries": 1230,
      "failed_deliveries": 20
    }
  }
}
```

## Webhook Payload Examples

### Email Received
```json
{
  "event": "email.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenant_id": 123,
  "data": {
    "id": 456789,
    "from": "user@example.com",
    "to": "recipient@nabc.lms.ssghub.com",
    "subject": "Important Update",
    "received_at": "2024-01-15T10:30:00Z"
  }
}
```

### Email Bounced
```json
{
  "event": "email.bounced",
  "timestamp": "2024-01-15T10:35:00Z",
  "tenant_id": 123,
  "data": {
    "email_id": 456789,
    "bounce_type": "hard",
    "bounce_reason": "Mailbox does not exist",
    "recipient": "invalid@example.com",
    "bounced_at": "2024-01-15T10:35:00Z"
  }
}
```

## Authentication

All enterprise endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

## Rate Limits

- Standard endpoints: 100 requests per 15 minutes
- Search endpoints: 50 requests per 15 minutes  
- Upload endpoints: 10 requests per 15 minutes

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Webhook Security

Verify webhook signatures using HMAC-SHA256:
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');
```