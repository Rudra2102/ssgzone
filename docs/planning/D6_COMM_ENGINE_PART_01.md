# D6 — Communication Engine Blueprint | Part 01: Mail & Real-time Infrastructure

## 1. Overview

The Communication Engine is the core technical layer that powers all message delivery in SSGzone. It covers:
- Inbound/outbound SMTP mail pipeline
- IMAP/POP3 access layer
- Real-time WebSocket event bus
- Presence system
- Push notification delivery

All components are stateless and horizontally scalable. State lives in PostgreSQL, Redis, and object storage.

---

## 2. Mail Architecture

### 2.1 Domain & DNS Structure

```
ssgzone.in                          ← root domain
  mail.ssgzone.in                   ← webmail UI
  api.ssgzone.in                    ← REST API
  smtp.ssgzone.in                   ← outbound SMTP relay
  mx1.ssgzone.in                    ← inbound MX (primary)
  mx2.ssgzone.in                    ← inbound MX (secondary)

Tenant subdomains (auto-provisioned):
  nabc.lms.ssgzone.in               ← tenant mail domain
  abcdevelopers.rupyo.ssgzone.in
```

DNS records per tenant subdomain (auto-created via DNS Manager):
```
MX   10  mx1.ssgzone.in
MX   20  mx2.ssgzone.in
TXT       v=spf1 include:spf.ssgzone.in ~all
TXT       v=DKIM1; k=rsa; p=<public_key>   (selector: s1._domainkey)
TXT       v=DMARC1; p=quarantine; rua=mailto:dmarc@ssgzone.in
```

---

### 2.2 Inbound Mail Pipeline

```
Internet
  │
  ▼
[MX1/MX2 — Postfix SMTP listener :25]
  │
  ├── Reject: invalid recipient domain
  ├── Reject: blacklisted sender IP (SpamHaus XBL/SBL)
  ├── Reject: failed SPF (hard fail)
  │
  ▼
[Milter: Rspamd — spam/virus scoring]
  │
  ├── Score > 15 → reject
  ├── Score 6–15 → tag [SPAM], deliver to Spam folder
  ├── Score < 6  → clean, continue
  │
  ▼
[Postfix → LMTP → Dovecot]
  │
  ▼
[Dovecot — mail storage]
  │
  ├── Write to mailbox (Maildir format on object storage)
  ├── Trigger: POST /internal/mail/delivered → API server
  │
  ▼
[API Server — delivery event handler]
  │
  ├── Insert row: mail_messages table
  ├── Update: mail_folders (unread count)
  ├── Publish: Redis pub/sub → "mail:new:{user_id}"
  └── Trigger: notification pipeline (see Section 4)
```

---

### 2.3 Outbound Mail Pipeline

```
[API Server — POST /mail/send]
  │
  ├── Validate: sender owns the from address
  ├── Validate: recipient format
  ├── Store: mail_messages (status=queued)
  │
  ▼
[Mail Queue — Redis + Bull/BullMQ]
  │
  ├── Priority queue: transactional > bulk
  ├── Rate limit per tenant: configurable (default 100/min)
  │
  ▼
[Mail Worker — Node.js process]
  │
  ├── Fetch message from queue
  ├── Sign with DKIM (tenant private key)
  ├── Resolve recipient MX via DNS
  │
  ▼
[Postfix SMTP relay — smtp.ssgzone.in :587]
  │
  ├── TLS required (STARTTLS)
  ├── Authenticate with API-issued SMTP credentials
  │
  ▼
[Recipient mail server]
  │
  ▼
[Delivery callback — SMTP DSN / webhook]
  │
  ├── delivered  → update mail_messages.status = 'delivered'
  ├── bounced    → update status = 'bounced', log bounce_type
  └── deferred   → retry with exponential backoff (max 72h)
```

---

### 2.4 Mail Queue Design

