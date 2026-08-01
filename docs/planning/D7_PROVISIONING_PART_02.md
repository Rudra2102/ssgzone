# D7 — SaaS Provisioning Engine | Part 02: Billing, Plans & API Reference

## 1. Plan & Quota System

### 1.1 Plan Tiers

#### SaaS Platform Plans (billed to SaaS companies)

| Feature | Starter | Growth | Enterprise |
|---------|---------|--------|------------|
| Max tenants | 10 | 100 | Unlimited |
| Max users/tenant | 50 | 500 | Custom |
| Storage/mailbox | 5 GB | 10 GB | Custom |
| Mail modules | Mail only | Mail + Cal + Chat | All modules |
| Video meetings | ❌ | ✅ (50 participants) | ✅ (100 participants) |
| Drive | ❌ | ✅ (10 GB/user) | ✅ (Custom) |
| API rate limit | 100 req/min | 1,000 req/min | Custom |
| Webhooks | 3 endpoints | 10 endpoints | Unlimited |
| SLA | 99.5% | 99.9% | 99.99% |
| Support | Email | Priority email | Dedicated |
| Price | ₹2,999/mo | ₹9,999/mo | Custom |

#### Tenant Plans (billed to tenants by SaaS, or by SSGzone directly)

| Feature | Basic | Standard | Professional |
|---------|-------|----------|--------------|
| Max users | 10 | 100 | 500 |
| Storage/mailbox | 2 GB | 10 GB | 25 GB |
| Mail retention | 1 year | 3 years | 7 years |
| Chat history | 30 days | 1 year | Unlimited |
| Video recording | ❌ | ✅ | ✅ |
| Custom branding | ❌ | ✅ | ✅ |
| GDPR tools | Basic | Full | Full + DPA |
| Price | ₹499/mo | ₹1,499/mo | ₹3,999/mo |

---

### 1.2 Plan Enforcement

```
Enforcement points:

1. User creation:
   IF users.count >= tenant.max_users → 422 quota_exceeded

2. Storage:
   On mail/file upload:
   IF tenant_storage_used + file_size > tenant.storage_quota → 422 storage_quota_exceeded

3. API rate limiting:
   Redis sliding window counter per platform API key
   Key: ratelimit:{clientId}:{minute}
   INCR + EXPIRE 60s
   IF count > plan.api_rate_limit → 429 rate_limit_exceeded

4. Feature gating:
   Middleware checks: platform.features includes requested module
   IF not included → 403 feature_not_available

5. Tenant count:
   On tenant creation:
   IF platform.tenants.count >= platform.max_tenants → 422 tenant_quota_exceeded
```

---

### 1.3 Plan Upgrade / Downgrade

```
Upgrade (immediate):
  1. Update plan in DB
  2. Recalculate quotas
  3. Publish webhook: platform.plan_changed / tenant.plan_changed
  4. Pro-rate billing for remainder of billing period

Downgrade (end of billing period):
  1. Schedule downgrade for next billing date
  2. Validate: current usage fits in new plan
     IF users > new_plan.max_users → block downgrade, show error
  3. On billing date: apply new plan
  4. Notify admin 7 days before downgrade takes effect
```

---

## 2. Billing Integration

### 2.1 Billing Architecture

```
SSGzone does not process payments directly.
Billing is handled via Razorpay (India-first) with Stripe as fallback.

Flow:
  SSGzone API ↔ Razorpay API
                    ↓
              Razorpay Webhooks → SSGzone /internal/billing/webhook
```

### 2.2 Subscription Lifecycle

```
New subscription:
  1. Admin selects plan in portal
  2. POST /api/v1/billing/subscriptions
  3. API Server → Razorpay: Create Subscription
     { plan_id, customer_id, quantity, start_at }
  4. Razorpay returns: subscription_id, payment_link
  5. Redirect admin to Razorpay payment page
  6. On payment success: Razorpay webhook → SSGzone
     Event: subscription.activated
  7. SSGzone: UPDATE billing_subscriptions SET status='active'
  8. Trigger: provisioning pipeline (if new platform/tenant)

Recurring billing:
  Razorpay handles auto-debit on billing date
  Webhook: invoice.paid → UPDATE billing_invoices SET status='paid'
  Webhook: invoice.payment_failed → trigger suspension flow

Cancellation:
  POST /api/v1/billing/subscriptions/:id/cancel
  → Razorpay: Cancel Subscription
  → Schedule: tenant deprovisioning at period end
  → Notify: admin email
```

