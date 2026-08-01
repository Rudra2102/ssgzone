# D8 — Messaging Infrastructure Blueprint | Part 03: Future Infrastructure & Integration Patterns

## 1. Phase 5 — SSGzone Messaging Infrastructure Platform

### 1.1 Strategic Context

Phase 5 introduces the SSGzone Messaging Infrastructure Platform — a standalone, programmable messaging layer that SaaS applications can use to send transactional and operational messages to their end users via any external channel.

**The goal is to build SSGzone's own messaging infrastructure platform**, comparable in architecture and capability to Twilio, MessageBird, Sinch, or Infobip — but India-first, deeply integrated with the SSGzone communication suite, and purpose-built for the B2B SaaS market.

This is NOT a consumer messaging feature. It is a B2B infrastructure service exposed via a clean, channel-agnostic API.

**SMS, WhatsApp Business, RCS, Email, and other channels are future connectors** plugged into this infrastructure. No single channel is a core product feature — the platform itself is the product. Channels are added progressively as the infrastructure matures.

---

### 1.2 Channel Connector Roadmap

Channels are connectors to the Messaging Infrastructure Platform, not standalone features.

| Connector | Phase | Upstream Provider | Use Case |
|-----------|-------|-------------------|----------|
| SMS | 5.0 | MSG91 (primary), Twilio (fallback) | OTP, alerts, notifications |
| WhatsApp Business | 5.1 | Meta Cloud API | Transactional templates |
| RCS | 5.2 | Google RCS Business Messaging | Rich notifications (India) |
| Email (outbound) | Existing | SSGzone SMTP | Already live via Mail module |
| Voice (future) | 6+ | TBD | OTP calls, IVR |
| Push (future) | 6+ | FCM / APNs | Mobile app notifications |

---

### 1.3 Platform Architecture Overview

```
SaaS Application
  │
  ▼
POST /api/v1/messaging/send          ← single channel-agnostic API
  │
  ▼
[SSGzone Messaging Infrastructure Platform]
  │
  ├── Route by channel: sms | whatsapp | rcs | email | ...
  ├── Validate: template approved, recipient opted-in
  ├── Rate limit: per SaaS platform, per channel
  ├── Queue: messaging:outbound:{channel}
  │
  ▼
[Channel Connector Workers — pluggable]
  │
  ├── SMS Connector      → MSG91 / Twilio API
  ├── WhatsApp Connector → Meta Cloud API
  ├── RCS Connector      → Google RCS API
  └── [Future connectors added without API changes]
  │
  ▼
[Delivery Webhook ← Provider]
  │
  ▼
POST /internal/messaging/status
  → Update messaging_logs.status
  → Publish WS: messaging.status_update (to SaaS dashboard)
  → Trigger webhook: message.delivered / message.failed
```

---

### 1.4 SMS Infrastructure

#### Provider Selection
- Primary: MSG91 (India-first, DLT registered, competitive pricing)
- Fallback: Twilio (global, higher cost)
- Failover: automatic if primary returns 5xx

#### DLT Compliance (India)
```
TRAI DLT (Distributed Ledger Technology) requirements:
  - All SMS senders must register on DLT portal
  - Each message template must be pre-approved
  - Sender ID (header) must be registered
  - Template ID must be passed with each API call

SSGzone handles:
  - Platform-level DLT registration (SSGzone as principal entity)
  - Template registration on behalf of SaaS platforms
  - Sender ID management

SaaS platform provides:
  - Template content
  - Template category (transactional / promotional / service)
  - Sender ID preference
```

#### SMS API
```
POST /api/v1/messaging/sms/send
{
  to: "+919876543210",
  templateId: "uuid",              ← SSGzone template ID
  variables: { otp: "123456" },
  tenantId: "uuid"                 ← optional: for tenant-scoped sending
}

Response:
{
  messageId: "uuid",
  status: "queued",
  provider: "msg91",
  estimatedDelivery: "ISO8601"
}

Template management:
  POST /api/v1/messaging/sms/templates        Register template
  GET  /api/v1/messaging/sms/templates        List templates
  GET  /api/v1/messaging/sms/templates/:id    Get template + approval status
  DELETE /api/v1/messaging/sms/templates/:id  Delete template
```

#### SMS Template Schema
```json
{
  "templateId": "uuid",
  "name": "OTP Verification",
  "category": "transactional",
  "content": "Your OTP for {app_name} is {otp}. Valid for {validity} minutes. Do not share.",
  "variables": ["app_name", "otp", "validity"],
  "senderId": "SSGZNE",
  "dltTemplateId": "1234567890",    ← from DLT portal
  "status": "approved" | "pending" | "rejected",
  "approvedAt": "ISO8601"
}
```

---

### 1.5 WhatsApp Business Connector (Phase 5.1)

WhatsApp Business is one connector in the Messaging Infrastructure Platform. It is not a standalone product feature.

