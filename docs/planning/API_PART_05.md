# SSGzone Communication Platform
# API BLUEPRINT
# D4 — PART 5 OF 5
## Notifications API, Search API & Integration API

---

# SECTION 12 — NOTIFICATIONS API

**Base path**: `/api/v1/notifications`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 300 requests/minute

---

### GET /api/v1/notifications

List notifications for the authenticated user.

**Query Parameters**:

| Parameter | Description |
|-----------|-------------|
| page | Page number |
| per_page | Default 20, max 50 |
| is_read | true \| false |
| type | Filter by notification type |

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "mail.received | chat.mention | cal.reminder | drive.shared",
      "title": "string",
      "body": "string | null",
      "action_url": "string | null",
      "is_read": false,
      "created_at": "ISO8601"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "unread_count": 12
  }
}
```

---

### GET /api/v1/notifications/unread-count

Get unread notification count only (lightweight endpoint for badge).

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "total": 12,
    "by_type": {
      "mail": 5,
      "chat": 6,
      "calendar": 1,
      "drive": 0
    }
  }
}
```

---

### PATCH /api/v1/notifications/:id/read

Mark a single notification as read.

**Response** `200`: `{ "success": true }`

---

### POST /api/v1/notifications/read-all

Mark all notifications as read.

**Request Body**: `{ "type": "mail | chat | all" }` (optional filter)

**Response** `200`: `{ "success": true, "data": { "marked_count": 12 } }`

---

### DELETE /api/v1/notifications/:id

Delete a notification.

**Response** `204`

---

### DELETE /api/v1/notifications

Delete all read notifications.

**Response** `204`

---

## 12.1 Notification Preferences

### GET /api/v1/notifications/preferences

Get notification preferences for the authenticated user.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "mail_inapp": true,
    "mail_push": true,
    "mail_digest": true,
    "chat_inapp": true,
    "chat_push": true,
    "chat_mention_only": false,
    "calendar_inapp": true,
    "calendar_push": true,
    "drive_inapp": true,
    "drive_push": false,
    "digest_frequency": "daily",
    "digest_time": "08:00"
  }
}
```

---

### PUT /api/v1/notifications/preferences

Update notification preferences.

**Request Body**: Any subset of preference fields

**Response** `200`: Updated preferences object

---

## 12.2 Push Subscriptions

### POST /api/v1/notifications/push/subscribe

Register a browser push subscription.

**Request Body**:
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "p256dh": "string",
  "auth": "string"
}
```

**Response** `201`: `{ "success": true }`

---

### DELETE /api/v1/notifications/push/unsubscribe

Remove push subscription for current device.

**Request Body**: `{ "endpoint": "string" }`

**Response** `204`

---

---

# SECTION 13 — SEARCH API

**Base path**: `/api/v1/search`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 60 requests/minute

---

### GET /api/v1/search

Unified search across all modules.

**Query Parameters**:

| Parameter | Required | Description |
|-----------|----------|-------------|
| q | Yes | Search query (min 2 characters) |
| modules | No | Comma-separated: mail,chat,contacts,drive,calendar |
| from_date | No | ISO8601 date filter |
| to_date | No | ISO8601 date filter |
| sender_id | No | Filter by sender/author user ID |
| page | No | Default 1 |
| per_page | No | Default 20, max 50 |

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "module": "mail",
        "id": "uuid",
        "title": "Re: Project Update",
        "preview": "...the <em>invoice</em> has been sent...",
        "metadata": {
          "from": "john@company.com",
          "date": "ISO8601"
        },
        "action_url": "/webmail/mail/messages/uuid"
      },
      {
        "module": "chat",
        "id": "uuid",
        "title": "#general",
        "preview": "...please check the <em>invoice</em>...",
        "metadata": {
          "sender": "Jane Smith",
          "date": "ISO8601"
        },
        "action_url": "/webmail/chat/channels/uuid/messages/uuid"
      }
    ],
    "totals": {
      "mail": 12,
      "chat": 5,
      "contacts": 2,
      "drive": 1,
      "calendar": 0
    }
  },
  "meta": { "page": 1, "per_page": 20, "total": 20 }
}
```

**Error**: `400` if query is less than 2 characters
**Error**: `503` if Elasticsearch is unavailable (with fallback message)

---

### GET /api/v1/search/suggestions

Get search suggestions as user types (autocomplete).

**Query Parameters**: `q` (min 2 chars)

**Response** `200`:
```json
{
  "success": true,
  "data": [
    { "type": "contact", "label": "John Smith", "value": "john.smith@..." },
    { "type": "channel", "label": "#project-alpha", "value": "uuid" },
    { "type": "file", "label": "Q4 Report.pdf", "value": "uuid" }
  ]
}
```

---

---

# SECTION 14 — INTEGRATION API

**Base path**: `/api/v1/integration`
**Auth Required**: API Key (`X-API-Key` header)
**Rate Limit**: 1000 requests/minute per API key

These endpoints are used by external SaaS applications to integrate with SSGzone programmatically.

---

## 14.1 Tenant Provisioning

### POST /api/v1/integration/tenants

Provision a new tenant.

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "slug": "acme",
  "admin_email": "admin@acme.com",
  "admin_first_name": "Raj",
  "admin_last_name": "Sharma",
  "admin_password": "string",
  "max_users": 50,
  "storage_quota_gb": 10
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "tenant_id": "uuid",
    "slug": "acme",
    "email_domain": "acme.yoursaas.ssgzone.in",
    "admin_email": "admin@acme.com",
    "status": "active",
    "provisioned_at": "ISO8601"
  }
}
```

