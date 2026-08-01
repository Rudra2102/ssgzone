# D8 — Messaging Infrastructure Blueprint | Part 01: Chat Architecture & Protocol

## 1. Overview

The Messaging Infrastructure covers the internal chat system built natively into SSGzone. It is a first-class module — not a third-party embed — designed for multi-tenant, real-time, persistent messaging within and across tenant organizations.

Scope of this document:
- Chat data model and conversation types
- Message protocol and delivery
- Channel management
- Message threading and reactions
- File sharing in chat
- Search within chat
- Moderation and retention

Out of scope (Phase 5 — future):
- External SMS/WhatsApp gateway
- Cross-platform federation (XMPP/Matrix)

---

## 2. Conversation Types

| Type | Description | Participants |
|------|-------------|--------------|
| `direct` | 1-to-1 private message | 2 users |
| `group` | Multi-person private group | 3–50 users |
| `channel` | Topic-based, persistent | Unlimited (tenant-scoped) |
| `announcement` | Broadcast only, no replies | Admin → all users |
| `thread` | Reply thread on a message | Inherits parent participants |

---

## 3. Data Model

### 3.1 Core Tables (from DATABASE_PART_03)

```sql
chat_conversations
  id              UUID PK
  tenant_id       UUID FK
  type            ENUM(direct, group, channel, announcement)
  name            TEXT          -- null for direct
  description     TEXT
  slug            TEXT          -- for channels: #engineering
  is_private      BOOLEAN       -- private channels require invite
  created_by      UUID FK users
  archived_at     TIMESTAMPTZ
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

chat_participants
  id              UUID PK
  conversation_id UUID FK
  user_id         UUID FK
  role            ENUM(owner, admin, member)
  joined_at       TIMESTAMPTZ
  last_read_at    TIMESTAMPTZ   -- for unread count calculation
  muted_until     TIMESTAMPTZ   -- null = not muted
  left_at         TIMESTAMPTZ   -- null = still member

chat_messages
  id              UUID PK
  conversation_id UUID FK
  sender_id       UUID FK users
  type            ENUM(text, file, image, video, audio, system, deleted)
  content         TEXT          -- null for file/deleted
  content_html    TEXT          -- rendered markdown/mentions
  reply_to_id     UUID FK chat_messages  -- for threaded replies
  thread_count    INTEGER DEFAULT 0
  edited_at       TIMESTAMPTZ
  deleted_at      TIMESTAMPTZ   -- soft delete
  created_at      TIMESTAMPTZ

chat_message_attachments
  id              UUID PK
  message_id      UUID FK
  file_name       TEXT
  file_size       BIGINT
  mime_type       TEXT
  s3_key          TEXT
  thumbnail_s3_key TEXT         -- for images/videos
  created_at      TIMESTAMPTZ

chat_reactions
  id              UUID PK
  message_id      UUID FK
  user_id         UUID FK
  emoji           TEXT          -- unicode emoji or shortcode
  created_at      TIMESTAMPTZ
  UNIQUE(message_id, user_id, emoji)

chat_mentions
  id              UUID PK
  message_id      UUID FK
  mentioned_user_id UUID FK
  conversation_id UUID FK
  is_read         BOOLEAN DEFAULT false
  created_at      TIMESTAMPTZ
```

### 3.2 Indexes

```sql
-- Message retrieval (primary query pattern)
CREATE INDEX idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Unread count
CREATE INDEX idx_chat_participants_user
  ON chat_participants(user_id, last_read_at);

-- Mentions
CREATE INDEX idx_chat_mentions_user
  ON chat_mentions(mentioned_user_id, is_read, created_at DESC);

-- Full-text search
CREATE INDEX idx_chat_messages_fts
  ON chat_messages USING GIN(to_tsvector('english', content))
  WHERE deleted_at IS NULL;
```

---

## 4. Message Protocol

### 4.1 Send Message Flow

