# SSGzone Communication Platform
# DATABASE BLUEPRINT
# D3 — PART 2 OF 4
## Mail, Calendar & Contacts Tables

---

# SECTION 5 — MAIL TABLES

---

## 5.1 email_accounts

One record per user's email account.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users, UNIQUE | One account per user |
| tenant_id | UUID | FK → tenants | |
| email_address | VARCHAR(255) | NOT NULL, UNIQUE | Full email address |
| display_name | VARCHAR(200) | NULL | Sender display name |
| quota_bytes | BIGINT | NOT NULL | Storage quota in bytes |
| used_bytes | BIGINT | DEFAULT 0 | Current usage |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `uq_email_accounts_email_address`, `idx_email_accounts_tenant_id`, `idx_email_accounts_user_id`

**RLS**: Enabled on tenant_id

---

## 5.2 email_aliases

Additional email addresses that deliver to a primary account.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| alias_address | VARCHAR(255) | NOT NULL, UNIQUE | The alias email |
| delivers_to_id | UUID | FK → email_accounts | Primary account |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `uq_email_aliases_address`, `idx_email_aliases_tenant_id`, `idx_email_aliases_delivers_to`

---

## 5.3 email_folders

Mail folders per user (Inbox, Sent, Drafts, Trash, custom).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| account_id | UUID | FK → email_accounts | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(200) | NOT NULL | Folder name |
| type | VARCHAR(50) | NOT NULL | system / custom |
| system_type | VARCHAR(50) | NULL | inbox/sent/drafts/trash/spam/archive |
| parent_id | UUID | FK → email_folders, NULL | For nested folders |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| unread_count | INTEGER | DEFAULT 0 | Cached unread count |
| total_count | INTEGER | DEFAULT 0 | Cached total count |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_email_folders_account_id`, `idx_email_folders_tenant_id`, `uq_email_folders_name_account` (UNIQUE on name + account_id)

**RLS**: Enabled on tenant_id

---

## 5.4 email_messages

The core email storage table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| account_id | UUID | FK → email_accounts | Owner's account |
| folder_id | UUID | FK → email_folders | Current folder |
| message_id | VARCHAR(500) | NOT NULL | RFC 2822 Message-ID header |
| thread_id | UUID | NULL | Groups related messages |
| in_reply_to | VARCHAR(500) | NULL | Parent message ID |
| from_address | VARCHAR(255) | NOT NULL | |
| from_name | VARCHAR(255) | NULL | |
| to_addresses | JSONB | NOT NULL | Array of {name, email} |
| cc_addresses | JSONB | DEFAULT '[]' | |
| bcc_addresses | JSONB | DEFAULT '[]' | |
| subject | TEXT | NULL | |
| body_text | TEXT | NULL | Plain text body |
| body_html | TEXT | NULL | HTML body |
| size_bytes | INTEGER | DEFAULT 0 | Total message size |
| has_attachment | BOOLEAN | DEFAULT FALSE | |
| attachment_count | INTEGER | DEFAULT 0 | |
| is_read | BOOLEAN | DEFAULT FALSE | |
| is_starred | BOOLEAN | DEFAULT FALSE | |
| is_draft | BOOLEAN | DEFAULT FALSE | |
| is_outgoing | BOOLEAN | DEFAULT FALSE | Sent by this user |
| spam_score | DECIMAL(5,2) | NULL | 0.0 – 10.0 |
| dkim_pass | BOOLEAN | NULL | |
| dmarc_pass | BOOLEAN | NULL | |
| scheduled_at | TIMESTAMPTZ | NULL | For scheduled send |
| sent_at | TIMESTAMPTZ | NULL | Actual send time |
| received_at | TIMESTAMPTZ | NULL | Server receipt time |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_email_messages_tenant_id`
- `idx_email_messages_account_id`
- `idx_email_messages_folder_id`
- `idx_email_messages_thread_id`
- `idx_email_messages_received_at` (DESC — for inbox sort)
- `idx_email_messages_is_read` (partial: WHERE is_read = FALSE)
- `idx_email_messages_is_deleted` (partial: WHERE is_deleted = FALSE)
- `idx_email_messages_scheduled_at` (partial: WHERE scheduled_at IS NOT NULL)

**RLS**: Enabled on tenant_id

**Partitioning**: Partition by `received_at` (monthly) — see Part 4

---

## 5.5 email_attachments

