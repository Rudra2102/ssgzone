# SSGzone Communication Platform
# DATABASE BLUEPRINT
# D3 — PART 3 OF 4
## Chat, Video, Drive & Notifications Tables

---

# SECTION 8 — CHAT TABLES

---

## 8.1 chat_channels

Chat channels (group conversations) within a tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| name | VARCHAR(200) | NOT NULL | |
| description | TEXT | NULL | |
| type | VARCHAR(50) | DEFAULT 'public' | public/private/announcement/direct |
| created_by | UUID | FK → users | |
| is_archived | BOOLEAN | DEFAULT FALSE | |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| deleted_at | TIMESTAMPTZ | NULL | |
| last_message_at | TIMESTAMPTZ | NULL | For sorting channel list |
| message_count | INTEGER | DEFAULT 0 | Cached count |
| member_count | INTEGER | DEFAULT 0 | Cached count |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_chat_channels_tenant_id`
- `idx_chat_channels_type`
- `idx_chat_channels_last_message_at` (DESC)
- `uq_chat_channels_name_tenant` (UNIQUE on name + tenant_id)

**RLS**: Enabled on tenant_id

---

## 8.2 chat_channel_members

Members of each channel.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| channel_id | UUID | FK → chat_channels | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| role | VARCHAR(50) | DEFAULT 'member' | member/admin |
| is_muted | BOOLEAN | DEFAULT FALSE | |
| last_read_at | TIMESTAMPTZ | NULL | For unread count |
| joined_at | TIMESTAMPTZ | DEFAULT NOW() | |
| left_at | TIMESTAMPTZ | NULL | NULL = still member |

**Indexes**:
- `idx_ccm_channel_id`
- `idx_ccm_user_id`
- `uq_ccm` (UNIQUE on channel_id + user_id)

---

## 8.3 chat_messages

All chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| channel_id | UUID | FK → chat_channels | |
| sender_id | UUID | FK → users | |
| parent_id | UUID | FK → chat_messages, NULL | For thread replies |
| content | TEXT | NULL | Message text |
| content_type | VARCHAR(50) | DEFAULT 'text' | text/file/system |
| is_edited | BOOLEAN | DEFAULT FALSE | |
| edited_at | TIMESTAMPTZ | NULL | |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| deleted_at | TIMESTAMPTZ | NULL | |
| is_pinned | BOOLEAN | DEFAULT FALSE | |
| pinned_at | TIMESTAMPTZ | NULL | |
| pinned_by | UUID | FK → users, NULL | |
| reply_count | INTEGER | DEFAULT 0 | Cached thread reply count |
| reaction_count | INTEGER | DEFAULT 0 | Cached total reactions |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_chat_messages_tenant_id`
- `idx_chat_messages_channel_id`
- `idx_chat_messages_sender_id`
- `idx_chat_messages_parent_id`
- `idx_chat_messages_created_at` (DESC)
- `idx_chat_messages_is_pinned` (partial: WHERE is_pinned = TRUE)
- `idx_chat_messages_is_deleted` (partial: WHERE is_deleted = FALSE)

**RLS**: Enabled on tenant_id

**Partitioning**: Partition by `created_at` (monthly) — see Part 4

---

## 8.4 chat_message_attachments

Files shared in chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| message_id | UUID | FK → chat_messages | |
| tenant_id | UUID | FK → tenants | |
| filename | VARCHAR(500) | NOT NULL | |
| content_type | VARCHAR(200) | NOT NULL | MIME type |
| size_bytes | BIGINT | NOT NULL | |
| storage_key | VARCHAR(500) | NOT NULL | MinIO object key |
| thumbnail_key | VARCHAR(500) | NULL | For image thumbnails |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_chat_attachments_message_id`, `idx_chat_attachments_tenant_id`

---

## 8.5 chat_reactions

Emoji reactions on messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| message_id | UUID | FK → chat_messages | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| emoji | VARCHAR(50) | NOT NULL | Emoji code e.g., `thumbsup` |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_chat_reactions_message_id`
- `uq_chat_reactions` (UNIQUE on message_id + user_id + emoji)

---

## 8.6 chat_read_receipts

Tracks which messages each user has read.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| channel_id | UUID | FK → chat_channels | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| last_read_message_id | UUID | FK → chat_messages | |
| last_read_at | TIMESTAMPTZ | NOT NULL | |

**Indexes**: `uq_chat_read_receipts` (UNIQUE on channel_id + user_id), `idx_chat_read_receipts_user_id`

**Note**: Only the latest read position is stored per user per channel — not per message.

---

## 8.7 direct_message_threads