```
Client → POST /api/v1/chat/messages
{
  conversationId: uuid,
  content: "Hello @priya, check this out",
  type: "text",
  replyToId: uuid | null,
  tempId: "client-generated-uuid"    ← idempotency key
}

Server processing:
  1. Validate: user is participant in conversation
  2. Validate: conversation not archived
  3. Parse mentions: extract @username → resolve to user_id
  4. Render content_html: markdown → HTML (sanitized)
  5. INSERT chat_messages
  6. INSERT chat_mentions (for each @mention)
  7. UPDATE chat_conversations.updated_at
  8. Publish to Redis: events:{recipientId} for each participant
  9. Trigger notification pipeline for offline participants
  10. Return: { messageId, tempId, timestamp, contentHtml }

Client on response:
  - Replace tempId with messageId in UI
  - Update message status: 'sending' → 'sent'
```

### 4.2 Message Types

| Type | Content Field | Attachment | Rendered As |
|------|--------------|------------|-------------|
| `text` | Markdown string | Optional | Formatted text |
| `file` | null | Required | File download card |
| `image` | null | Required | Inline image preview |
| `video` | null | Required | Video player |
| `audio` | null | Required | Audio player |
| `system` | System string | null | Grey italic text |
| `deleted` | null | null | "Message deleted" |

System message examples:
- `{user} joined the channel`
- `{user} left the channel`
- `{user} renamed the channel to {name}`
- `{user} added {user2} to the group`

### 4.3 Message Editing

```
PATCH /api/v1/chat/messages/:id
{ content: "Updated content" }

Rules:
  - Only sender can edit
  - Edit window: 24 hours after send (configurable per tenant)
  - Edited messages show "edited" label with timestamp
  - Edit history not stored (Phase 3 feature)

Server:
  1. Validate ownership + edit window
  2. UPDATE chat_messages SET content=?, content_html=?, edited_at=now()
  3. Re-parse mentions (add new, remove old)
  4. Publish WS: chat.message_edited { messageId, content, contentHtml, editedAt }
```

### 4.4 Message Deletion

```
DELETE /api/v1/chat/messages/:id

Rules:
  - Sender can delete own messages (any time)
  - Channel admin can delete any message
  - Soft delete: content set to null, type set to 'deleted'
  - Attachments: S3 objects deleted immediately

Server:
  1. Validate permission
  2. UPDATE chat_messages SET type='deleted', content=null, deleted_at=now()
  3. DELETE chat_message_attachments (+ S3 objects)
  4. Publish WS: chat.message_deleted { conversationId, messageId }
```

---

## 5. Channel Management

### 5.1 Channel Types

| Type | Visibility | Join | Use Case |
|------|------------|------|----------|
| Public channel | All tenant users | Self-join | #general, #announcements |
| Private channel | Invited only | Invite only | #hr-confidential |
| Announcement | All tenant users | No posting | Admin broadcasts |

### 5.2 Channel Operations

```
Create channel:
  POST /api/v1/chat/channels
  { name, description, isPrivate, memberIds[] }
  → Validate: slug unique in tenant
  → INSERT chat_conversations (type=channel)
  → INSERT chat_participants (creator as owner)
  → INSERT chat_participants (for each memberId)
  → Publish WS: channel.created to tenant room

Join public channel:
  POST /api/v1/chat/channels/:id/join
  → Validate: channel is public
  → INSERT chat_participants
  → INSERT system message: "{user} joined"
  → Publish WS: channel.member_joined

Invite to private channel:
  POST /api/v1/chat/channels/:id/invite
  { userIds: [uuid] }
  → Validate: requester is owner/admin
  → INSERT chat_participants for each user
  → Send notification to invited users

Leave channel:
  POST /api/v1/chat/channels/:id/leave
  → UPDATE chat_participants SET left_at=now()
  → INSERT system message: "{user} left"
  → If last member: archive channel

Archive channel:
  POST /api/v1/chat/channels/:id/archive
  → Validate: requester is owner or tenant admin
  → UPDATE chat_conversations SET archived_at=now()
  → Publish WS: channel.archived
  → Channel becomes read-only, no new messages
```

### 5.3 Channel Roles

| Role | Send Messages | Delete Others | Manage Members | Archive |
|------|--------------|---------------|----------------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ❌ |
| Member | ✅ | ❌ | ❌ | ❌ |

---

## 6. Threading

### 6.1 Thread Model

Threads are reply chains attached to a parent message. They do not create a new conversation — they are a sub-view within the same channel/DM.

```
Parent message (chat_messages.reply_to_id = null)
  └── Reply 1 (reply_to_id = parent.id)
  └── Reply 2 (reply_to_id = parent.id)
  └── Reply 3 (reply_to_id = parent.id)
```