Files attached to email messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| message_id | UUID | FK → email_messages | |
| tenant_id | UUID | FK → tenants | |
| filename | VARCHAR(500) | NOT NULL | Original filename |
| content_type | VARCHAR(200) | NOT NULL | MIME type |
| size_bytes | INTEGER | NOT NULL | |
| storage_key | VARCHAR(500) | NOT NULL | MinIO object key |
| is_inline | BOOLEAN | DEFAULT FALSE | Inline image vs attachment |
| content_id | VARCHAR(500) | NULL | For inline images (CID) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_email_attachments_message_id`, `idx_email_attachments_tenant_id`

---

## 5.6 email_rules

Server-side mail rules per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| account_id | UUID | FK → email_accounts | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(200) | NOT NULL | Rule name |
| is_active | BOOLEAN | DEFAULT TRUE | |
| sort_order | INTEGER | DEFAULT 0 | Evaluation order |
| conditions | JSONB | NOT NULL | Array of condition objects |
| actions | JSONB | NOT NULL | Array of action objects |
| stop_processing | BOOLEAN | DEFAULT FALSE | Stop after this rule |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Condition Object Structure**:
```json
{ "field": "from", "operator": "contains", "value": "newsletter" }
```

**Action Object Structure**:
```json
{ "type": "move_to_folder", "folder_id": "uuid" }
```

**Indexes**: `idx_email_rules_account_id`, `idx_email_rules_tenant_id`

---

## 5.7 email_autoresponders

Out-of-office and custom autoresponders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| account_id | UUID | FK → email_accounts, UNIQUE | One per account |
| tenant_id | UUID | FK → tenants | |
| is_active | BOOLEAN | DEFAULT FALSE | |
| subject | VARCHAR(500) | NOT NULL | |
| body | TEXT | NOT NULL | |
| start_date | DATE | NULL | NULL = always active |
| end_date | DATE | NULL | |
| reply_once_per_day | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 5.8 email_signatures

Email signatures per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| account_id | UUID | FK → email_accounts | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(200) | NOT NULL | Signature name |
| content | TEXT | NOT NULL | HTML content |
| is_default | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 5.9 email_queue

Outgoing mail queue.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| message_id | UUID | FK → email_messages | |
| from_address | VARCHAR(255) | NOT NULL | |
| to_address | VARCHAR(255) | NOT NULL | One row per recipient |
| status | VARCHAR(50) | DEFAULT 'queued' | queued/sending/sent/failed/bounced |
| attempts | INTEGER | DEFAULT 0 | |
| last_attempt_at | TIMESTAMPTZ | NULL | |
| next_retry_at | TIMESTAMPTZ | NULL | |
| error_message | TEXT | NULL | Last error |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_email_queue_status`, `idx_email_queue_next_retry_at`, `idx_email_queue_tenant_id`

---

## 5.10 shared_mailboxes

Shared email accounts accessible by multiple users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| email_address | VARCHAR(255) | NOT NULL, UNIQUE | |
| display_name | VARCHAR(200) | NULL | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

## 5.11 shared_mailbox_members

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| mailbox_id | UUID | FK → shared_mailboxes |
| user_id | UUID | FK → users |
| tenant_id | UUID | FK → tenants |
| added_at | TIMESTAMPTZ | DEFAULT NOW() |

---

# SECTION 6 — CALENDAR TABLES

---

## 6.1 calendars

Personal and shared calendars.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| owner_id | UUID | FK → users | |
| name | VARCHAR(200) | NOT NULL | |
| color | VARCHAR(20) | DEFAULT '#4285F4' | Hex color |
| type | VARCHAR(50) | DEFAULT 'personal' | personal/shared/org |
| is_default | BOOLEAN | DEFAULT FALSE | |
| is_visible | BOOLEAN | DEFAULT TRUE | |
| description | TEXT | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_calendars_tenant_id`, `idx_calendars_owner_id`

**RLS**: Enabled on tenant_id

---

## 6.2 calendar_shares

Sharing permissions for calendars.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| calendar_id | UUID | FK → calendars | |
| tenant_id | UUID | FK → tenants | |
| shared_with_id | UUID | FK → users | |
| permission | VARCHAR(50) | NOT NULL | view/edit |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_calendar_shares_calendar_id`, `idx_calendar_shares_shared_with_id`, `uq_calendar_shares` (UNIQUE on calendar_id + shared_with_id)

---

## 6.3 cal_events

