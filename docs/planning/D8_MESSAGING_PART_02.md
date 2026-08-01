# D8 — Messaging Infrastructure Blueprint | Part 02: Search, Moderation, Retention & Compliance

## 1. Unified Search

### 1.1 Search Scope

The search system covers all communication modules:

| Module | Searchable Fields |
|--------|------------------|
| Mail | subject, from, to, body text, attachment names |
| Chat | message content, file names, channel names |
| Contacts | name, email, phone, company, department |
| Calendar | event title, description, attendee names |
| Drive | file name, folder name, file content (text/PDF) |

### 1.2 Search Architecture

```
Client → GET /api/v1/search?q=budget+report&scope=mail,chat&limit=20

API Server:
  1. Parse query, scope, filters
  2. Fan-out to search backends in parallel:
     - PostgreSQL FTS (chat, contacts, calendar)
     - Elasticsearch (mail body, drive content)
  3. Merge results, rank by relevance + recency
  4. Return unified result set

Search backends:
  PostgreSQL FTS:   chat messages, contacts, calendar events
  Elasticsearch:    mail bodies (large text), drive file content
  Redis cache:      recent searches per user (TTL 7 days)
```

### 1.3 PostgreSQL Full-Text Search

```sql
-- Chat search
SELECT
  m.id, m.content, m.created_at,
  c.name AS conversation_name,
  u.display_name AS sender_name,
  ts_rank(to_tsvector('english', m.content), query) AS rank
FROM chat_messages m
JOIN chat_conversations c ON c.id = m.conversation_id
JOIN users u ON u.id = m.sender_id
JOIN chat_participants p ON p.conversation_id = m.conversation_id
  AND p.user_id = :userId AND p.left_at IS NULL
CROSS JOIN plainto_tsquery('english', :query) query
WHERE to_tsvector('english', m.content) @@ query
  AND m.tenant_id = :tenantId
  AND m.deleted_at IS NULL
ORDER BY rank DESC, m.created_at DESC
LIMIT 20;
```

### 1.4 Elasticsearch Integration (Mail)

```
Index: mail_messages_{tenantId}
  Mapping:
    message_id:   keyword
    from:         text (analyzed) + keyword (exact)
    to:           text (analyzed)
    subject:      text (analyzed, boost: 3)
    body_text:    text (analyzed)
    timestamp:    date
    folder:       keyword
    labels:       keyword[]
    has_attachment: boolean

Indexing:
  On mail delivery → async job → index to Elasticsearch
  On mail delete → delete from index
  On label change → update index

Query:
  {
    "bool": {
      "must": { "multi_match": {
        "query": "budget report",
        "fields": ["subject^3", "body_text", "from", "to"]
      }},
      "filter": [
        { "term": { "tenant_id": "uuid" }},
        { "term": { "user_id": "uuid" }}
      ]
    }
  }
```

### 1.5 Search Result Format

```json
{
  "query": "budget report",
  "total": 47,
  "results": [
    {
      "type": "mail",
      "id": "uuid",
      "title": "Q3 Budget Report",
      "preview": "...please find the <em>budget report</em> attached...",
      "meta": { "from": "priya@nabc.lms.ssgzone.in", "timestamp": "ISO8601" },
      "url": "/mail/inbox/uuid",
      "score": 0.94
    },
    {
      "type": "chat",
      "id": "uuid",
      "title": "#finance",
      "preview": "Amit: the <em>budget report</em> is ready",
      "meta": { "conversation": "finance", "timestamp": "ISO8601" },
      "url": "/chat/uuid#messageId",
      "score": 0.87
    }
  ],
  "facets": {
    "type": { "mail": 30, "chat": 12, "drive": 5 },
    "dateRange": { "today": 3, "week": 15, "month": 47 }
  }
}
```

### 1.6 Search Filters

```
GET /api/v1/search?
  q=budget+report
  &scope=mail,chat,drive
  &from=priya@nabc.lms.ssgzone.in    (mail only)
  &dateFrom=2024-01-01
  &dateTo=2024-03-31
  &hasAttachment=true                 (mail only)
  &conversationId=uuid               (chat only)
  &folderId=uuid                     (drive only)
  &limit=20
  &offset=0
```

---

## 2. Moderation System

### 2.1 Moderation Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| Super Admin | Platform-wide | All moderation actions |
| Tenant Admin | Tenant-wide | Delete messages, suspend users, view all channels |
| Channel Owner/Admin | Channel-scoped | Delete messages, remove members, mute members |
| User | Own messages | Delete own messages, report messages |

### 2.2 Message Reporting

```
POST /api/v1/chat/messages/:id/report
{
  reason: "spam" | "harassment" | "inappropriate" | "other",
  description: string
}

Server:
  1. INSERT moderation_reports { messageId, reporterId, reason, description }
  2. Notify: tenant admin via notification
  3. If report count for message > 3: auto-flag for review
  4. Return: { reportId, status: 'submitted' }

Moderation queue:
  GET /api/v1/tenant/moderation/reports
  → Lists flagged messages with context
  → Actions: dismiss | delete_message | warn_user | suspend_user
```

