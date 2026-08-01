# SSGzone Communication Platform
# API BLUEPRINT
# D4 — PART 2 OF 5
## SaaS Admin API & Tenant Admin API

---

# SECTION 4 — SAAS ADMIN API

**Base path**: `/api/v1/saas-admin`
**Auth Required**: SaaS Admin JWT
**Rate Limit**: 100 requests/minute

---

## 4.1 Tenants

### GET /api/v1/saas-admin/tenants

List all tenants under this SaaS application.

**Query Parameters**: `page`, `per_page`, `status`, `search`

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "status": "active | suspended",
      "user_count": 0,
      "storage_used_gb": 0.0,
      "emails_this_month": 0,
      "created_at": "ISO8601"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 45 }
}
```

---

### POST /api/v1/saas-admin/tenants

Create a new tenant.

**Request Body**:
```json
{
  "name": "string",
  "slug": "string",
  "admin_email": "string",
  "admin_first_name": "string",
  "admin_last_name": "string",
  "admin_password": "string",
  "max_users": 50,
  "storage_quota_gb": 10,
  "custom_domain": "string | null"
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "email_domain": "slug.saas.ssgzone.in",
    "admin_email": "string",
    "status": "active"
  }
}
```

**Error**: `409` if slug already exists within this SaaS app
**Error**: `422` if tenant count would exceed plan limit

---

### GET /api/v1/saas-admin/tenants/:id

Get a single tenant with full details.

**Response** `200`: Full tenant object with usage stats

---

### PUT /api/v1/saas-admin/tenants/:id

Update tenant settings.

**Request Body**:
```json
{
  "name": "string",
  "max_users": 100,
  "storage_quota_gb": 20,
  "custom_domain": "string | null"
}
```

**Response** `200`: Updated tenant object

---

### PATCH /api/v1/saas-admin/tenants/:id/status

Suspend or reactivate a tenant.

**Request Body**:
```json
{
  "status": "active | suspended",
  "reason": "string"
}
```

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/saas-admin/tenants/:id

Soft delete a tenant (30-day grace period before hard delete).

**Response** `204`

---

## 4.2 Users (Cross-Tenant View)

### GET /api/v1/saas-admin/users

List all users across all tenants of this SaaS app.

**Query Parameters**: `page`, `per_page`, `tenant_id`, `status`, `search`

**Response** `200`: Paginated user list with tenant info

---

## 4.3 Branding

### GET /api/v1/saas-admin/branding

Get current branding configuration.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "app_name": "string",
    "logo_url": "string | null",
    "favicon_url": "string | null",
    "primary_color": "#4285F4",
    "secondary_color": "#34A853",
    "background_color": "#FFFFFF",
    "text_color": "#202124",
    "support_email": "string",
    "custom_domain": "string | null"
  }
}
```

---

### PUT /api/v1/saas-admin/branding

Update branding configuration.

**Request Body**: Any subset of branding fields (JSON)

**Response** `200`: Updated branding object

---

### POST /api/v1/saas-admin/branding/logo

Upload logo image.

**Content-Type**: `multipart/form-data`

**Form Fields**:
| Field | Type | Constraints |
|-------|------|-------------|
| logo | file | PNG/SVG, max 2MB |

**Response** `200`:
```json
{
  "success": true,
  "data": { "logo_url": "https://..." }
}
```

---

## 4.4 API Keys

### GET /api/v1/saas-admin/api-keys

List all API keys.

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "key_prefix": "sk_live_ab",
      "status": "active | revoked | expired",
      "expires_at": "ISO8601 | null",
      "last_used_at": "ISO8601 | null",
      "created_at": "ISO8601"
    }
  ]
}
```

---

### POST /api/v1/saas-admin/api-keys

Create a new API key.

**Request Body**:
```json
{
  "name": "string",
  "expires_in_days": 90
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "key": "sk_live_abcdef...",
    "key_prefix": "sk_live_ab",
    "expires_at": "ISO8601"
  }
}
```

**IMPORTANT**: `key` is returned only once. It cannot be retrieved again.

---

### DELETE /api/v1/saas-admin/api-keys/:id

Revoke an API key immediately.

**Response** `204`

---

## 4.5 Webhooks

### GET /api/v1/saas-admin/webhooks

List all webhook configurations.

**Response** `200`: Array of webhook config objects

---

### POST /api/v1/saas-admin/webhooks

Create a new webhook.

**Request Body**:
```json
{
  "url": "https://yourapp.com/webhook",
  "events": ["tenant.created", "user.created", "mail.bounced"],
  "secret": "your_signing_secret"
}
```

**Response** `201`: Created webhook object

---

### PUT /api/v1/saas-admin/webhooks/:id

Update a webhook.

**Response** `200`: Updated webhook object

---

### POST /api/v1/saas-admin/webhooks/:id/test

Send a test event to the webhook endpoint.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "http_status": 200,
    "response_time_ms": 145,
    "delivered": true
  }
}
```