Calendar events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| calendar_id | UUID | FK → calendars | |
| organizer_id | UUID | FK → users | |
| title | VARCHAR(500) | NOT NULL | |
| description | TEXT | NULL | |
| location | VARCHAR(500) | NULL | |
| video_room_id | UUID | FK → video_rooms, NULL | Linked video meeting |
| start_at | TIMESTAMPTZ | NOT NULL | |
| end_at | TIMESTAMPTZ | NOT NULL | |
| is_all_day | BOOLEAN | DEFAULT FALSE | |
| timezone | VARCHAR(100) | NOT NULL | e.g., `Asia/Kolkata` |
| is_recurring | BOOLEAN | DEFAULT FALSE | |
| recurrence_rule | TEXT | NULL | RFC 5545 RRULE string |
| recurrence_id | UUID | FK → cal_events, NULL | Parent recurring event |
| is_exception | BOOLEAN | DEFAULT FALSE | Modified occurrence |
| status | VARCHAR(50) | DEFAULT 'confirmed' | confirmed/tentative/cancelled |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_cal_events_tenant_id`
- `idx_cal_events_calendar_id`
- `idx_cal_events_organizer_id`
- `idx_cal_events_start_at`
- `idx_cal_events_recurrence_id`

**RLS**: Enabled on tenant_id

---

## 6.4 cal_event_attendees

Attendees and their RSVP status for events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| event_id | UUID | FK → cal_events | |
| tenant_id | UUID | FK → tenants | |
| user_id | UUID | FK → users, NULL | NULL for external attendees |
| external_email | VARCHAR(255) | NULL | For non-platform attendees |
| status | VARCHAR(50) | DEFAULT 'pending' | pending/accepted/declined/maybe |
| responded_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_cal_event_attendees_event_id`, `idx_cal_event_attendees_user_id`, `uq_cal_attendees` (UNIQUE on event_id + user_id)

---

## 6.5 cal_reminders

Event reminders per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| event_id | UUID | FK → cal_events | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| minutes_before | INTEGER | NOT NULL | e.g., 15 |
| method | VARCHAR(50) | DEFAULT 'notification' | notification/email |
| is_sent | BOOLEAN | DEFAULT FALSE | |
| send_at | TIMESTAMPTZ | NOT NULL | Computed: start_at - interval |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_cal_reminders_send_at` (partial: WHERE is_sent = FALSE), `idx_cal_reminders_user_id`

---

# SECTION 7 — CONTACTS TABLES

---

## 7.1 contacts

Personal contacts per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| first_name | VARCHAR(100) | NULL | |
| last_name | VARCHAR(100) | NULL | |
| display_name | VARCHAR(200) | NULL | Computed or custom |
| company | VARCHAR(200) | NULL | |
| job_title | VARCHAR(200) | NULL | |
| notes | TEXT | NULL | |
| avatar_url | VARCHAR(500) | NULL | |
| emails | JSONB | DEFAULT '[]' | Array of {type, address} |
| phones | JSONB | DEFAULT '[]' | Array of {type, number} |
| addresses | JSONB | DEFAULT '[]' | Array of address objects |
| custom_fields | JSONB | DEFAULT '{}' | |
| vcard_uid | VARCHAR(500) | NULL | For CardDAV sync |
| etag | VARCHAR(100) | NULL | For CardDAV sync |
| deleted_at | TIMESTAMPTZ | NULL | |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_contacts_user_id`
- `idx_contacts_tenant_id`
- `idx_contacts_display_name` (for search)
- GIN index on `emails` JSONB (for email search)

**RLS**: Enabled on tenant_id

---

## 7.2 contact_groups

Contact groups per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(200) | NOT NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_contact_groups_user_id`, `uq_contact_groups_name_user` (UNIQUE on name + user_id)

---

## 7.3 contact_group_members

Many-to-many: contacts ↔ groups.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| group_id | UUID | FK → contact_groups |
| contact_id | UUID | FK → contacts |
| tenant_id | UUID | FK → tenants |
| added_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes**: `idx_cgm_group_id`, `idx_cgm_contact_id`, `uq_cgm` (UNIQUE on group_id + contact_id)

---

## 7.4 address_books

CardDAV address books per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(200) | NOT NULL | |
| description | TEXT | NULL | |
| is_default | BOOLEAN | DEFAULT FALSE | |
| sync_token | VARCHAR(100) | NULL | For CardDAV sync |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

*End of D3 Part 2 of 4*
*Next: DATABASE_PART_03.md — Chat, Video, Drive, Notifications Tables*