#### Compliance Requirements
```
Meta WhatsApp Business API requirements:
  1. Business Verification: Meta verifies the business entity
  2. Phone Number Registration: dedicated number per SaaS platform
  3. Template Approval: all templates reviewed by Meta (24-72h)
  4. Opt-in: recipients must have opted in to receive messages
  5. 24-hour window: free-form messages only within 24h of user-initiated contact
     Outside window: only approved templates allowed
  6. Quality Rating: maintained above "Medium" to avoid restrictions
```

#### WhatsApp Template Types
| Category | Use Case | Example |
|----------|----------|---------|
| `AUTHENTICATION` | OTP, login codes | "Your code is {{1}}" |
| `UTILITY` | Order updates, alerts | "Your invoice {{1}} is ready" |
| `MARKETING` | Promotions | Requires explicit opt-in |

Phase 5.1 supports: AUTHENTICATION + UTILITY only.
MARKETING templates: Phase 5.3 (requires additional compliance layer).

#### Channel-Agnostic Send API (WhatsApp example)
```
POST /api/v1/messaging/send
{
  channel: "whatsapp",
  to: "+919876543210",
  templateName: "invoice_ready",
  templateLanguage: "en",
  components: [
    { type: "body", parameters: [{ type: "text", text: "INV-2024-001" }] }
  ],
  platformId: "uuid"
}

Opt-in management (shared across all channels):
  POST /api/v1/messaging/optins           Record opt-in
  DELETE /api/v1/messaging/optins/:phone  Record opt-out
  GET /api/v1/messaging/optins/:phone     Check opt-in status by channel

Webhook (inbound from Meta):
  POST /internal/messaging/connectors/whatsapp/webhook
  → Handle: message status updates, inbound messages, opt-outs
```

#### Opt-in Storage
```sql
messaging_optins
  id              UUID PK
  platform_id     UUID FK
  channel         TEXT          -- 'whatsapp' | 'sms' | 'rcs' | 'voice'
  phone           TEXT          -- E.164 format
  opted_in_at     TIMESTAMPTZ
  opted_out_at    TIMESTAMPTZ
  opt_in_source   TEXT          -- 'web_form' | 'sms_keyword' | 'api'
  UNIQUE(platform_id, channel, phone)
```

---

### 1.6 Platform Rate Limits

```
Per SaaS platform, per channel connector, per minute:
  SMS:       1,000 messages/min (Starter), 10,000 (Growth), custom (Enterprise)
  WhatsApp:  500 messages/min (limited by Meta tier)
  RCS:       1,000 messages/min

Per recipient (anti-spam, applies to all connectors):
  SMS:       Max 5 messages/hour, 20/day per phone number
  WhatsApp:  Max 2 templates/day per phone number (outside 24h window)

Rate limit enforcement:
  Redis sliding window: ratelimit:messaging:{platformId}:{channel}:{minute}
  On exceed: 429 { error: "messaging_rate_limit_exceeded", retryAfter: seconds }
```

---

### 1.7 Messaging Analytics

```
Per SaaS platform dashboard:
  - Messages sent (by channel, by day)
  - Delivery rate (delivered / sent)
  - Failure breakdown (invalid number, opted out, provider error)
  - Cost per channel
  - Template performance (delivery rate per template)

Stored in: messaging_logs table
  id, platform_id, channel, template_id, recipient_phone,
  status, provider_message_id, sent_at, delivered_at, failed_at,
  failure_reason, cost_inr

Aggregated daily: messaging_analytics table (for fast dashboard queries)
```

---

## 2. Cross-Module Integration Patterns

### 2.1 Mail ↔ Chat Integration

```
"Email to Chat" (Phase 3):
  - Forward email thread to a chat channel
  - Creates a system message with email preview
  - Replies in chat do NOT go back to email (one-way)

"Chat to Email" (Phase 3):
  - Export chat thread as email
  - Sends formatted email with chat transcript

Shared context:
  - @mention in chat can reference an email thread
  - Calendar invite creates a chat message in meeting channel
```

### 2.2 Calendar ↔ Chat Integration

```
On event creation with attendees:
  - Auto-create a group chat for the meeting (optional, user toggle)
  - Chat name: "Meeting: {event title}"
  - Members: all attendees
  - System message: "Meeting scheduled for {date} at {time}"

On event start (15 min before):
  - Send notification in meeting chat: "Meeting starts in 15 minutes"
  - Include video join link

On event end:
  - Archive meeting chat (configurable)
  - If recorded: post recording link in chat
```

### 2.3 Drive ↔ Chat Integration

```
Share file to chat:
  - From Drive: right-click → Share to Chat
  - Select conversation → sends file message with Drive preview
  - File remains in Drive (not re-uploaded)
  - Chat message contains: drive_file_id reference

File preview in chat:
  - PDF: inline preview (first page thumbnail)
  - Images: inline display
  - Office docs: thumbnail + "Open in Drive" link
  - Other: file card with icon, name, size
```

