# D7 — SaaS Provisioning Engine | Part 01: Onboarding & Tenant Lifecycle

## 1. Overview

The SaaS Provisioning Engine automates the complete lifecycle of onboarding a new SaaS platform and its tenants onto SSGzone. It eliminates all manual steps from domain registration to first email delivery.

Scope:
- SaaS platform registration
- Tenant provisioning
- DNS automation
- Mailbox provisioning
- Credential issuance
- Suspension & offboarding

---

## 2. Entity Hierarchy

```
SSGzone (Super Admin)
  └── SaaS Platform (e.g. "Rupyo", "LMS")
        └── Tenant (e.g. "NABC", "ABC Developers")
              └── User (e.g. amit.shah@nabc.lms.ssgzone.in)
```

Each level has its own provisioning workflow and set of resources.

---

## 3. SaaS Platform Registration

### 3.1 Registration Flow

```
Super Admin or Self-Service:
  POST /api/v1/admin/platforms

Input:
{
  name: "Rupyo",
  slug: "rupyo",                    ← validated: lowercase, alphanumeric, 3-20 chars
  owner_email: "admin@rupyo.com",
  plan: "growth",
  max_tenants: 100,
  max_users_per_tenant: 500,
  features: ["mail", "calendar", "chat", "drive"]
}

Provisioning steps (synchronous, < 2s):
  1. Validate slug uniqueness
  2. Create: saas_platforms row
  3. Create: platform admin user account
  4. Generate: API key pair (client_id + client_secret)
  5. Create: default webhook endpoint placeholder
  6. Send: welcome email to owner_email

Response:
{
  platformId: uuid,
  slug: "rupyo",
  apiKey: { clientId, clientSecret },   ← shown ONCE, not stored in plaintext
  adminPortalUrl: "https://mail.ssgzone.in/saas"
}
```

### 3.2 API Key Management

```
Storage:
  - client_id: stored plaintext (used for lookup)
  - client_secret: stored as bcrypt hash (cost 12)
  - Shown to user only at creation time

Authentication:
  POST /api/v1/auth/token
  { grant_type: "client_credentials", client_id, client_secret }
  → Returns: JWT (exp: 1h) for SaaS Admin scope

Rotation:
  POST /api/v1/saas/api-keys/rotate
  → Invalidate old secret, generate new, return once
  → Grace period: 24h (old key still works during transition)
```

---

## 4. Tenant Provisioning

### 4.1 Provisioning Trigger

Tenants are provisioned via:
1. SaaS Admin Portal (manual)
2. SaaS Integration API (programmatic, most common)

```
POST /api/v1/saas/tenants
Authorization: Bearer {saas_jwt}

{
  name: "NABC",
  slug: "nabc",                     ← becomes subdomain segment
  admin_email: "admin@nabc.com",
  admin_name: "Rajesh Kumar",
  plan: "standard",
  max_users: 50,
  timezone: "Asia/Kolkata",
  locale: "en-IN"
}
```

### 4.2 Provisioning Pipeline

The provisioning pipeline is a sequential job executed by the Provisioning Worker.

```
Step 1: Validate
  - slug unique within platform
  - admin_email valid format
  - plan within platform's allowed plans
  - max_users within platform's max_users_per_tenant

Step 2: Create DB Records
  - INSERT tenants { id, platform_id, slug, name, plan, status='provisioning' }
  - INSERT tenant_settings (defaults)
  - INSERT tenant_branding (defaults)

Step 3: DNS Provisioning
  - Subdomain: nabc.lms.ssgzone.in
  - Create DNS records via DNS Manager API:
    MX  10  mx1.ssgzone.in
    MX  20  mx2.ssgzone.in
    TXT     v=spf1 include:spf.ssgzone.in ~all
    TXT     v=DKIM1; k=rsa; p={public_key}
    TXT     v=DMARC1; p=quarantine; rua=mailto:dmarc@ssgzone.in
  - Store: dns_records table
  - Status: dns_provisioning

Step 4: DKIM Key Generation
  - Generate RSA-2048 key pair
  - Store private key: encrypted (AES-256-GCM, key from KMS)
  - Publish public key to DNS (Step 3 above)
  - Store: dkim_keys table

Step 5: Mail Server Configuration
  - Add virtual domain to Postfix: nabc.lms.ssgzone.in
  - Add virtual mailbox domain to Dovecot
  - Reload Postfix/Dovecot config (via internal API)

Step 6: Create Admin User
  - Generate: admin@nabc.lms.ssgzone.in mailbox
  - Set temporary password (random 16-char)
  - Send welcome email to admin_email with:
    - Login URL
    - Temporary password
    - Setup guide link

Step 7: Finalize
  - UPDATE tenants SET status='active'
  - Publish webhook: tenant.provisioned
  - Log: audit_logs

Total time target: < 30 seconds
```

