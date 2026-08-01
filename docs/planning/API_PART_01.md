# SSGzone Communication Platform
# API BLUEPRINT
# D4 — PART 1 OF 5
## API Standards, Authentication API & Super Admin API

---

**Document Version**: 1.0
**Classification**: Internal — Engineering
**Purpose**: This is the frozen API contract. All endpoints defined here must be implemented exactly as specified. No endpoint should be added, removed, or renamed without updating this document first.

---

# SECTION 1 — API STANDARDS & CONVENTIONS

---

## 1.1 Base URL Structure

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.ssgzone.in` |
| Staging | `https://api-staging.ssgzone.in` |
| Development | `http://localhost:4000` |

All endpoints are prefixed with `/api/v1`

Full example: `https://api.ssgzone.in/api/v1/auth/login`

---

## 1.2 Authentication

All endpoints (except public auth endpoints) require a JWT Bearer token:

```
Authorization: Bearer <access_token>
```

Integration endpoints use API Key authentication:

```
X-API-Key: <api_key>
```

---

## 1.3 Standard Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes (POST/PUT/PATCH) | `application/json` |
| Authorization | Yes (most endpoints) | `Bearer <token>` |
| X-API-Key | Yes (integration endpoints) | API key |
| X-Request-ID | No | Client-generated request ID for tracing |

---

## 1.4 Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [ ]
  }
}
```

---

## 1.5 HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource (email, slug) |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## 1.6 Pagination

All list endpoints support pagination:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| per_page | integer | 20 | Items per page (max 100) |
| sort | string | created_at | Sort field |
| order | string | desc | asc or desc |

---

## 1.7 Filtering

List endpoints support filtering via query parameters:

```
GET /api/v1/users?status=active&department_id=uuid&search=john
```

---

## 1.8 Rate Limiting

| Endpoint Group | Limit |
|----------------|-------|
| Auth endpoints | 10 requests/minute per IP |
| User endpoints | 300 requests/minute per token |
| Admin endpoints | 100 requests/minute per token |
| Integration endpoints | 1000 requests/minute per API key |
| Search endpoints | 60 requests/minute per token |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 245
X-RateLimit-Reset: 1704067200
```

---

## 1.9 Error Codes Reference

| Code | Meaning |
|------|---------|
| AUTH_INVALID_CREDENTIALS | Wrong email or password |
| AUTH_ACCOUNT_LOCKED | Too many failed attempts |
| AUTH_TOKEN_EXPIRED | JWT access token expired |
| AUTH_TOKEN_INVALID | Malformed or tampered token |
| AUTH_TOKEN_BLACKLISTED | Token was invalidated on logout |
| AUTH_2FA_REQUIRED | 2FA code required |
| AUTH_2FA_INVALID | Wrong TOTP code |
| VALIDATION_ERROR | Request body failed validation |
| NOT_FOUND | Resource not found |
| CONFLICT | Duplicate resource |
| FORBIDDEN | Insufficient permissions |
| QUOTA_EXCEEDED | Storage or user quota exceeded |
| RATE_LIMITED | Too many requests |

---

# SECTION 2 — AUTHENTICATION API

**Base path**: `/api/v1/auth`

---

## 2.1 POST /api/v1/auth/login

Login for all user roles (End User, Tenant Admin, SaaS Admin, Platform Admin).

**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@tenant.saas.ssgzone.in",
  "password": "string",
  "totp_code": "123456"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| email | Yes | User's email address |
| password | Yes | User's password |
| totp_code | Conditional | Required if 2FA is enabled |

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "role": "user | tenant_admin | saas_admin | platform_admin",
      "tenant_id": "uuid | null",
      "saas_app_id": "uuid | null"
    }
  }
}
```

**Error Responses**:
- `401` — AUTH_INVALID_CREDENTIALS
- `401` — AUTH_ACCOUNT_LOCKED (includes `locked_until` in error details)
- `401` — AUTH_2FA_REQUIRED (when 2FA enabled but code not provided)
- `401` — AUTH_2FA_INVALID

---

## 2.2 POST /api/v1/auth/refresh

Exchange a refresh token for a new access token.

**Auth Required**: No

**Request Body**:
```json
{
  "refresh_token": "eyJ..."
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "expires_in": 900
  }
}
```

**Error Responses**:
- `401` — AUTH_TOKEN_INVALID
- `401` — AUTH_TOKEN_EXPIRED

---

## 2.3 POST /api/v1/auth/logout

Invalidate the current session.

**Auth Required**: Yes

**Request Body**: None

**Success Response** `204`: No content

**Behavior**: Adds access token JTI to Redis blacklist. Deletes refresh token from DB.

---

## 2.4 POST /api/v1/auth/forgot-password

Request a password reset email.

**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@tenant.saas.ssgzone.in"
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "message": "If this email exists, a reset link has been sent."
  }
}
```

**Note**: Always returns 200 regardless of whether email exists (prevents enumeration).

---

## 2.5 POST /api/v1/auth/reset-password

Reset password using a reset token.

**Auth Required**: No

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "new_password": "string"
}
```

**Success Response** `200`: `{ "success": true }`

**Error Responses**:
- `400` — Token expired or invalid
- `400` — Password does not meet complexity requirements

---

## 2.6 POST /api/v1/auth/2fa/setup

Generate a TOTP secret and QR code for 2FA setup.

**Auth Required**: Yes

**Request Body**: None

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "secret": "BASE32SECRET",
    "qr_code_url": "data:image/png;base64,...",
    "backup_codes": ["code1", "code2", "...10 codes"]
  }
}
```

