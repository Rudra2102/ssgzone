# SSGzone Communication Platform
# DATABASE BLUEPRINT
# D3 — PART 4 OF 4
## Billing, Audit Tables + Index, Partition & Retention Strategy

---

# SECTION 12 — BILLING TABLES

---

## 12.1 billing_plans

Available subscription plans.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(100) | NOT NULL, UNIQUE | free/starter/professional/enterprise |
| display_name | VARCHAR(200) | NOT NULL | "Professional Plan" |
| price_monthly | DECIMAL(10,2) | NOT NULL | Monthly price in INR/USD |
| price_yearly | DECIMAL(10,2) | NOT NULL | Yearly price |
| currency | VARCHAR(10) | DEFAULT 'INR' | |
| max_tenants | INTEGER | NOT NULL | |
| max_users_per_tenant | INTEGER | NOT NULL | |
| storage_quota_gb | INTEGER | NOT NULL | |
| monthly_email_limit | INTEGER | NOT NULL | |
| monthly_api_calls | INTEGER | NOT NULL | |
| features | JSONB | DEFAULT '{}' | Feature flags |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 12.2 subscriptions

Active subscriptions per SaaS application.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications, UNIQUE | One subscription per app |
| plan_id | UUID | FK → billing_plans | |
| status | VARCHAR(50) | DEFAULT 'trialing' | trialing/active/past_due/cancelled |
| billing_cycle | VARCHAR(50) | DEFAULT 'monthly' | monthly/yearly |
| current_period_start | DATE | NOT NULL | |
| current_period_end | DATE | NOT NULL | |
| trial_ends_at | DATE | NULL | |
| cancelled_at | TIMESTAMPTZ | NULL | |
| payment_gateway | VARCHAR(100) | NULL | stripe/razorpay |
| gateway_subscription_id | VARCHAR(500) | NULL | External subscription ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_subscriptions_saas_app_id`, `idx_subscriptions_status`, `idx_subscriptions_current_period_end`

---

## 12.3 invoices

Billing invoices per subscription cycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications | |
| subscription_id | UUID | FK → subscriptions | |
| invoice_number | VARCHAR(100) | NOT NULL, UNIQUE | e.g., INV-2024-001 |
| status | VARCHAR(50) | DEFAULT 'draft' | draft/open/paid/void/uncollectible |
| amount | DECIMAL(10,2) | NOT NULL | |
| currency | VARCHAR(10) | NOT NULL | |
| period_start | DATE | NOT NULL | |
| period_end | DATE | NOT NULL | |
| due_date | DATE | NOT NULL | |
| paid_at | TIMESTAMPTZ | NULL | |
| payment_method | VARCHAR(100) | NULL | |
| gateway_invoice_id | VARCHAR(500) | NULL | |
| pdf_url | VARCHAR(500) | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_invoices_saas_app_id`, `idx_invoices_status`, `uq_invoices_number`

---

## 12.4 usage_records

Monthly usage tracking per SaaS application.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications | |
| period_month | DATE | NOT NULL | First day of month |
| tenant_count | INTEGER | DEFAULT 0 | |
| user_count | INTEGER | DEFAULT 0 | |
| storage_used_gb | DECIMAL(10,3) | DEFAULT 0 | |
| emails_sent | INTEGER | DEFAULT 0 | |
| api_calls | INTEGER | DEFAULT 0 | |
| video_minutes | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `uq_usage_records` (UNIQUE on saas_app_id + period_month)

---

# SECTION 13 — AUDIT & COMPLIANCE TABLES

---

## 13.1 audit_logs

Immutable audit trail of all admin actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | NULL | NULL for platform-level actions |
| tenant_id | UUID | NULL | NULL for SaaS-level actions |
| actor_id | UUID | NOT NULL | Who performed the action |
| actor_role | VARCHAR(100) | NOT NULL | platform_admin/saas_admin/tenant_admin/user |
| actor_email | VARCHAR(255) | NOT NULL | Denormalized — preserved if user deleted |
| action | VARCHAR(200) | NOT NULL | e.g., `user.created`, `tenant.suspended` |
| target_type | VARCHAR(100) | NULL | user/tenant/saas_app/email/etc. |
| target_id | UUID | NULL | ID of affected record |
| target_description | TEXT | NULL | Human-readable description |
| ip_address | INET | NULL | |
| user_agent | TEXT | NULL | |
| result | VARCHAR(50) | DEFAULT 'success' | success/failed |
| metadata | JSONB | DEFAULT '{}' | Additional context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**IMPORTANT**: This table has NO `updated_at` column and NO update triggers.
Audit logs are **write-once** — no UPDATE or DELETE is permitted.