DM conversations between two users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| channel_id | UUID | FK → chat_channels | Underlying channel |
| user_a_id | UUID | FK → users | |
| user_b_id | UUID | FK → users | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `uq_dm_threads` (UNIQUE on tenant_id + user_a_id + user_b_id), `idx_dm_threads_user_a`, `idx_dm_threads_user_b`

---

# SECTION 9 — VIDEO TABLES

---

## 9.1 video_rooms

Video meeting rooms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| created_by | UUID | FK → users | |
| name | VARCHAR(500) | NULL | Optional room name |
| room_code | VARCHAR(50) | NOT NULL, UNIQUE | Short join code |
| join_url | VARCHAR(500) | NOT NULL | Full join URL |
| server_room_id | VARCHAR(500) | NULL | ID on video server (Janus/mediasoup) |
| status | VARCHAR(50) | DEFAULT 'waiting' | waiting/active/ended |
| is_locked | BOOLEAN | DEFAULT FALSE | |
| allow_guests | BOOLEAN | DEFAULT FALSE | |
| max_participants | INTEGER | DEFAULT 50 | |
| started_at | TIMESTAMPTZ | NULL | |
| ended_at | TIMESTAMPTZ | NULL | |
| duration_seconds | INTEGER | NULL | Computed on end |
| join_link_expires_at | TIMESTAMPTZ | NOT NULL | 24h from creation |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_video_rooms_tenant_id`, `uq_video_rooms_room_code`, `idx_video_rooms_status`

**RLS**: Enabled on tenant_id

---

## 9.2 video_participants

Participants in each meeting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| room_id | UUID | FK → video_rooms | |
| tenant_id | UUID | FK → tenants | |
| user_id | UUID | FK → users, NULL | NULL for guests |
| guest_name | VARCHAR(200) | NULL | For guest participants |
| joined_at | TIMESTAMPTZ | NOT NULL | |
| left_at | TIMESTAMPTZ | NULL | |
| duration_seconds | INTEGER | NULL | Computed on leave |
| is_host | BOOLEAN | DEFAULT FALSE | |

**Indexes**: `idx_video_participants_room_id`, `idx_video_participants_user_id`

---

# SECTION 10 — SHARED DRIVE TABLES

---

## 10.1 drive_items

Files and folders in the shared drive. Single table for both.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| owner_id | UUID | FK → users | |
| parent_id | UUID | FK → drive_items, NULL | NULL = root |
| name | VARCHAR(500) | NOT NULL | File or folder name |
| type | VARCHAR(50) | NOT NULL | file/folder |
| content_type | VARCHAR(200) | NULL | MIME type (files only) |
| size_bytes | BIGINT | DEFAULT 0 | 0 for folders |
| storage_key | VARCHAR(500) | NULL | MinIO key (files only) |
| thumbnail_key | VARCHAR(500) | NULL | For image/PDF thumbnails |
| current_version_id | UUID | NULL | FK → drive_versions |
| is_starred | BOOLEAN | DEFAULT FALSE | |
| is_deleted | BOOLEAN | DEFAULT FALSE | |
| deleted_at | TIMESTAMPTZ | NULL | |
| deleted_by | UUID | FK → users, NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_drive_items_tenant_id`
- `idx_drive_items_owner_id`
- `idx_drive_items_parent_id`
- `idx_drive_items_type`
- `idx_drive_items_is_deleted` (partial: WHERE is_deleted = FALSE)
- `uq_drive_items_name_parent` (UNIQUE on name + parent_id + tenant_id WHERE is_deleted = FALSE)

**RLS**: Enabled on tenant_id

---

## 10.2 drive_versions

Version history for files.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| item_id | UUID | FK → drive_items | |
| tenant_id | UUID | FK → tenants | |
| version_number | INTEGER | NOT NULL | 1, 2, 3... |
| storage_key | VARCHAR(500) | NOT NULL | MinIO key for this version |
| size_bytes | BIGINT | NOT NULL | |
| uploaded_by | UUID | FK → users | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_drive_versions_item_id`, `uq_drive_versions` (UNIQUE on item_id + version_number)

**Retention**: Maximum 10 versions per file — oldest deleted when limit exceeded.

---

## 10.3 drive_shares

Sharing permissions for drive items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| item_id | UUID | FK → drive_items | |
| tenant_id | UUID | FK → tenants | |
| shared_by | UUID | FK → users | |
| shared_with_id | UUID | FK → users, NULL | NULL = link share |
| permission | VARCHAR(50) | NOT NULL | view/edit |
| share_token | VARCHAR(255) | NULL, UNIQUE | For link-based sharing |
| token_expires_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_drive_shares_item_id`, `idx_drive_shares_shared_with_id`, `uq_drive_shares_token`