### 2.3 Invoice Management

```
Invoice generation (Razorpay-driven):
  - Razorpay generates invoice on each billing cycle
  - Webhook: invoice.created → store in billing_invoices table
  - PDF: fetched from Razorpay, stored in S3
  - Accessible: GET /api/v1/billing/invoices/:id/pdf

Invoice line items:
  - Base plan fee
  - Overage charges (if applicable):
    - Extra users: ₹X per user above plan limit
    - Extra storage: ₹Y per GB above plan limit
    - Extra API calls: ₹Z per 1000 calls above limit

Overage calculation (cron, daily):
  1. Measure: current users, storage, API calls
  2. Compare to plan limits
  3. Calculate overage cost
  4. Store in billing_usage table
  5. Included in next invoice
```

### 2.4 Payment Failure Handling

```
Webhook: invoice.payment_failed

Attempt 1 (day 0):  Notify admin, retry in 3 days
Attempt 2 (day 3):  Notify admin, retry in 4 days
Attempt 3 (day 7):  Final notice, suspend in 24h
Day 8:              Suspend platform/tenant
Day 38 (30d after): Deprovision (if not resolved)

Notifications:
  - Email to billing contact on each attempt
  - In-app banner for platform/tenant admin
  - WS event: billing.payment_failed
```

---

## 3. Provisioning Worker

### 3.1 Worker Architecture

```
Provisioning jobs are processed by a dedicated worker process.

Queue: provisioning:jobs (BullMQ, Redis-backed)

Job types:
  - platform.provision
  - tenant.provision
  - tenant.suspend
  - tenant.reactivate
  - tenant.deprovision
  - user.provision
  - user.bulk_provision
  - dkim.rotate
  - dns.verify

Worker config:
  concurrency: 5 (5 jobs in parallel)
  lockDuration: 60000ms (60s per job)
  stalledInterval: 30000ms
```

### 3.2 Job Schema

```json
{
  "jobId": "uuid",
  "type": "tenant.provision",
  "payload": {
    "tenantId": "uuid",
    "platformId": "uuid",
    "slug": "nabc",
    "adminEmail": "admin@nabc.com"
  },
  "attempt": 1,
  "maxAttempts": 3,
  "createdAt": "ISO8601",
  "startedAt": "ISO8601"
}
```

### 3.3 Error Handling & Rollback

```
Each provisioning step is tracked in provisioning_logs table:
  { jobId, step, status, startedAt, completedAt, error }

On step failure:
  1. Log error
  2. Retry step up to 3 times (with 5s backoff)
  3. If still failing: mark job failed, trigger rollback

Rollback (reverse order):
  tenant.provision rollback:
    - Delete DNS records (if created)
    - Delete DKIM keys (if generated)
    - Delete admin user (if created)
    - UPDATE tenants SET status='failed'
    - Alert Super Admin
    - Notify SaaS Admin via webhook: tenant.provision_failed

Idempotency:
  Each step checks if already completed before executing.
  Safe to retry entire job after partial failure.
```

---

## 4. Provisioning API Reference

### 4.1 Platform Management

```
POST   /api/v1/admin/platforms                    Create platform
GET    /api/v1/admin/platforms                    List platforms
GET    /api/v1/admin/platforms/:id                Get platform
PATCH  /api/v1/admin/platforms/:id                Update platform
DELETE /api/v1/admin/platforms/:id                Deprovision platform

POST   /api/v1/admin/platforms/:id/suspend        Suspend platform
POST   /api/v1/admin/platforms/:id/reactivate     Reactivate platform
GET    /api/v1/admin/platforms/:id/stats          Usage stats
```

### 4.2 Tenant Management

```
POST   /api/v1/saas/tenants                       Provision tenant
GET    /api/v1/saas/tenants                       List tenants
GET    /api/v1/saas/tenants/:id                   Get tenant
PATCH  /api/v1/saas/tenants/:id                   Update tenant
DELETE /api/v1/saas/tenants/:id                   Deprovision tenant

POST   /api/v1/saas/tenants/:id/suspend           Suspend tenant
POST   /api/v1/saas/tenants/:id/reactivate        Reactivate tenant
GET    /api/v1/saas/tenants/:id/stats             Usage stats
POST   /api/v1/saas/tenants/:id/export            Request data export
GET    /api/v1/saas/tenants/:id/provision-status  Provisioning job status
```

### 4.3 User Management