### 4.3 Provisioning Status Machine

```
States:
  pending       → queued, not started
  provisioning  → pipeline running
  active        → fully operational
  suspended     → access blocked, data retained
  deprovisioned → data deleted (after retention period)
  failed        → pipeline error (retryable)

Transitions:
  pending → provisioning  (worker picks up job)
  provisioning → active   (all steps complete)
  provisioning → failed   (any step fails after retries)
  active → suspended      (admin action or billing failure)
  suspended → active      (admin action or payment received)
  active → deprovisioned  (admin action, 30-day grace)
  suspended → deprovisioned (30 days after suspension)
  failed → pending        (admin retry)
```

---

## 5. User (Mailbox) Provisioning

### 5.1 Single User Provisioning

```
POST /api/v1/tenant/users
Authorization: Bearer {tenant_admin_jwt}

{
  email_prefix: "amit.shah",        ← becomes amit.shah@nabc.lms.ssgzone.in
  first_name: "Amit",
  last_name: "Shah",
  role: "user",
  department_id: uuid,
  send_welcome_email: true
}

Steps:
  1. Validate email_prefix (alphanumeric, dots, hyphens, max 64 chars)
  2. Check uniqueness within tenant
  3. Check tenant user quota (max_users)
  4. INSERT users row
  5. Create Dovecot mailbox (mkdir Maildir structure on storage)
  6. Set initial password (random or user-set)
  7. Send welcome email (if requested)
  8. Publish WS event: user.created to tenant room
  9. Log: audit_logs
```

### 5.2 Bulk User Provisioning

```
POST /api/v1/tenant/users/bulk
Content-Type: multipart/form-data
{ file: users.csv }

CSV format:
  email_prefix, first_name, last_name, role, department
  amit.shah, Amit, Shah, user, Engineering
  priya.verma, Priya, Verma, admin, HR

Processing:
  1. Parse CSV (max 500 rows per batch)
  2. Validate all rows → return validation errors before processing
  3. Queue bulk provisioning job
  4. Return: { jobId, total, valid, invalid, errors[] }

Job processing:
  - Process 10 users in parallel
  - Per-user: same as single provisioning
  - Progress updates via WS: bulk_provision.progress { jobId, done, total }
  - On complete: bulk_provision.complete { jobId, success, failed }
  - Failed rows: downloadable error report
```

### 5.3 User Quota Enforcement

```
On each user creation:
  1. SELECT COUNT(*) FROM users WHERE tenant_id = ? AND status != 'deleted'
  2. Compare to tenants.max_users
  3. If at limit: return 422 { error: "user_quota_exceeded", limit: N, current: N }

Quota change:
  - SaaS Admin can increase/decrease tenant quota
  - Decrease: only if current_users <= new_limit
```

---

## 6. DNS Manager

### 6.1 DNS Provider Integration

```
Supported providers (pluggable adapter pattern):
  - Cloudflare (primary)
  - AWS Route 53 (secondary)
  - Custom (via RFC 2136 Dynamic DNS)

Adapter interface:
  createRecord(zone, type, name, value, ttl)
  updateRecord(zone, recordId, value, ttl)
  deleteRecord(zone, recordId)
  listRecords(zone, name)
  verifyRecord(zone, type, name, expectedValue)
```

### 6.2 DNS Record Lifecycle

```
On tenant provision:
  createRecord(zone="ssgzone.in", type="MX", name="nabc.lms", value="mx1.ssgzone.in", ttl=300)
  createRecord(zone="ssgzone.in", type="MX", name="nabc.lms", value="mx2.ssgzone.in", ttl=300)
  createRecord(zone="ssgzone.in", type="TXT", name="nabc.lms", value="v=spf1...", ttl=300)
  createRecord(zone="ssgzone.in", type="TXT", name="s1._domainkey.nabc.lms", value="v=DKIM1...", ttl=300)
  createRecord(zone="ssgzone.in", type="TXT", name="_dmarc.nabc.lms", value="v=DMARC1...", ttl=300)

On tenant deprovision:
  deleteRecord for all above

On DKIM rotation:
  createRecord(new selector s2)
  wait 48h
  deleteRecord(old selector s1)
```