### 2.4 Notifications ↔ All Modules

```
Notification aggregation rules:
  - Same sender, same conversation, within 5 min → batch into one notification
    "Priya sent 5 messages in #general"
  - Multiple senders, same conversation → separate notifications
  - @mention always gets individual notification (never batched)

Notification action buttons (in push/email):
  - Mail: [Reply] [Archive]
  - Chat: [Reply] [Mark Read]
  - Calendar: [Accept] [Decline]
  - Drive: [View File]
```

---

## 3. API Gateway Integration

### 3.1 Rate Limiting Strategy

```
Tiers (applied at API Gateway):
  Unauthenticated:  10 req/min
  Authenticated:    100 req/min (default)
  SaaS API key:     per plan (100–custom req/min)
  Internal:         unlimited (IP whitelist)

Rate limit headers (all responses):
  X-RateLimit-Limit:     100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset:     1704067200   ← Unix timestamp

Algorithm: sliding window (Redis)
Key: ratelimit:{identifier}:{window_start}
```

### 3.2 Request Tracing

```
Every request gets a trace ID:
  X-Request-ID: uuid (generated at gateway if not provided)
  X-Trace-ID: uuid (propagated through all internal calls)

Logged in:
  - API access logs
  - Service logs
  - Error logs
  - Audit logs

Enables: end-to-end request tracing across services
```

### 3.3 API Versioning

```
Current: v1 (all endpoints)
Strategy: URI versioning (/api/v1/, /api/v2/)

Deprecation policy:
  - Announce deprecation 6 months before removal
  - Deprecated endpoints return: Deprecation: true header
  - Sunset header: Sunset: {date}
  - v1 maintained for minimum 12 months after v2 launch
```

---

## 4. Messaging Infrastructure Deployment

### 4.1 Service Deployment Map

```
Phase 1 (MVP):
  api-server          ← monolith (all modules)
  ws-server           ← WebSocket gateway
  mail-worker         ← outbound mail queue processor
  postgres            ← primary DB
  redis               ← cache + pub/sub + queues
  postfix             ← SMTP relay
  dovecot             ← IMAP/POP3

Phase 2 (Scale):
  api-server          ← split: auth-service, mail-service, chat-service
  ws-server           ← 2+ instances (Redis adapter)
  video-server        ← self-hosted WebRTC SFU (technology TBD)
  elasticsearch       ← mail/drive search
  postgres-replica    ← read replica

Phase 3 (Enterprise):
  notification-service ← dedicated
  search-service       ← dedicated
  provisioning-worker  ← dedicated
  billing-service      ← dedicated
  cdn                  ← static assets + file delivery

Phase 5 (Messaging Infrastructure Platform):
  messaging-platform   ← channel-agnostic messaging API
  messaging-worker     ← per-channel connector workers (SMS, WhatsApp, RCS, ...)
```

### 4.2 Environment Variables (Messaging Infrastructure)

```
# SMS Connector (MSG91 — primary)
MSG91_AUTH_KEY=
MSG91_SENDER_ID=SSGZNE
MSG91_DLT_ENTITY_ID=

# SMS Connector (Twilio — fallback)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# WhatsApp Connector (Meta Cloud API)
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=
META_WEBHOOK_VERIFY_TOKEN=
META_APP_SECRET=

# VAPID (Browser Push — separate from Messaging Platform)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:push@ssgzone.in
```

---

## 5. Messaging Infrastructure Summary

### 5.1 What's Built in Each Phase

| Feature | Phase |
|---------|-------|
| Internal chat (DM + channels) | 1 |
| Chat file sharing | 1 |
| Typing indicators, reactions | 1 |
| Chat search (PostgreSQL FTS) | 1 |
| Chat retention policies | 2 |
| Chat moderation tools | 2 |
| eDiscovery | 2 |
| Chat archival (Glacier) | 3 |
| GDPR data export/erasure | 2 |
| Messaging Infrastructure Platform (core) | 5.0 |
| SMS connector (MSG91 / Twilio) | 5.0 |
| WhatsApp Business connector (Meta) | 5.1 |
| RCS connector (Google) | 5.2 |
| Additional channel connectors (Voice, etc.) | 6+ |
| Cross-platform federation (XMPP/Matrix) | 6+ |

### 5.2 What Is Explicitly Out of Scope

| Feature | Reason |
|---------|--------|
| Consumer WhatsApp (personal accounts) | Meta policy: Business API only |
| SMS to non-opted-in recipients | TRAI/GDPR compliance |
| Cross-tenant chat | Security isolation requirement |
| Public chat rooms | Not a B2B use case |
| End-to-end encryption (E2EE) | Phase 4+ (significant complexity) |
| WhatsApp as a core product module | It is a channel connector, not a platform feature |
| Dependency on any single channel provider | Platform is provider-agnostic by design |

---

*Part 03 of 03 — D8 Messaging Infrastructure Blueprint Complete*