**Error**: `409` if slug already exists
**Error**: `422` if tenant count would exceed plan limit

---

### GET /api/v1/integration/tenants/:slug

Get tenant details by slug.

**Response** `200`: Tenant object with usage stats

---

### PATCH /api/v1/integration/tenants/:slug/status

Suspend or reactivate a tenant.

**Request Body**: `{ "status": "active | suspended" }`

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/integration/tenants/:slug

Delete a tenant.

**Response** `204`

---

## 14.2 User Management

### POST /api/v1/integration/tenants/:slug/users

Create a user in a tenant.

**Request Body**:
```json
{
  "first_name": "string",
  "last_name": "string",
  "username": "string",
  "password": "string",
  "role": "user | manager",
  "department": "string | null",
  "storage_quota_gb": 5
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "username@slug.saas.ssgzone.in",
    "status": "active"
  }
}
```

---

### GET /api/v1/integration/tenants/:slug/users

List users in a tenant.

**Query Parameters**: `page`, `per_page`, `status`

**Response** `200`: Paginated user list

---

### PATCH /api/v1/integration/tenants/:slug/users/:user_id/status

Activate or suspend a user.

**Request Body**: `{ "status": "active | suspended" }`

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/integration/tenants/:slug/users/:user_id

Delete a user.

**Response** `204`

---

## 14.3 SSO Token

### POST /api/v1/integration/sso/token

Generate a single-use SSO token for a user.

**Request Body**:
```json
{
  "user_email": "username@slug.saas.ssgzone.in",
  "redirect_url": "https://yourapp.com/dashboard"
}
```

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "sso_token": "eyJ...",
    "login_url": "https://slug.saas.ssgzone.in/sso?token=eyJ...",
    "expires_in": 300
  }
}
```

**Token Properties**:
- Signed JWT (not Base64)
- Single-use — invalidated after first use
- Expires in 5 minutes
- Contains: user_id, tenant_id, saas_app_id, redirect_url

---

## 14.4 Usage & Stats

### GET /api/v1/integration/usage

Get current usage for this SaaS application.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "tenant_count": 45,
    "tenant_limit": 100,
    "user_count": 1250,
    "storage_used_gb": 45.2,
    "storage_quota_gb": 500,
    "emails_sent_this_month": 12500,
    "monthly_email_limit": 100000,
    "api_calls_this_month": 8900,
    "monthly_api_limit": 100000
  }
}
```

---

---

# SECTION 15 — COMPLETE API ENDPOINT INDEX

---

## Authentication
| Method | Endpoint |
|--------|----------|
| POST | /api/v1/auth/login |
| POST | /api/v1/auth/refresh |
| POST | /api/v1/auth/logout |
| POST | /api/v1/auth/forgot-password |
| POST | /api/v1/auth/reset-password |
| POST | /api/v1/auth/2fa/setup |
| POST | /api/v1/auth/2fa/verify |
| DELETE | /api/v1/auth/2fa |

## Super Admin (14 endpoints)
| Method | Endpoint |
|--------|----------|
| GET | /api/v1/super-admin/saas-apps |
| POST | /api/v1/super-admin/saas-apps |
| GET | /api/v1/super-admin/saas-apps/:id |
| PUT | /api/v1/super-admin/saas-apps/:id |
| PATCH | /api/v1/super-admin/saas-apps/:id/status |
| DELETE | /api/v1/super-admin/saas-apps/:id |
| GET | /api/v1/super-admin/users |
| POST | /api/v1/super-admin/users/:id/impersonate |
| DELETE | /api/v1/super-admin/users/:id/sessions |
| GET | /api/v1/super-admin/audit-logs |
| GET | /api/v1/super-admin/audit-logs/export |
| GET | /api/v1/super-admin/mail/health |
| GET | /api/v1/super-admin/mail/queue |
| POST | /api/v1/super-admin/mail/queue/:id/retry |
| DELETE | /api/v1/super-admin/mail/queue/:id |
| GET | /api/v1/super-admin/system/health |
| GET | /api/v1/super-admin/system/stats |

## SaaS Admin (25 endpoints) — See Part 2
## Tenant Admin (20 endpoints) — See Part 2
## Mail (22 endpoints) — See Part 3
## Calendar (12 endpoints) — See Part 3
## Contacts (14 endpoints) — See Part 3
## Chat (22 endpoints + WebSocket) — See Part 4
## Video (7 endpoints) — See Part 4
## Drive (20 endpoints) — See Part 4
## Notifications (10 endpoints) — See Part 5
## Search (2 endpoints) — See Part 5
## Integration (10 endpoints) — See Part 5

**Total REST Endpoints: ~168**
**WebSocket Events: 16 (8 client→server, 8 server→client)**

---

## D4 — API BLUEPRINT COMPLETE

| Part | File | Contents |
|------|------|----------|
| Part 1 | API_PART_01.md | Standards, Auth API, Super Admin API |
| Part 2 | API_PART_02.md | SaaS Admin API, Tenant Admin API |
| Part 3 | API_PART_03.md | Mail API, Calendar API, Contacts API |
| Part 4 | API_PART_04.md | Chat API, Video API, Drive API |
| Part 5 | API_PART_05.md | Notifications API, Search API, Integration API |

*Next Document: D5 — UI/UX Design System*