---

## 10.4 drive_activity

Activity log for drive items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| item_id | UUID | FK → drive_items | |
| tenant_id | UUID | FK → tenants | |
| user_id | UUID | FK → users | |
| action | VARCHAR(100) | NOT NULL | uploaded/downloaded/shared/renamed/deleted/restored |
| metadata | JSONB | DEFAULT '{}' | Additional context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_drive_activity_item_id`, `idx_drive_activity_tenant_id`, `idx_drive_activity_created_at` (DESC)

---

# SECTION 11 — NOTIFICATIONS TABLES

---

## 11.1 notifications

In-app notifications for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| tenant_id | UUID | FK → tenants | |
| user_id | UUID | FK → users | Recipient |
| type | VARCHAR(100) | NOT NULL | mail.received / chat.mention / cal.reminder / drive.shared / etc. |
| title | VARCHAR(500) | NOT NULL | Short notification text |
| body | TEXT | NULL | Longer description |
| action_url | VARCHAR(500) | NULL | Where to navigate on click |
| reference_id | UUID | NULL | ID of the related item |
| reference_type | VARCHAR(100) | NULL | email_message / chat_message / cal_event / drive_item |
| is_read | BOOLEAN | DEFAULT FALSE | |
| read_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**:
- `idx_notifications_user_id`
- `idx_notifications_tenant_id`
- `idx_notifications_is_read` (partial: WHERE is_read = FALSE)
- `idx_notifications_created_at` (DESC)

**RLS**: Enabled on tenant_id

**Retention**: Notifications older than 90 days are deleted by scheduled job.

---

## 11.2 notification_preferences

Per-user notification settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users, UNIQUE | One row per user |
| tenant_id | UUID | FK → tenants | |
| mail_inapp | BOOLEAN | DEFAULT TRUE | |
| mail_push | BOOLEAN | DEFAULT TRUE | |
| mail_digest | BOOLEAN | DEFAULT TRUE | |
| chat_inapp | BOOLEAN | DEFAULT TRUE | |
| chat_push | BOOLEAN | DEFAULT TRUE | |
| chat_mention_only | BOOLEAN | DEFAULT FALSE | Only notify on @mention |
| calendar_inapp | BOOLEAN | DEFAULT TRUE | |
| calendar_push | BOOLEAN | DEFAULT TRUE | |
| drive_inapp | BOOLEAN | DEFAULT TRUE | |
| drive_push | BOOLEAN | DEFAULT FALSE | |
| digest_frequency | VARCHAR(50) | DEFAULT 'daily' | daily/weekly/never |
| digest_time | TIME | DEFAULT '08:00' | Local time for digest |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 11.3 push_subscriptions

Browser push notification subscriptions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users | |
| tenant_id | UUID | FK → tenants | |
| endpoint | TEXT | NOT NULL | Push service URL |
| p256dh | TEXT | NOT NULL | Public key |
| auth | TEXT | NOT NULL | Auth secret |
| user_agent | TEXT | NULL | Browser info |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_push_subscriptions_user_id`, `uq_push_subscriptions_endpoint`

---

## 11.4 webhook_configs

Webhook endpoints registered by SaaS applications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| saas_app_id | UUID | FK → saas_applications | |
| url | TEXT | NOT NULL | Endpoint URL |
| events | JSONB | NOT NULL | Array of event types |
| secret | VARCHAR(255) | NOT NULL | HMAC signing secret (hashed) |
| is_active | BOOLEAN | DEFAULT TRUE | |
| failure_count | INTEGER | DEFAULT 0 | Consecutive failures |
| last_success_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 11.5 webhook_deliveries

Log of every webhook delivery attempt.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| webhook_id | UUID | FK → webhook_configs | |
| saas_app_id | UUID | FK → saas_applications | |
| event_type | VARCHAR(200) | NOT NULL | |
| payload | JSONB | NOT NULL | Full payload sent |
| status | VARCHAR(50) | DEFAULT 'pending' | pending/success/failed |
| http_status | INTEGER | NULL | Response status code |
| response_body | TEXT | NULL | First 1000 chars |
| attempt_number | INTEGER | DEFAULT 1 | |
| next_retry_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes**: `idx_webhook_deliveries_webhook_id`, `idx_webhook_deliveries_status`, `idx_webhook_deliveries_next_retry_at`

---

*End of D3 Part 3 of 4*
*Next: DATABASE_PART_04.md — Billing, Audit, Index Strategy, Partition Strategy, Retention Strategy*