---

### DELETE /api/v1/saas-admin/webhooks/:id

Delete a webhook.

**Response** `204`

---

### GET /api/v1/saas-admin/webhooks/:id/deliveries

Get delivery log for a webhook.

**Query Parameters**: `page`, `per_page`, `status`, `from_date`, `to_date`

**Response** `200`: Paginated delivery log

---

### POST /api/v1/saas-admin/webhooks/deliveries/:id/retry

Retry a failed webhook delivery.

**Response** `200`: `{ "success": true }`

---

## 4.6 Analytics

### GET /api/v1/saas-admin/analytics/overview

Get usage overview for the SaaS application.

**Query Parameters**: `from_date`, `to_date`

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "active_users_today": 245,
    "new_users_this_month": 38,
    "emails_sent_this_month": 12500,
    "storage_used_gb": 45.2,
    "api_calls_this_month": 8900,
    "daily_active_users": [ { "date": "2024-01-01", "count": 210 } ]
  }
}
```

---

### GET /api/v1/saas-admin/analytics/tenants

Per-tenant usage breakdown.

**Response** `200`: Array of tenant usage objects

---

## 4.7 Billing

### GET /api/v1/saas-admin/billing/subscription

Get current subscription details.

**Response** `200`: Subscription object with plan details and usage

---

### GET /api/v1/saas-admin/billing/invoices

List all invoices.

**Response** `200`: Paginated invoice list

---

### GET /api/v1/saas-admin/billing/invoices/:id/download

Download invoice as PDF.

**Response**: PDF file

---

### POST /api/v1/saas-admin/billing/upgrade

Initiate a plan upgrade.

**Request Body**:
```json
{
  "plan": "professional | enterprise",
  "billing_cycle": "monthly | yearly"
}
```

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "checkout_url": "https://payment-gateway.com/checkout/..."
  }
}
```

---

## 4.8 SSO Configuration

### GET /api/v1/saas-admin/sso

Get SSO configuration.

**Response** `200`: SSO config object

---

### PUT /api/v1/saas-admin/sso

Update SSO configuration.

**Request Body**:
```json
{
  "provider": "saml | oauth2 | none",
  "idp_metadata_url": "string",
  "entity_id": "string"
}
```

**Response** `200`: Updated SSO config

---

### POST /api/v1/saas-admin/sso/test

Test SSO configuration.

**Response** `200`: `{ "success": true, "data": { "test_url": "https://..." } }`

---

---

# SECTION 5 — TENANT ADMIN API

**Base path**: `/api/v1/tenant-admin`
**Auth Required**: Tenant Admin JWT
**Rate Limit**: 100 requests/minute

---

## 5.1 Users

### GET /api/v1/tenant-admin/users

List all users in this tenant.

**Query Parameters**: `page`, `per_page`, `status`, `department_id`, `role`, `search`

**Response** `200`: Paginated user list

---

### POST /api/v1/tenant-admin/users

Create a new user.

**Request Body**:
```json
{
  "first_name": "string",
  "last_name": "string",
  "username": "string",
  "password": "string",
  "department_id": "uuid | null",
  "role": "user | manager",
  "storage_quota_gb": 5,
  "send_welcome_email": true
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "username@tenant.saas.ssgzone.in",
    "first_name": "string",
    "last_name": "string",
    "status": "active"
  }
}
```

**Error**: `409` if username already exists in this tenant
**Error**: `422` if user count would exceed tenant limit

---

### GET /api/v1/tenant-admin/users/:id

Get a single user with full details.

**Response** `200`: Full user object

---

### PUT /api/v1/tenant-admin/users/:id

Update user details.

**Request Body**: Any subset of user fields

**Response** `200`: Updated user object

---

### PATCH /api/v1/tenant-admin/users/:id/status

Activate or suspend a user.

**Request Body**:
```json
{
  "status": "active | suspended"
}
```