**Enforcement**:
```sql
-- Revoke UPDATE and DELETE on audit_logs from application role
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
```

**Indexes**:
- `idx_audit_logs_tenant_id`
- `idx_audit_logs_saas_app_id`
- `idx_audit_logs_actor_id`
- `idx_audit_logs_action`
- `idx_audit_logs_created_at` (DESC)

**Partitioning**: Partition by `created_at` (monthly) — see Section 15

---

## 13.2 gdpr_deletion_requests

GDPR right-to-erasure requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| requested_by | UUID | FK → users | Tenant Admin who requested |
| target_user_id | UUID | NOT NULL | User to be deleted |
| target_email | VARCHAR(255) | NOT NULL | Preserved after deletion |
| status | VARCHAR(50) | DEFAULT 'pending' | pending/processing/completed/failed |
| requested_at | TIMESTAMPTZ | DEFAULT NOW() | |
| scheduled_for | TIMESTAMPTZ | NOT NULL | 30 days after request |
| completed_at | TIMESTAMPTZ | NULL | |
| error_message | TEXT | NULL | |
| modules_deleted | JSONB | DEFAULT '{}' | Which modules have been cleared |

**Indexes**: `idx_gdpr_requests_tenant_id`, `idx_gdpr_requests_status`, `idx_gdpr_requests_scheduled_for`

---

## 13.3 retention_policies

Data retention configuration per tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants, UNIQUE | One policy per tenant |
| email_retention_days | INTEGER | NULL | NULL = forever |
| chat_retention_days | INTEGER | NULL | |
| file_retention_days | INTEGER | NULL | |
| audit_log_retention_days | INTEGER | DEFAULT 365 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 13.4 support_tickets

Customer support tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications | |
| tenant_id | UUID | FK → tenants, NULL | NULL for SaaS-level tickets |
| submitted_by | UUID | FK → users | |
| subject | VARCHAR(500) | NOT NULL | |
| description | TEXT | NOT NULL | |
| priority | VARCHAR(50) | DEFAULT 'medium' | low/medium/high/critical |
| status | VARCHAR(50) | DEFAULT 'open' | open/in_progress/resolved/closed |
| assigned_to | UUID | NULL | Platform admin |
| resolved_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

# SECTION 14 — INDEX STRATEGY

---

## 14.1 Index Principles

| Principle | Rule |
|-----------|------|
| Every FK column must have an index | `tenant_id`, `user_id`, `saas_app_id` on every table |
| Every column used in WHERE clauses | Add index if query runs > 1000 times/day |
| Every column used in ORDER BY | Add index if result set > 1000 rows |
| Partial indexes for boolean filters | `WHERE is_deleted = FALSE`, `WHERE is_read = FALSE` |
| Composite indexes for common query patterns | `(tenant_id, created_at DESC)` for paginated lists |
| GIN indexes for JSONB columns | Only on JSONB columns that are searched |
| No index on low-cardinality columns alone | `status` alone is not worth indexing — use composite |

---

## 14.2 Critical Composite Indexes

These composite indexes are required for the most common query patterns:

| Table | Index Columns | Query Pattern |
|-------|--------------|---------------|
| email_messages | (tenant_id, folder_id, received_at DESC) | Inbox list |
| email_messages | (tenant_id, account_id, is_read) | Unread count |
| chat_messages | (channel_id, created_at DESC) | Channel message list |
| chat_messages | (tenant_id, sender_id, created_at DESC) | User message history |
| cal_events | (tenant_id, start_at, end_at) | Calendar range query |
| drive_items | (tenant_id, parent_id, type) | Folder contents |
| notifications | (user_id, is_read, created_at DESC) | Notification list |
| audit_logs | (tenant_id, created_at DESC) | Audit log list |
| user_sessions | (user_id, expires_at) | Session validation |

---

## 14.3 Full-Text Search Indexes

PostgreSQL full-text search is used as a fallback when Elasticsearch is unavailable:

| Table | Column | Index Type |
|-------|--------|------------|
| email_messages | subject + body_text | GIN tsvector |
| chat_messages | content | GIN tsvector |
| contacts | first_name + last_name + company | GIN tsvector |
| drive_items | name | GIN tsvector |

**Primary search**: Elasticsearch (Phase 3)
**Fallback search**: PostgreSQL tsvector (Phase 1)

---

