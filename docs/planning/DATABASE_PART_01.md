# SSGzone Communication Platform
# DATABASE BLUEPRINT
# D3 — PART 1 OF 4
## Architecture, Naming Conventions & Auth / Organization Tables

---

**Document Version**: 1.0
**Classification**: Internal — Engineering
**Purpose**: Complete database design blueprint. This is the authoritative reference for all schema decisions. No new table should be created without following this document.

---

# SECTION 1 — DATABASE ARCHITECTURE

---

## 1.1 Database Engine

| Property | Decision |
|----------|----------|
| Engine | PostgreSQL 15+ |
| Character Set | UTF8 |
| Collation | en_US.UTF-8 |
| Timezone | UTC (all timestamps stored in UTC) |
| Connection Pooling | PgBouncer in transaction mode |
| Replication | Primary + 1 Read Replica (Phase 3) |

---

## 1.2 Multi-Tenancy Strategy

```
Platform Level
    └── saas_applications         (one per SaaS customer)
            └── tenants           (one per organization)
                    └── users     (one per employee)
                            └── all other data (mail, chat, calendar, etc.)
```

Every table that contains tenant-specific data **must** have a `tenant_id` column.

Every table that contains user-specific data **must** have a `user_id` column.

Row-Level Security (RLS) is enabled on all tenant-scoped tables.

---

## 1.3 Primary Key Strategy

**Decision**: All tables use UUID v4 as primary key.

**Reason**: Mixed SERIAL/UUID in current codebase causes `::text` casts that prevent index usage. This blueprint standardizes on UUID everywhere.

```sql
-- Standard PK definition for all tables
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**Migration Note**: Existing SERIAL PKs must be migrated to UUID in Phase 1.

---

## 1.4 Standard Columns (Every Table)

Every table in the system must include these columns:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMPTZ | Record creation time (UTC) |
| updated_at | TIMESTAMPTZ | Last update time (UTC, auto-updated by trigger) |

Tables with soft delete must also include:

| Column | Type | Description |
|--------|------|-------------|
| deleted_at | TIMESTAMPTZ | NULL = active, timestamp = soft deleted |
| is_deleted | BOOLEAN | Default FALSE — for query performance |

---

## 1.5 Row-Level Security Policy Pattern

Every tenant-scoped table follows this RLS pattern:

```sql
-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own tenant's data
CREATE POLICY tenant_isolation ON [table_name]
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

The application sets `app.current_tenant_id` at the start of every database session.

---

## 1.6 Trigger Pattern for updated_at

All tables use a shared trigger function:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to every table:
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON [table_name]
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

# SECTION 2 — NAMING CONVENTIONS

---

## 2.1 Table Names

| Rule | Example |
|------|---------|
| Lowercase, snake_case | `email_messages` |
| Plural nouns | `users`, `tenants`, `email_folders` |
| No abbreviations | `email_messages` not `em` |
| Module prefix for clarity | `chat_messages`, `cal_events`, `drive_files` |

## 2.2 Column Names

| Rule | Example |
|------|---------|
| Lowercase, snake_case | `first_name`, `created_at` |
| Foreign keys: `[table_singular]_id` | `tenant_id`, `user_id`, `saas_app_id` |
| Boolean columns: `is_` or `has_` prefix | `is_active`, `is_deleted`, `has_attachment` |
| Timestamp columns: `_at` suffix | `created_at`, `sent_at`, `deleted_at` |
| Count columns: `_count` suffix | `message_count`, `attachment_count` |

## 2.3 Index Names

| Pattern | Example |
|---------|---------|
| `idx_[table]_[column(s)]` | `idx_users_tenant_id` |
| `idx_[table]_[column]_[column]` | `idx_email_messages_tenant_id_folder_id` |
| Unique: `uq_[table]_[column]` | `uq_users_email` |

## 2.4 Constraint Names

| Pattern | Example |
|---------|---------|
| FK: `fk_[table]_[ref_table]` | `fk_users_tenants` |
| Check: `chk_[table]_[rule]` | `chk_users_email_format` |

---

# SECTION 3 — ENTITY RELATIONSHIP OVERVIEW

---