**Response** `200`: `{ "success": true }`

---

### POST /api/v1/tenant-admin/users/:id/reset-password

Send a password reset email to a user.

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/tenant-admin/users/:id/sessions

Revoke all active sessions for a user.

**Response** `204`

---

### DELETE /api/v1/tenant-admin/users/:id

Delete a user account.

**Response** `204`

---

### POST /api/v1/tenant-admin/users/bulk-import

Bulk import users from CSV.

**Content-Type**: `multipart/form-data`

**Form Fields**:
| Field | Type | Description |
|-------|------|-------------|
| file | CSV file | Max 1000 rows |
| send_welcome_email | boolean | Default true |

**Response** `202`:
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "processing",
    "total_rows": 150
  }
}
```

---

### GET /api/v1/tenant-admin/users/bulk-import/:job_id

Get bulk import job status.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "completed",
    "total_rows": 150,
    "created": 145,
    "skipped": 3,
    "failed": 2,
    "errors": [ { "row": 12, "reason": "Duplicate username" } ]
  }
}
```

---

## 5.2 Departments

### GET /api/v1/tenant-admin/departments

List all departments.

**Response** `200`: Array of department objects

---

### POST /api/v1/tenant-admin/departments

Create a department.

**Request Body**:
```json
{
  "name": "string",
  "description": "string | null",
  "manager_id": "uuid | null"
}
```

**Response** `201`: Created department object

---

### PUT /api/v1/tenant-admin/departments/:id

Update a department.

**Response** `200`: Updated department object

---

### DELETE /api/v1/tenant-admin/departments/:id

Delete a department. Users in this department are moved to "No Department".

**Response** `204`

---

## 5.3 Mail Settings

### GET /api/v1/tenant-admin/mail/settings

Get mail configuration for this tenant.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "primary_domain": "tenant.saas.ssgzone.in",
    "custom_domain": "string | null",
    "dns_verified": true,
    "dkim_status": "active | inactive",
    "dkim_selector": "string",
    "dkim_dns_record": "string"
  }
}
```

---

### POST /api/v1/tenant-admin/mail/dkim/regenerate

Regenerate DKIM key for this tenant.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "new_selector": "string",
    "dns_record": "string",
    "instructions": "Publish this TXT record in your DNS"
  }
}
```

---

### POST /api/v1/tenant-admin/mail/dns/verify

Trigger DNS verification for custom domain.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "checks": {
      "mx": true,
      "spf": true,
      "dkim": true,
      "dmarc": false
    }
  }
}
```

---

## 5.4 Retention Policies

### GET /api/v1/tenant-admin/retention

Get retention policy for this tenant.

**Response** `200`: Retention policy object

---

### PUT /api/v1/tenant-admin/retention

Update retention policy.

**Request Body**:
```json
{
  "email_retention_days": 365,
  "chat_retention_days": 90,
  "file_retention_days": null
}
```

**Response** `200`: Updated retention policy

---

## 5.5 Compliance / GDPR

### POST /api/v1/tenant-admin/gdpr/export

Request data export for a user.

**Request Body**:
```json
{
  "user_id": "uuid"
}
```

**Response** `202`:
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "estimated_ready_in_minutes": 15
  }
}
```

---

### POST /api/v1/tenant-admin/gdpr/delete

Submit a GDPR deletion request for a user.

**Request Body**:
```json
{
  "user_id": "uuid",
  "confirm": true
}
```

**Response** `202`:
```json
{
  "success": true,
  "data": {
    "request_id": "uuid",
    "scheduled_for": "ISO8601",
    "message": "Data will be permanently deleted on the scheduled date."
  }
}
```

---

## 5.6 Reports

### GET /api/v1/tenant-admin/reports/users

User activity report.

**Query Parameters**: `from_date`, `to_date`, `department_id`, `format=json|csv`

**Response** `200`: Report data or CSV download

---

### GET /api/v1/tenant-admin/reports/mail

Mail usage report.

**Query Parameters**: `from_date`, `to_date`, `user_id`, `format=json|csv`

**Response** `200`: Report data or CSV download

---

### GET /api/v1/tenant-admin/reports/storage

Storage usage report.

**Query Parameters**: `format=json|csv`

**Response** `200`: Per-user storage breakdown

---

*End of D4 Part 2 of 5*
*Next: API_PART_03.md — Mail API, Calendar API, Contacts API*