# SECTION 15 — PARTITION STRATEGY

---

## 15.1 Tables to Partition

Large, time-series tables are partitioned by month using PostgreSQL declarative partitioning.

| Table | Partition Key | Partition Type | Reason |
|-------|--------------|----------------|--------|
| email_messages | received_at | RANGE (monthly) | Largest table — millions of rows |
| chat_messages | created_at | RANGE (monthly) | High write volume |
| audit_logs | created_at | RANGE (monthly) | Compliance — easy to archive old partitions |
| webhook_deliveries | created_at | RANGE (monthly) | High volume, short retention |

---

## 15.2 Partition Naming Convention

```
[table_name]_[YYYY]_[MM]

Examples:
  email_messages_2024_01
  email_messages_2024_02
  chat_messages_2024_01
  audit_logs_2024_01
```

---

## 15.3 Partition Management

| Task | Frequency | Method |
|------|-----------|--------|
| Create next month's partition | Monthly (1st of month) | Scheduled job |
| Attach new partition | Monthly | Automated |
| Detach old partitions (for archival) | Per retention policy | Scheduled job |
| Drop expired partitions | Per retention policy | After archival confirmed |

---

## 15.4 Partition Creation Template

```sql
-- Example: Create partition for email_messages for January 2025
CREATE TABLE email_messages_2025_01
    PARTITION OF email_messages
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

# SECTION 16 — RETENTION STRATEGY

---

## 16.1 Data Retention by Table

| Table | Default Retention | Configurable | Who Configures |
|-------|------------------|--------------|----------------|
| email_messages | Forever | Yes | Tenant Admin |
| chat_messages | Forever | Yes | Tenant Admin |
| drive_items (deleted) | 30 days in Trash | No | Fixed |
| drive_versions | 10 versions max | No | Fixed |
| notifications | 90 days | No | Fixed |
| audit_logs | 1 year | No (min 1 year) | Platform Admin |
| user_sessions | 7 days (TTL) | No | Fixed |
| token_blacklist | Token TTL | No | Fixed |
| email_queue | 7 days after sent | No | Fixed |
| webhook_deliveries | 90 days | No | Fixed |
| gdpr_deletion_requests | 3 years | No | Fixed (compliance) |

---

## 16.2 Retention Enforcement

| Method | Used For |
|--------|----------|
| Scheduled job (daily) | email_messages, chat_messages (per tenant policy) |
| Scheduled job (daily) | notifications older than 90 days |
| Scheduled job (daily) | expired user_sessions |
| Scheduled job (daily) | expired token_blacklist entries |
| Scheduled job (weekly) | webhook_deliveries older than 90 days |
| Partition drop | audit_logs older than retention period |
| MinIO lifecycle policy | drive_items in Trash older than 30 days |

---

## 16.3 GDPR Deletion Process

When a GDPR deletion request is processed:

```
1. Soft delete user account (is_deleted = TRUE)
2. Queue deletion job for 30 days later
3. On execution day:
   a. Delete all email_messages for this user
   b. Delete all email_attachments (MinIO objects)
   c. Delete all chat_messages sent by this user (replace content with "[deleted]")
   d. Delete all contacts owned by this user
   e. Delete all cal_events created by this user
   f. Delete all drive_items owned by this user (MinIO objects)
   g. Delete all notifications for this user
   h. Anonymize audit_log entries (replace email with "[deleted]")
   i. Hard delete user record
4. Mark gdpr_deletion_request as completed
5. Audit log entry created for the deletion
```

---

## 16.4 Database Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full backup | Daily | 30 days | Separate MinIO bucket or S3 |
| WAL archiving | Continuous | 7 days | Separate storage |
| Point-in-time recovery | Enabled | 7 days | WAL archive |
| Pre-migration snapshot | Before every migration | 90 days | Separate storage |

---

## D3 — DATABASE BLUEPRINT COMPLETE

| Part | File | Contents |
|------|------|----------|
| Part 1 | DATABASE_PART_01.md | Architecture, Naming Conventions, Auth & Platform Tables |
| Part 2 | DATABASE_PART_02.md | Mail, Calendar, Contacts Tables |
| Part 3 | DATABASE_PART_03.md | Chat, Video, Drive, Notifications Tables |
| Part 4 | DATABASE_PART_04.md | Billing, Audit Tables + Index, Partition & Retention Strategy |

**Total Tables Defined**: 47
**Total Indexes Defined**: 90+
**RLS Enabled On**: All tenant-scoped tables

*Next Document: D4 — API Blueprint*