Thread count is denormalized on the parent: `chat_messages.thread_count`.

### 6.2 Thread API

```
GET /api/v1/chat/messages/:id/thread
  → Returns: parent message + all replies (ordered by created_at ASC)
  → Pagination: cursor-based (before/after messageId)

POST /api/v1/chat/messages
  { conversationId, content, replyToId: parentMessageId }
  → Same as regular message send
  → Server: UPDATE chat_messages SET thread_count = thread_count + 1 WHERE id = replyToId
  → Publish WS: chat.thread_reply { parentMessageId, message }
```

---

## 7. Reactions

```
Add reaction:
  POST /api/v1/chat/messages/:id/reactions
  { emoji: "👍" }
  → INSERT chat_reactions (or ignore if duplicate)
  → Publish WS: chat.reaction { messageId, emoji, userId, action: 'add', count }

Remove reaction:
  DELETE /api/v1/chat/messages/:id/reactions/:emoji
  → DELETE chat_reactions WHERE message_id=? AND user_id=? AND emoji=?
  → Publish WS: chat.reaction { messageId, emoji, userId, action: 'remove', count }

Get reactions (aggregated):
  Returned inline with message:
  reactions: [
    { emoji: "👍", count: 3, users: [userId1, userId2, userId3], selfReacted: true },
    { emoji: "❤️", count: 1, users: [userId4], selfReacted: false }
  ]
```

---

## 8. Unread Counts

```
Unread count per conversation:
  SELECT COUNT(*) FROM chat_messages
  WHERE conversation_id = ?
    AND created_at > (
      SELECT last_read_at FROM chat_participants
      WHERE conversation_id = ? AND user_id = ?
    )
    AND sender_id != ?   -- don't count own messages
    AND deleted_at IS NULL

Mark as read:
  POST /api/v1/chat/conversations/:id/read
  → UPDATE chat_participants SET last_read_at = now()
  → Publish WS: chat.read_receipt { conversationId, userId, lastReadAt }

Total unread badge (sidebar):
  Cached in Redis: unread:{userId} = { total, byConversation: {} }
  Updated on: new message received, mark-as-read
  TTL: none (persistent until updated)
```

---

## 9. Typing Indicators

```
Client sends (on keypress, throttled to 1/3s):
  WS message: { type: 'typing', conversationId }

Server:
  1. Store in Redis: typing:{conversationId}:{userId} = 1, TTL=5s
  2. Publish WS: chat.typing { conversationId, userId, isTyping: true }

Auto-stop:
  Redis TTL expires → no explicit stop needed
  Client also sends stop on: blur, send, clear input

Recipient receives:
  chat.typing { conversationId, userId, isTyping: true/false }
  UI: "Priya is typing..." or "Priya, Amit are typing..."
  Max display: 3 names, then "Several people are typing..."
```

---

## 10. File Sharing in Chat

```
Upload flow:
  1. Client: POST /api/v1/chat/attachments/upload-url
     { fileName, mimeType, fileSize, conversationId }
  2. Server: validate file size (max 25 MB), mime type allowed
  3. Server: generate S3 presigned PUT URL (expires 15 min)
  4. Client: PUT directly to S3 presigned URL
  5. Client: POST /api/v1/chat/messages
     { conversationId, type: 'image'|'file', attachmentKey: s3Key }
  6. Server: verify S3 object exists, INSERT message + attachment

Allowed MIME types:
  Images:    image/jpeg, image/png, image/gif, image/webp
  Documents: application/pdf, application/msword, application/vnd.openxmlformats*
  Sheets:    application/vnd.ms-excel, application/vnd.openxmlformats*
  Text:      text/plain, text/csv
  Archives:  application/zip (max 10 MB)
  Audio:     audio/mpeg, audio/ogg, audio/wav
  Video:     video/mp4, video/webm (max 50 MB)

Blocked: .exe, .sh, .bat, .js, .php, and all executable types

Thumbnail generation (async):
  On image/video upload → Lambda/worker generates thumbnail
  Stored at: {s3Key}_thumb.jpg
  Used in chat preview
```

---

*Part 01 of 03 — Next: Search, Moderation, Retention & Compliance*