### 2.3 User Muting & Banning

```
Mute user in channel (channel admin):
  POST /api/v1/chat/channels/:id/members/:userId/mute
  { duration: 3600 }   ← seconds, 0 = permanent
  → UPDATE chat_participants SET muted_until = now() + interval
  → User can read but not send messages
  → Publish WS: channel.member_muted { userId, mutedUntil }

Ban user from channel (channel admin):
  POST /api/v1/chat/channels/:id/members/:userId/remove
  → UPDATE chat_participants SET left_at = now()
  → INSERT system message: "{user} was removed"
  → User cannot rejoin unless re-invited

Suspend user platform-wide (tenant admin):
  POST /api/v1/tenant/users/:id/suspend
  → Handled by provisioning engine (D7)
  → Blocks all access including chat
```

### 2.4 Content Filtering

```
Configurable per tenant:
  - Profanity filter: word list (tenant can customize)
  - Link filtering: block external links in channels
  - File type restrictions: override global allowed types

Profanity filter flow:
  On message send:
    1. Check content against tenant word list
    2. If match:
       - action=warn: send message, add warning label
       - action=block: reject with 422 { error: "content_policy_violation" }
       - action=replace: replace with *** and deliver

Configuration:
  PATCH /api/v1/tenant/settings/chat
  {
    profanityFilter: { enabled: true, action: "replace", customWords: [] },
    allowExternalLinks: false,
    allowedFileTypes: ["image/*", "application/pdf"]
  }
```

---

## 3. Message Retention & Archival

### 3.1 Retention Policies

Retention is configured per tenant, per module.

```
Default retention periods (by plan):
  Basic:        Chat 30 days, Mail 1 year
  Standard:     Chat 1 year, Mail 3 years
  Professional: Chat unlimited, Mail 7 years

Custom retention (tenant admin):
  PATCH /api/v1/tenant/settings/retention
  {
    chat: { retentionDays: 365 },
    mail: { retentionDays: 1095 }
  }
  Constraint: cannot set lower than plan minimum
```

### 3.2 Retention Enforcement

```
Cron job: daily at 2 AM UTC

Chat retention:
  DELETE FROM chat_messages
  WHERE tenant_id = :tenantId
    AND created_at < now() - interval ':retentionDays days'
    AND type != 'system'
  → Also delete: chat_message_attachments + S3 objects
  → Log: retention_execution_logs { tenantId, module, deletedCount, executedAt }

Mail retention:
  DELETE FROM mail_messages
  WHERE tenant_id = :tenantId
    AND created_at < now() - interval ':retentionDays days'
    AND folder_slug NOT IN ('important', 'legal-hold')
  → Also delete: mail_attachments + S3 objects

Legal hold (overrides retention):
  Messages/mails tagged with legal_hold = true are NEVER deleted by retention job.
  Only Super Admin can remove legal hold.
```

### 3.3 Archival

```
Archival vs Deletion:
  - Deletion: data permanently removed
  - Archival: data moved to cold storage (S3 Glacier), not queryable in UI

Archive trigger:
  - Manual: tenant admin archives a channel
  - Automatic: channel inactive for 180 days (configurable)

Archive process:
  1. Export channel messages to JSONL file
  2. Upload to S3 Glacier: archives/{tenantId}/chat/{channelId}/{year}.jsonl.gz
  3. UPDATE chat_conversations SET archived_at = now(), storage_tier = 'glacier'
  4. DELETE messages from hot DB (retain metadata)
  5. Archive accessible via: GET /api/v1/tenant/archives (download only)

Restore from archive:
  - Manual request by tenant admin
  - Restore time: up to 12 hours (Glacier retrieval)
  - Restored to read-only view for 30 days
```

---

## 4. Compliance Features

### 4.1 GDPR Compliance

```
Right to Access (Article 15):
  GET /api/v1/tenant/users/:id/data-export
  → Generates ZIP containing:
    - Profile data (JSON)
    - All sent/received mail (mbox format)
    - All chat messages sent (JSON)
    - Calendar events (iCal)
    - Contacts (vCard)
    - Drive files (original format)
  → Async job, download link sent via email
  → Link expires: 7 days

Right to Erasure (Article 17):
  DELETE /api/v1/tenant/users/:id/personal-data
  → Anonymize: replace name/email with "Deleted User" in messages
  → Delete: profile, contacts, calendar events
  → Retain: audit logs (legal obligation), billing records
  → Chat messages: content replaced with "[Message from deleted user]"
  → Mail: deleted from mailbox, metadata retained for audit

Right to Portability (Article 20):
  Same as data export (machine-readable formats)

Consent Management:
  - Cookie consent banner (webmail)
  - Processing consent recorded in users.gdpr_consent_at
  - Consent withdrawal: triggers data erasure workflow
```