```
saas_applications
    │
    ├── saas_admin_users          (admins of the SaaS app)
    │
    └── tenants
            │
            ├── tenant_admin_users    (admins of the tenant)
            │
            ├── users                 (end users / employees)
            │   ├── user_sessions
            │   ├── user_2fa
            │   └── user_preferences
            │
            ├── departments
            │   └── department_members
            │
            ├── roles
            │   └── user_roles
            │
            ├── permissions
            │
            ├── [mail tables]         → Part 2
            ├── [calendar tables]     → Part 2
            ├── [contacts tables]     → Part 2
            ├── [chat tables]         → Part 3
            ├── [video tables]        → Part 3
            ├── [drive tables]        → Part 3
            ├── [notification tables] → Part 3
            └── [billing tables]      → Part 4
```

---

# SECTION 4 — AUTHENTICATION & PLATFORM TABLES

---

## 4.1 platform_admins

Super Admin accounts. Managed by SSGzone internally.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| totp_secret | VARCHAR(255) | NULL | 2FA secret |
| totp_enabled | BOOLEAN | DEFAULT FALSE | |
| last_login_at | TIMESTAMPTZ | NULL | |
| failed_login_count | INTEGER | DEFAULT 0 | |
| locked_until | TIMESTAMPTZ | NULL | Account lockout |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `uq_platform_admins_email`

---

## 4.2 saas_applications

One record per SaaS customer registered on the platform.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | Display name |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL slug (e.g., `lms`) |
| plan | VARCHAR(50) | NOT NULL | free/starter/professional/enterprise |
| status | VARCHAR(50) | DEFAULT 'active' | active/suspended/deleted |
| max_tenants | INTEGER | NOT NULL | Plan limit |
| max_users_per_tenant | INTEGER | NOT NULL | Plan limit |
| storage_quota_gb | INTEGER | NOT NULL | Plan limit |
| monthly_email_limit | INTEGER | NOT NULL | Plan limit |
| custom_domain | VARCHAR(255) | NULL | e.g., `mail.company.com` |
| branding | JSONB | DEFAULT '{}' | Logo URL, colors, app name |
| permissions | JSONB | DEFAULT '{}' | Feature flags per plan |
| api_secret | VARCHAR(255) | NOT NULL | Hashed API secret |
| webhook_secret | VARCHAR(255) | NULL | HMAC signing secret |
| deleted_at | TIMESTAMPTZ | NULL | |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `uq_saas_applications_slug`, `idx_saas_applications_status`

---

## 4.3 saas_admin_users

Admin accounts for each SaaS application.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications | |
| email | VARCHAR(255) | NOT NULL, UNIQUE | |
| password_hash | VARCHAR(255) | NOT NULL | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| totp_secret | VARCHAR(255) | NULL | |
| totp_enabled | BOOLEAN | DEFAULT FALSE | |
| last_login_at | TIMESTAMPTZ | NULL | |
| failed_login_count | INTEGER | DEFAULT 0 | |
| locked_until | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `uq_saas_admin_users_email`, `idx_saas_admin_users_saas_app_id`

---

## 4.4 tenants