### 6.3 DNS Verification

```
After provisioning, verify DNS propagation:
  Cron: every 5 min for first 30 min after provisioning

  verifyRecord(type="MX", name="nabc.lms.ssgzone.in", expected="mx1.ssgzone.in")
  verifyRecord(type="TXT", name="nabc.lms.ssgzone.in", expected contains "v=spf1")
  verifyRecord(type="TXT", name="s1._domainkey.nabc.lms.ssgzone.in", expected contains "v=DKIM1")

  All verified → dns_records.verified_at = now()
  Not verified after 30 min → alert Super Admin
```

---

## 7. Webhook System

### 7.1 Webhook Events

SaaS platforms subscribe to events via registered webhook endpoints.

| Event | Trigger |
|-------|---------|
| `tenant.provisioned` | Tenant fully active |
| `tenant.suspended` | Tenant suspended |
| `tenant.deprovisioned` | Tenant deleted |
| `user.created` | New user provisioned |
| `user.deleted` | User deleted |
| `user.suspended` | User suspended |
| `mail.bounced` | Outbound mail bounced |
| `billing.invoice_due` | Invoice generated |
| `billing.payment_failed` | Payment failed |

### 7.2 Webhook Delivery

```
Delivery mechanism:
  1. Event occurs → INSERT webhook_deliveries { event, payload, status='pending' }
  2. Worker dequeues → POST to registered endpoint
     Headers:
       Content-Type: application/json
       X-SSGzone-Event: tenant.provisioned
       X-SSGzone-Signature: HMAC-SHA256(payload, webhook_secret)
       X-SSGzone-Delivery: uuid
  3. Expect: HTTP 200 within 10s
  4. On success: status='delivered'
  5. On failure: retry with backoff
     Attempt 1: immediate
     Attempt 2: +1 min
     Attempt 3: +10 min
     Attempt 4: +1 hr
     Attempt 5: +24 hr → status='failed', alert SaaS Admin

Signature verification (SaaS side):
  const sig = crypto.createHmac('sha256', webhookSecret)
                    .update(rawBody).digest('hex');
  if (sig !== req.headers['x-ssgzone-signature']) reject();
```

---

## 8. Suspension & Offboarding

### 8.1 Tenant Suspension

```
Trigger: Admin action or billing failure

Steps:
  1. UPDATE tenants SET status='suspended', suspended_at=now()
  2. Revoke all active sessions for tenant users (Redis session blacklist)
  3. Block SMTP inbound: Postfix rejects with "550 Account suspended"
  4. Block SMTP outbound: reject at queue level
  5. Block API access: middleware returns 403 { error: "tenant_suspended" }
  6. Retain: all data (mail, files, contacts)
  7. Notify: tenant admin email
  8. Publish webhook: tenant.suspended

Reactivation:
  1. UPDATE tenants SET status='active', suspended_at=null
  2. Remove session blacklist entries
  3. Re-enable SMTP
  4. Notify: tenant admin email
  5. Publish webhook: tenant.reactivated
```

### 8.2 Tenant Deprovisioning

```
Trigger: Admin action (30-day grace after suspension)

Grace period (30 days):
  - Data retained, access blocked
  - Daily reminder emails to tenant admin
  - Self-service reactivation available

After grace period or immediate delete request:
  Step 1: Export (optional)
    - Generate data export: mail (mbox), contacts (vCard), calendar (iCal)
    - Upload to S3, send download link to tenant admin
    - Link expires: 7 days

  Step 2: Delete Data
    - DELETE all users (cascade: sessions, tokens)
    - DELETE all mail messages + attachments (S3 objects)
    - DELETE all calendar events, contacts, chat messages
    - DELETE all drive files (S3 objects)
    - DELETE DNS records
    - DELETE DKIM keys
    - UPDATE tenants SET status='deprovisioned'

  Step 3: Audit
    - Retain: audit_logs for 7 years (compliance)
    - Retain: billing records for 7 years
    - All other data: purged

  Total deletion time target: < 5 minutes for tenants with < 10,000 users
```

---

*Part 01 of 02 — Next: Billing Integration, Plan Management & Provisioning API Reference*