```
Queue names (BullMQ):
  mail:outbound:transactional   ← priority 10
  mail:outbound:bulk            ← priority 1
  mail:retry                    ← deferred/bounced retries

Job schema:
{
  jobId: uuid,
  messageId: uuid,             ← FK mail_messages.id
  from: "user@tenant.saas.ssgzone.in",
  to: ["recipient@example.com"],
  subject: string,
  bodyHtml: string,
  bodyText: string,
  attachments: [{ filename, s3Key, contentType }],
  dkimSelector: "s1",
  tenantId: uuid,
  attempt: number,
  maxAttempts: 5,
  nextRetryAt: ISO8601
}

Retry schedule (exponential backoff):
  Attempt 1: immediate
  Attempt 2: +5 min
  Attempt 3: +30 min
  Attempt 4: +2 hr
  Attempt 5: +24 hr → mark permanent failure
```

---

### 2.5 IMAP/POP3 Access

Dovecot handles IMAP and POP3. Authentication proxied through API server.

```
Client (mail app)
  │
  ▼
[Dovecot — IMAP :993 SSL / POP3 :995 SSL]
  │
  ▼
[Dovecot auth passdb → HTTP lookup]
  │  POST /internal/auth/imap
  │  { username, password }
  │  Response: { allow: true, uid, maildir_path }
  │
  ▼
[Maildir on object storage (S3-compatible)]
```

IMAP folder mapping:
| IMAP Folder | DB Folder Slug |
|-------------|----------------|
| INBOX | inbox |
| Sent | sent |
| Drafts | drafts |
| Trash | trash |
| Spam | spam |
| Starred | starred |
| [Custom] | user-defined |

---

### 2.6 DKIM Key Management

```
Per-tenant DKIM key lifecycle:
  1. Tenant provisioned → generate RSA-2048 key pair
  2. Private key → encrypted at rest (AES-256), stored in DB
  3. Public key → published as DNS TXT record via DNS Manager
  4. Key rotation: every 365 days (automated)
     - Generate new key pair (selector: s2)
     - Publish s2 DNS record
     - Wait 48h (DNS propagation)
     - Switch signing to s2
     - Retire s1 after 30 days
```

---

## 3. Real-time WebSocket Infrastructure

### 3.1 Architecture

```
Client (browser)
  │
  ▼
[WebSocket Gateway — ws.ssgzone.in]
  │  Upgrade: HTTP → WS (Socket.io or native WS)
  │  Auth: JWT in connection handshake
  │
  ▼
[WS Server — Node.js cluster]
  │
  ├── Authenticate connection (verify JWT)
  ├── Join rooms: user:{id}, tenant:{id}, channel:{id}
  │
  ▼
[Redis Pub/Sub — event bus]
  │
  ├── Any API server publishes events to Redis
  ├── WS servers subscribe and forward to connected clients
  │
  ▼
[Client receives event → update UI state]
```

Multiple WS server instances are coordinated via Redis pub/sub (Socket.io Redis adapter or custom).

---

### 3.2 Event Routing

```
Event published to Redis channel: "events:{user_id}"

WS server:
  1. Subscribe to "events:{user_id}" for each connected user
  2. On message → forward to user's WS connection(s)
  3. User may have multiple connections (tabs) → fan-out to all

Room-based routing:
  user:{user_id}          ← personal events (mail, notifications)
  tenant:{tenant_id}      ← tenant-wide broadcasts (system alerts)
  channel:{channel_id}    ← chat channel messages
  meeting:{meeting_id}    ← video meeting signaling
```

---

### 3.3 WebSocket Event Catalog

#### Mail Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `mail.new` | `{ messageId, folderId, from, subject, preview, timestamp }` | New mail delivered |
| `mail.status_update` | `{ messageId, status }` | Sent mail delivery status change |
| `mail.read` | `{ messageId, folderId }` | Message marked read (sync across tabs) |
| `mail.deleted` | `{ messageId, folderId }` | Message deleted |