One record per organization (customer of a SaaS application).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications | |
| name | VARCHAR(255) | NOT NULL | Organization name |
| slug | VARCHAR(100) | NOT NULL | Unique within saas_app |
| custom_domain | VARCHAR(255) | NULL | |
| dns_verified | BOOLEAN | DEFAULT FALSE | |
| status | VARCHAR(50) | DEFAULT 'active' | active/suspended/deleted |
| max_users | INTEGER | NOT NULL | |
| storage_quota_gb | INTEGER | NOT NULL | |
| monthly_email_limit | INTEGER | NOT NULL | |
| branding | JSONB | DEFAULT '{}' | Override SaaS branding |
| settings | JSONB | DEFAULT '{}' | Tenant-level settings |
| deleted_at | TIMESTAMPTZ | NULL | |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_tenants_saas_app_id`
- `uq_tenants_slug_saas_app` (UNIQUE on slug + saas_app_id)
- `idx_tenants_status`

**RLS**: Enabled — `saas_app_id = current_setting('app.current_saas_app_id')`

---

## 4.5 users

End users (employees) within a tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| saas_app_id | UUID | FK → saas_applications | Denormalized for query performance |
| username | VARCHAR(100) | NOT NULL | Unique within tenant |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Full email address |
| password_hash | VARCHAR(255) | NOT NULL | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| display_name | VARCHAR(200) | GENERATED | first_name + ' ' + last_name |
| job_title | VARCHAR(200) | NULL | |
| department_id | UUID | FK → departments, NULL | |
| avatar_url | VARCHAR(500) | NULL | |
| bio | TEXT | NULL | |
| phone | VARCHAR(50) | NULL | |
| show_phone | BOOLEAN | DEFAULT FALSE | Directory visibility |
| status | VARCHAR(50) | DEFAULT 'active' | active/inactive/suspended |
| totp_secret | VARCHAR(255) | NULL | |
| totp_enabled | BOOLEAN | DEFAULT FALSE | |
| totp_backup_codes | JSONB | DEFAULT '[]' | Hashed backup codes |
| storage_quota_gb | INTEGER | NOT NULL | |
| storage_used_bytes | BIGINT | DEFAULT 0 | |
| last_login_at | TIMESTAMPTZ | NULL | |
| failed_login_count | INTEGER | DEFAULT 0 | |
| locked_until | TIMESTAMPTZ | NULL | |
| deleted_at | TIMESTAMPTZ | NULL | |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `uq_users_email`
- `uq_users_username_tenant` (UNIQUE on username + tenant_id)
- `idx_users_tenant_id`
- `idx_users_department_id`
- `idx_users_status`

**RLS**: Enabled — `tenant_id = current_setting('app.current_tenant_id')`

---

## 4.6 user_sessions

Active JWT refresh token sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| refresh_token_hash | VARCHAR(255) | NOT NULL, UNIQUE | bcrypt hash of refresh token |
| ip_address | INET | NOT NULL | |
| user_agent | TEXT | NULL | |
| expires_at | TIMESTAMPTZ | NOT NULL | 7 days from creation |
| last_used_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_user_sessions_user_id`
- `idx_user_sessions_expires_at` (for cleanup job)
- `uq_user_sessions_refresh_token_hash`

**Note**: Expired sessions are cleaned up by a scheduled job daily.

---

## 4.7 token_blacklist

Invalidated JWT access tokens (on logout).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| token_jti | VARCHAR(255) | NOT NULL, UNIQUE | JWT ID claim |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiry — for cleanup |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Note**: This table is a fallback. Primary blacklist check is Redis. DB is for persistence across Redis restarts.

**Indexes**: `uq_token_blacklist_jti`, `idx_token_blacklist_expires_at`

---

## 4.8 departments

Organizational departments within a tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(200) | NOT NULL | |
| description | TEXT | NULL | |
| manager_id | UUID | FK → users, NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_departments_tenant_id`, `uq_departments_name_tenant` (UNIQUE on name + tenant_id)

**RLS**: Enabled

---

## 4.9 roles

Custom roles within a tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(100) | NOT NULL | e.g., `manager`, `user` |
| is_system | BOOLEAN | DEFAULT FALSE | System roles cannot be deleted |
| permissions | JSONB | DEFAULT '{}' | Permission flags |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_roles_tenant_id`, `uq_roles_name_tenant`

---

## 4.10 user_roles

Many-to-many: users ↔ roles.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| role_id | UUID | FK → roles |
| tenant_id | UUID | FK → tenants |
| assigned_at | TIMESTAMPTZ | DEFAULT NOW() |
| assigned_by | UUID | FK → users |

**Indexes**: `idx_user_roles_user_id`, `uq_user_roles_user_role` (UNIQUE on user_id + role_id)

---

## 4.11 api_keys

API keys for SaaS integration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications | |
| name | VARCHAR(200) | NOT NULL | Descriptive name |
| key_hash | VARCHAR(255) | NOT NULL, UNIQUE | bcrypt hash of full key |
| key_prefix | VARCHAR(20) | NOT NULL | First 8 chars — for display |
| status | VARCHAR(50) | DEFAULT 'active' | active/revoked/expired |
| expires_at | TIMESTAMPTZ | NULL | NULL = never expires |
| last_used_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_api_keys_saas_app_id`, `uq_api_keys_key_hash`

---

*End of D3 Part 1 of 4*
*Next: DATABASE_PART_02.md — Mail, Calendar, Contacts Tables*