```
POST   /api/v1/tenant/users                       Create user
POST   /api/v1/tenant/users/bulk                  Bulk create (CSV)
GET    /api/v1/tenant/users                       List users
GET    /api/v1/tenant/users/:id                   Get user
PATCH  /api/v1/tenant/users/:id                   Update user
DELETE /api/v1/tenant/users/:id                   Delete user

POST   /api/v1/tenant/users/:id/suspend           Suspend user
POST   /api/v1/tenant/users/:id/reactivate        Reactivate user
POST   /api/v1/tenant/users/:id/reset-password    Send reset email
GET    /api/v1/tenant/users/bulk/:jobId           Bulk job status
```

### 4.4 DNS Management

```
GET    /api/v1/admin/dns/records                  List all DNS records
GET    /api/v1/admin/dns/records/:tenantId        Tenant DNS records
POST   /api/v1/admin/dns/verify/:tenantId         Trigger DNS verification
GET    /api/v1/admin/dns/health                   DNS provider health
```

### 4.5 Billing

```
GET    /api/v1/billing/plans                      List available plans
GET    /api/v1/billing/subscriptions              Current subscription
POST   /api/v1/billing/subscriptions              Create subscription
PATCH  /api/v1/billing/subscriptions/:id          Change plan
DELETE /api/v1/billing/subscriptions/:id/cancel   Cancel subscription

GET    /api/v1/billing/invoices                   List invoices
GET    /api/v1/billing/invoices/:id               Get invoice
GET    /api/v1/billing/invoices/:id/pdf           Download PDF
GET    /api/v1/billing/usage                      Current usage & overages
```

### 4.6 Webhooks

```
GET    /api/v1/saas/webhooks                      List webhook endpoints
POST   /api/v1/saas/webhooks                      Register endpoint
PATCH  /api/v1/saas/webhooks/:id                  Update endpoint
DELETE /api/v1/saas/webhooks/:id                  Delete endpoint
POST   /api/v1/saas/webhooks/:id/test             Send test event
GET    /api/v1/saas/webhooks/:id/deliveries       Delivery history
POST   /api/v1/saas/webhooks/deliveries/:id/retry Retry failed delivery
```

---

## 5. Integration Guide (for SaaS developers)

### 5.1 Quick Integration Checklist

```
1. Register platform → receive client_id + client_secret
2. Authenticate → POST /auth/token → receive JWT
3. Provision first tenant → POST /saas/tenants
4. Poll provision status → GET /saas/tenants/:id/provision-status
5. Provision users → POST /tenant/users (with tenant JWT)
6. Register webhook → POST /saas/webhooks
7. Test webhook → POST /saas/webhooks/:id/test
8. Go live
```

### 5.2 Tenant JWT (for tenant-scoped API calls)

```
SaaS platform can obtain a tenant-scoped JWT to make API calls on behalf of a tenant:

POST /api/v1/auth/token
{
  grant_type: "urn:ssgzone:tenant_impersonation",
  client_id: "...",
  client_secret: "...",
  tenant_id: "uuid"
}

Response: JWT with scope=tenant:{tenantId}
Use for: provisioning users, reading tenant stats, etc.
```

### 5.3 Embed Webmail (iframe)

```html
<!-- Webmail embed for SaaS apps -->
<iframe
  src="https://mail.ssgzone.in/embed?token={embed_token}"
  width="100%"
  height="700px"
  frameborder="0"
  allow="camera; microphone"
/>
```

Embed token generation:
```
POST /api/v1/saas/embed-token
{ userId: uuid, tenantId: uuid, expiresIn: 3600 }
→ { embedToken: "short-lived JWT" }
```

Embed token is a short-lived JWT (1h) that auto-authenticates the user in the iframe without requiring them to log in again.

---

## 6. Provisioning SLA

| Operation | Target Time | Max Time |
|-----------|-------------|----------|
| Platform registration | < 2s | 10s |
| Tenant provisioning | < 30s | 2 min |
| User provisioning (single) | < 3s | 15s |
| Bulk user provisioning (100 users) | < 2 min | 10 min |
| Tenant suspension | < 5s | 30s |
| Tenant reactivation | < 5s | 30s |
| Tenant deprovisioning | < 5 min | 30 min |
| DNS propagation | < 5 min | 30 min |
| DKIM rotation | < 48h (DNS TTL) | 72h |

---

*Part 02 of 02 — D7 SaaS Provisioning Engine Complete*