#### Chat Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `chat.message` | `{ conversationId, messageId, senderId, content, timestamp }` | New message |
| `chat.typing` | `{ conversationId, userId, isTyping }` | Typing indicator |
| `chat.reaction` | `{ messageId, emoji, userId, action }` | Reaction add/remove |
| `chat.message_deleted` | `{ conversationId, messageId }` | Message deleted |
| `chat.read_receipt` | `{ conversationId, userId, lastReadAt }` | Messages read |

#### Presence Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `presence.update` | `{ userId, status, lastSeen }` | User status change |
| `presence.bulk` | `{ users: [{ userId, status }] }` | Initial load / reconnect |

#### Notification Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `notification.new` | `{ notificationId, type, title, body, actionUrl }` | New notification |
| `notification.read` | `{ notificationId }` | Notification marked read |
| `notification.clear_all` | `{}` | All notifications cleared |

#### System Events
| Event | Payload | Trigger |
|-------|---------|---------|
| `system.alert` | `{ level, message, expiresAt }` | Admin broadcast |
| `session.revoked` | `{ sessionId }` | Session terminated by admin |

---

### 3.4 Connection Lifecycle

```
Client connects:
  1. Send JWT in handshake (Authorization header or query param)
  2. Server validates JWT → extract userId, tenantId, sessionId
  3. Server checks session not revoked (Redis cache)
  4. Join rooms: user:{userId}, tenant:{tenantId}
  5. Send: presence.bulk (online users in tenant)
  6. Publish: presence.update { userId, status: 'online' }

Client disconnects:
  1. Leave all rooms
  2. If no other connections for userId:
     - Wait 30s (grace period for reconnect)
     - If still no connection: publish presence.update { status: 'offline' }
     - Update users.last_seen_at in DB

Reconnect:
  1. Client auto-reconnects with exponential backoff
  2. On reconnect: server sends missed events (last 60s from Redis stream)
  3. Client reconciles state
```

---

## 4. Presence System

### 4.1 Presence States

| Status | Description | Set By |
|--------|-------------|--------|
| `online` | Active WS connection | Automatic |
| `away` | No activity for 10 min | Automatic |
| `dnd` | Do Not Disturb | User manual |
| `offline` | No WS connection | Automatic |
| `custom` | User-set message | User manual |

### 4.2 Presence Storage

```
Redis (hot, TTL-based):
  Key: presence:{userId}
  Value: { status, lastActivity, customMessage }
  TTL: 5 min (refreshed on activity)

PostgreSQL (cold, for history):
  users.presence_status
  users.last_seen_at
  (updated on disconnect, not on every activity)
```

### 4.3 Activity Detection

```
Client sends heartbeat every 30s:
  WS message: { type: 'heartbeat' }

Server:
  - Refresh Redis TTL
  - If last activity > 10 min → set status = 'away'
  - Publish presence.update to tenant room
```

---

## 5. Internal Service Communication

### 5.1 Service Topology

```
                    ┌─────────────┐
                    │  API Server │
                    │  (REST)     │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌──────▼──────┐  ┌─────▼──────┐
    │  Postfix  │   │   Dovecot   │  │  WS Server │
    │  (SMTP)   │   │  (IMAP)     │  │            │
    └───────────┘   └─────────────┘  └────────────┘
          │                                │
          └──────────────┬─────────────────┘
                         │
                    ┌────▼────┐
                    │  Redis  │
                    │  Pub/Sub│
                    │  Queue  │
                    └─────────┘
```

### 5.2 Internal API Endpoints (not public)

```
POST /internal/mail/delivered        ← Dovecot → API on delivery
POST /internal/auth/imap             ← Dovecot → API for auth
POST /internal/auth/smtp             ← Postfix → API for auth
POST /internal/bounce                ← Postfix → API on bounce/DSN
GET  /internal/health                ← Load balancer health check
```

All internal endpoints:
- Bound to internal network only (not exposed via API Gateway)
- Authenticated via shared secret header `X-Internal-Secret`

---

*Part 01 of 02 — Next: Video, Push Notifications & Delivery Guarantees*