---

## 2.7 POST /api/v1/auth/2fa/verify

Confirm 2FA setup by verifying the first TOTP code.

**Auth Required**: Yes

**Request Body**:
```json
{
  "totp_code": "123456"
}
```

**Success Response** `200`: `{ "success": true, "data": { "enabled": true } }`

---

## 2.8 DELETE /api/v1/auth/2fa

Disable 2FA on the current user's account.

**Auth Required**: Yes

**Request Body**:
```json
{
  "password": "current_password",
  "totp_code": "123456"
}
```

**Success Response** `200`: `{ "success": true }`

---

# SECTION 3 — SUPER ADMIN API

**Base path**: `/api/v1/super-admin`
**Auth Required**: Platform Admin JWT
**Rate Limit**: 100 requests/minute

---

## 3.1 SaaS Applications

### GET /api/v1/super-admin/saas-apps

List all SaaS applications.

**Query Parameters**: `page`, `per_page`, `status`, `plan`, `search`

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "plan": "string",
      "status": "string",
      "tenant_count": 0,
      "user_count": 0,
      "storage_used_gb": 0,
      "created_at": "ISO8601"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 50 }
}
```

---

### POST /api/v1/super-admin/saas-apps

Create a new SaaS application.

**Request Body**:
```json
{
  "name": "string",
  "slug": "string",
  "admin_email": "string",
  "admin_first_name": "string",
  "admin_last_name": "string",
  "admin_password": "string",
  "plan": "free | starter | professional | enterprise",
  "max_tenants": 10,
  "max_users_per_tenant": 100,
  "storage_quota_gb": 50,
  "custom_domain": "string | null"
}
```

**Response** `201`: Created SaaS app object

**Error**: `409` if slug already exists

---

### GET /api/v1/super-admin/saas-apps/:id

Get a single SaaS application by ID.

**Response** `200`: Full SaaS app object with stats

---

### PUT /api/v1/super-admin/saas-apps/:id

Update a SaaS application.

**Request Body**: Any subset of creation fields (except slug)

**Response** `200`: Updated SaaS app object

---

### PATCH /api/v1/super-admin/saas-apps/:id/status

Suspend or reactivate a SaaS application.

**Request Body**:
```json
{
  "status": "active | suspended",
  "reason": "string"
}
```

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/super-admin/saas-apps/:id

Soft delete a SaaS application.

**Response** `204`

---

## 3.2 Platform Users

### GET /api/v1/super-admin/users

List all users across all tenants.

**Query Parameters**: `page`, `per_page`, `status`, `tenant_id`, `saas_app_id`, `search`

**Response** `200`: Paginated user list

---

### POST /api/v1/super-admin/users/:id/impersonate

Impersonate a user (creates a temporary session).

**Request Body**: None

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "impersonation_token": "eyJ...",
    "expires_in": 3600,
    "audit_log_id": "uuid"
  }
}
```

**Behavior**: Creates audit log entry. Token expires in 1 hour.

---

### DELETE /api/v1/super-admin/users/:id/sessions

Revoke all sessions for a user.

**Response** `204`

---

## 3.3 Platform Audit Logs

### GET /api/v1/super-admin/audit-logs

**Query Parameters**: `page`, `per_page`, `actor_id`, `action`, `tenant_id`, `saas_app_id`, `from_date`, `to_date`

**Response** `200`: Paginated audit log entries

---

### GET /api/v1/super-admin/audit-logs/export

Export audit logs as CSV.

**Query Parameters**: Same as list + `format=csv`

**Response**: CSV file download

---

## 3.4 Mail System

### GET /api/v1/super-admin/mail/health

Get mail system health metrics.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "delivery_rate_24h": 99.2,
    "bounce_rate_24h": 0.5,
    "spam_rate_24h": 0.3,
    "queue_depth": 12,
    "avg_delivery_seconds": 4.2,
    "dkim_pass_rate": 100.0,
    "dmarc_pass_rate": 99.8
  }
}
```

---

### GET /api/v1/super-admin/mail/queue

List emails currently in the send queue.

**Query Parameters**: `page`, `per_page`, `status`

**Response** `200`: Paginated queue entries

---

### POST /api/v1/super-admin/mail/queue/:id/retry

Force retry a queued email.

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/super-admin/mail/queue/:id

Remove an email from the queue.

**Response** `204`

---

## 3.5 System Health

### GET /api/v1/super-admin/system/health

Get health status of all services.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "services": {
      "api_gateway": "online",
      "mail_smtp": "online",
      "mail_imap": "online",
      "calendar_service": "online",
      "postgresql": "online",
      "redis": "online",
      "minio": "online",
      "elasticsearch": "degraded"
    },
    "overall": "degraded"
  }
}
```

---

### GET /api/v1/super-admin/system/stats

Get platform-wide statistics.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "total_saas_apps": 25,
    "total_tenants": 180,
    "total_users": 4500,
    "total_storage_gb": 1240.5,
    "emails_sent_today": 85000,
    "active_websocket_connections": 320,
    "active_video_rooms": 8
  }
}
```

---

*End of D4 Part 1 of 5*
*Next: API_PART_02.md — SaaS Admin API & Tenant Admin API*