### 4.2 Audit Logging

```
All actions logged to audit_logs table:
  id              UUID PK
  tenant_id       UUID FK
  actor_id        UUID FK users
  actor_role      TEXT
  action          TEXT          ← e.g. "chat.message.deleted"
  resource_type   TEXT          ← "chat_message"
  resource_id     UUID
  ip_address      INET
  user_agent      TEXT
  metadata        JSONB         ← before/after state for sensitive actions
  created_at      TIMESTAMPTZ

Audited actions (chat):
  chat.message.sent
  chat.message.edited
  chat.message.deleted
  chat.channel.created
  chat.channel.archived
  chat.member.added
  chat.member.removed
  chat.member.muted
  chat.file.uploaded
  chat.file.downloaded

Audit log retention: 7 years (non-deletable, even by Super Admin)
Audit log access: Super Admin (all), Tenant Admin (own tenant only)
```

### 4.3 eDiscovery

```
For legal/compliance teams to search and export communications:

POST /api/v1/admin/ediscovery/search
{
  tenantId: uuid,
  query: "project phoenix",
  scope: ["mail", "chat"],
  dateFrom: "2024-01-01",
  dateTo: "2024-12-31",
  userIds: [uuid],           ← optional: specific users
  includeDeleted: true       ← include soft-deleted messages
}

Response:
  { jobId, estimatedResults, status: 'processing' }

GET /api/v1/admin/ediscovery/jobs/:jobId
  → { status, resultCount, downloadUrl }

Export format:
  - Mail: PST or mbox
  - Chat: JSON with full metadata
  - Includes: message content, sender, timestamp, read receipts, edit history
```

### 4.4 Data Residency

```
Tenant data residency options (Phase 3):
  - India (default): ap-south-1 (Mumbai)
  - EU: eu-west-1 (Ireland)
  - US: us-east-1 (Virginia)

Implementation:
  - Separate DB clusters per region
  - S3 buckets per region
  - Tenant metadata (slug, plan) in global DB
  - All message/file data in regional DB/storage
  - API routes to correct regional cluster based on tenant

Phase 1/2: India only (single region)
```

---

## 5. Notification Integration (Chat-specific)

### 5.1 Chat Notification Rules

```
Notify user when:
  1. Direct message received (always, unless DND)
  2. Mentioned in channel (@username)
  3. Reply to own message (thread reply)
  4. Added to group/channel
  5. Channel has keyword match (user-configured keywords)

Do NOT notify when:
  - User is active in that conversation (last_active < 30s)
  - User has muted the conversation
  - User is in DND mode
  - Message is from self (multi-device sync)
```

### 5.2 Notification Preferences (Chat)

```
Per-conversation mute:
  POST /api/v1/chat/conversations/:id/mute
  { duration: 3600 | 86400 | 604800 | 0 }  ← 0 = forever
  → UPDATE chat_participants SET muted_until

Global chat notification settings:
  PATCH /api/v1/notifications/preferences
  {
    chat: {
      directMessages: { inApp: true, push: true, email: false },
      mentions: { inApp: true, push: true, email: true },
      channelMessages: { inApp: false, push: false, email: false },
      keywords: ["urgent", "action required"]
    }
  }
```

---

## 6. Performance & Scalability

### 6.1 Message Load Targets

| Metric | Target |
|--------|--------|
| Messages/sec (write) | 5,000 |
| Messages/sec (read) | 50,000 |
| Concurrent chat users | 100,000 |
| Messages per conversation (max) | Unlimited (paginated) |
| Search latency (p95) | < 500ms |
| Message delivery latency (p95) | < 200ms |

### 6.2 Pagination Strategy

```
Cursor-based pagination for chat (not offset):

GET /api/v1/chat/conversations/:id/messages
  ?limit=50
  &before=messageId    ← load older messages (scroll up)
  &after=messageId     ← load newer messages (scroll down)

Response:
  {
    messages: [...],
    cursor: {
      before: "oldest_message_id_in_set",
      after: "newest_message_id_in_set",
      hasMore: { before: true, after: false }
    }
  }

Initial load: last 50 messages (no cursor)
Scroll up: before=oldest_visible_messageId
Jump to date: binary search by created_at, then cursor from there
```

### 6.3 Caching Strategy

```
Redis cache:
  conversation_list:{userId}     → user's conversations, sorted by updated_at
    TTL: none, invalidated on new message
  unread_counts:{userId}         → { total, byConversation }
    TTL: none, invalidated on read/new message
  channel_members:{channelId}    → member list
    TTL: 5 min
  typing:{conversationId}        → active typers
    TTL: 5s per user

PostgreSQL query cache:
  - Prepared statements for hot queries
  - Connection pooling: PgBouncer (transaction mode)
  - Read replicas for search queries
```

---

*Part 02 of 03 — Next: Future Messaging Infrastructure (Phase 5) & Integration Patterns*
