# D6 — Communication Engine Blueprint | Part 02: Video, Push Notifications & Delivery Guarantees

## 1. Video Meeting Infrastructure

### 1.1 Technology Decision

| Option | Verdict | Reason |
|--------|---------|--------|
| Jitsi public iframe | ❌ Rejected | No control, data leaves platform, no auth |
| Jitsi self-hosted | ⚠ Phase 1 fallback | Complex ops, Java stack |
| LiveKit | ✅ Strong candidate | Go-based, WebRTC SFU, self-hostable, excellent SDK |
| mediasoup | ✅ Strong candidate | Lower-level, more control, Node.js native |
| Janus | ⚠ Candidate | C-based, mature, higher ops complexity |

**Decision: Self-hosted WebRTC SFU stack (technology to be finalized; e.g. LiveKit, mediasoup, or Janus).** Final selection will be made in Phase 2 based on load testing, SDK maturity, and operational complexity evaluation. All API contracts and data models are designed to be WebRTC-stack-agnostic.

---

### 1.2 WebRTC SFU Architecture

```
Browser (WebRTC)
  │
  ▼
[Self-hosted WebRTC SFU Server]
  │  Selective Forwarding Unit:
  │  receives all participant streams,
  │  forwards only relevant streams to each participant
  │
  ├── Room management API (HTTP)
  ├── Access token generation (JWT)
  └── Recording (optional, via Egress/Composite)

SFU Server ↔ API Server:
  - API Server creates rooms via SFU Admin API
  - API Server generates participant tokens
  - SFU webhooks → API Server (room events)
```

---

### 1.3 Meeting Lifecycle

```
1. Create Meeting
   POST /api/v1/video/meetings
   API Server:
     → POST {sfu_server}/rooms/create
       { name: meetingId, emptyTimeout: 300, maxParticipants: 100 }
     → Store: video_meetings table
     → Return: { meetingId, joinUrl, hostToken }

2. Join Meeting
   GET /api/v1/video/meetings/:id/token
   API Server:
     → Validate user is invited or meeting is open
     → Generate SFU access token (JWT):
       { roomName: meetingId, identity: userId, name: displayName,
         grants: { roomJoin, canPublish, canSubscribe } }
     → Return: { token, sfuUrl }
   Client:
     → Connect via WebRTC SDK to SFU

3. During Meeting
   All media: peer-to-peer via SFU (no API server involvement)
   Signaling: SFU handles internally

4. End Meeting
   Host calls: DELETE /api/v1/video/meetings/:id
   API Server:
     → POST {sfu_server}/rooms/delete
     → Update video_meetings.ended_at
     → Publish WS event: meeting.ended to all participants

5. SFU Webhooks → API Server
   POST /internal/video/webhook
   Events: room_started, room_finished, participant_joined, participant_left
   → Update video_meetings, video_participants tables
```

---

### 1.4 Meeting Roles & Permissions

| Role | Can Publish | Can Subscribe | Can Mute Others | Can Remove |
|------|-------------|---------------|-----------------|------------|
| Host | ✅ | ✅ | ✅ | ✅ |
| Co-host | ✅ | ✅ | ✅ | ❌ |
| Participant | ✅ | ✅ | ❌ | ❌ |
| Viewer | ❌ | ✅ | ❌ | ❌ |

Roles encoded in SFU access token grants.

---

### 1.5 Screen Sharing

Handled natively by the WebRTC SFU SDK (supported by LiveKit, mediasoup, and Janus):
- Client calls screen share API on the chosen SDK
- Browser prompts for screen/window/tab selection
- Published as a separate video track
- Other participants auto-subscribe

---

### 1.6 Recording (Phase 3)

SFU Egress / Composite recording service (available in LiveKit and mediasoup-based stacks):
```
POST /api/v1/video/meetings/:id/recording/start
  → SFU: StartCompositeRecording
  → Output: S3 bucket (mp4)
  → Store: video_recordings table

POST /api/v1/video/meetings/:id/recording/stop
  → SFU: StopRecording
  → Update: video_recordings.s3_key, duration
```

---

## 2. Push Notification System

### 2.1 Notification Channels

| Channel | Technology | Use Case |
|---------|------------|----------|
| In-app (WebSocket) | Custom WS event | Real-time, user is online |
| Browser Push | Web Push API (VAPID) | User offline, browser open |
| Email digest | SMTP | User offline, configurable frequency |
| Mobile Push | FCM (Android) / APNs (iOS) | Phase 3, mobile app |

---

### 2.2 Notification Pipeline

```
Event source (mail delivery, chat message, calendar reminder, etc.)
  │
  ▼
[Notification Service — API Server module]
  │
  ├── 1. Create notification record (notifications table)
  ├── 2. Check user preferences (notifications_preferences table)
  │       → per-channel, per-event-type toggles
  ├── 3. Check user presence (Redis)
  │
  ├── User is ONLINE:
  │     → Publish WS event: notification.new
  │     → Skip browser push (user already notified)
  │
  ├── User is OFFLINE / AWAY:
  │     → Queue: browser push job
  │     → Queue: email digest job (if preference enabled)
  │
  └── Always: store in notifications table (in-app bell)
```

---

### 2.3 Browser Push (Web Push API)

```
Registration flow:
  1. Client: request notification permission
  2. Client: subscribe to push service
     navigator.serviceWorker.ready
       .then(sw => sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC }))
  3. Client: POST /api/v1/notifications/push/subscribe
     { endpoint, keys: { p256dh, auth } }
  4. API Server: store in push_subscriptions table

Delivery flow:
  1. Notification worker dequeues push job
  2. Fetch subscription from DB
  3. Send via web-push library:
     webpush.sendNotification(subscription, JSON.stringify({
       title, body, icon, badge, data: { actionUrl }
     }))
  4. On 410 Gone → delete subscription (user unsubscribed)
  5. On 429 → retry with backoff

Service Worker (client-side):
  self.addEventListener('push', event => {
    const { title, body, icon, data } = event.data.json();
    event.waitUntil(
      self.registration.showNotification(title, { body, icon, data })
    );
  });
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    clients.openWindow(event.notification.data.actionUrl);
  });
```

---

### 2.4 Email Digest

```
Digest schedule (user-configurable):
  - Immediate (each event)
  - Every 15 min
  - Hourly
  - Daily summary (8 AM user timezone)

Digest worker (cron):
  Every 15 min:
    1. Query: notifications WHERE digest_sent=false AND user preference=15min
    2. Group by user
    3. Render digest email template
    4. Queue to mail:outbound:transactional
    5. Mark notifications digest_sent=true

Daily digest:
  Cron: 0 8 * * * (per user timezone)
  Same flow, groups all unsent notifications from past 24h
```

---

### 2.5 Notification Types & Templates

| Type | Title Template | Body Template | Action URL |
|------|---------------|---------------|------------|
| `mail.new` | New email from {from} | {subject} | /mail/inbox/{messageId} |
| `mail.reply` | {from} replied | Re: {subject} | /mail/inbox/{messageId} |
| `chat.message` | {sender} in {channel} | {preview} | /chat/{conversationId} |
| `chat.mention` | {sender} mentioned you | {preview} | /chat/{conversationId} |
| `calendar.reminder` | Reminder: {title} | Starts in {time} | /calendar/{eventId} |
| `calendar.invite` | Meeting invite: {title} | From {organizer} | /calendar/{eventId} |
| `video.started` | Meeting started | {title} | /video/{meetingId} |
| `drive.shared` | {sharer} shared a file | {filename} | /drive/{fileId} |
| `system.alert` | System Notice | {message} | — |

---

## 3. Delivery Guarantees

### 3.1 Mail Delivery Guarantees

| Scenario | Behavior |
|----------|----------|
| Recipient server down | Retry for 72h with exponential backoff |
| Soft bounce (mailbox full) | Retry 3x over 24h, then notify sender |
| Hard bounce (invalid address) | Immediate failure, notify sender, log bounce |
| DKIM failure | Log, attempt delivery without DKIM, alert admin |
| Rate limit exceeded | Queue, deliver when rate window resets |
| Spam classification | Deliver to spam folder, do not reject |

### 3.2 WebSocket Delivery Guarantees

```
Problem: WS is not reliable — connections drop, messages can be lost.

Solution: Redis Streams as event log

On publish:
  1. Write event to Redis Stream: XADD events:{userId} * type payload
  2. Stream retention: 60 seconds (MAXLEN ~1000)
  3. Also publish to Redis pub/sub for live delivery

On reconnect:
  1. Client sends: { lastEventId: "1234567890-0" }
  2. Server: XREAD COUNT 100 STREAMS events:{userId} lastEventId
  3. Replay missed events to client
  4. Client deduplicates by eventId

Guarantee level: at-least-once delivery within 60s window
Beyond 60s: client must do full state refresh (HTTP API)
```

### 3.3 Chat Message Guarantees

```
Client sends message:
  1. Assign client-side tempId (UUID)
  2. Show message optimistically (status: 'sending')
  3. POST /api/v1/chat/messages { tempId, content, ... }
  4. Server: persist to DB, publish WS event
  5. Server response: { messageId, tempId, timestamp }
  6. Client: replace tempId with messageId, status: 'sent'

On failure:
  - Show error state on message bubble
  - [Retry] button → resend with same tempId
  - Server: idempotent on tempId (no duplicate insert)

Read receipts:
  - Client sends: POST /api/v1/chat/conversations/:id/read
  - Server: update last_read_at, publish chat.read_receipt WS event
  - Other participants update their UI
```

---

## 4. Security

### 4.1 Mail Security

| Layer | Mechanism |
|-------|-----------|
| Inbound spam | Rspamd scoring + SpamHaus blocklist |
| Inbound virus | ClamAV via Rspamd |
| Outbound auth | SMTP AUTH (API-issued credentials) |
| Outbound signing | DKIM (RSA-2048, per-tenant key) |
| Sender policy | SPF (include:spf.ssgzone.in) |
| DMARC | p=quarantine, reports to dmarc@ssgzone.in |
| Transport | TLS 1.2+ required (STARTTLS / SMTPS) |
| Storage | Maildir encrypted at rest (S3 SSE-AES256) |

### 4.2 WebSocket Security

| Concern | Mitigation |
|---------|------------|
| Auth | JWT validated on connect, re-validated on reconnect |
| Session revocation | Redis session blacklist, checked on each WS message |
| Room isolation | Users can only join rooms they are authorized for |
| Rate limiting | Max 100 WS messages/min per connection |
| Payload size | Max 64KB per WS message |
| Origin check | CORS origin whitelist on WS upgrade |

### 4.3 Video Security

| Concern | Mitigation |
|---------|------------|
| Room access | SFU access token (JWT) with room-specific grant |
| Token expiry | JWT TTL: 4 hours (meeting max duration) |
| Recording consent | Banner shown to all participants when recording starts |
| Data residency | SFU server deployed in same region as tenant data |

---

## 5. Scalability & Capacity

### 5.1 Mail Throughput Targets

| Metric | Target |
|--------|--------|
| Inbound messages/sec | 500 |
| Outbound messages/sec | 200 |
| Queue depth (normal) | < 1,000 |
| Queue depth (peak) | < 50,000 |
| Delivery latency (p95) | < 5 seconds |
| Storage per mailbox | 10 GB default, configurable |

### 5.2 WebSocket Capacity

| Metric | Target |
|--------|--------|
| Concurrent WS connections | 50,000 per WS server instance |
| WS server instances | 2 (Phase 1), auto-scale to 10 |
| Event fan-out latency (p95) | < 100ms |
| Redis pub/sub throughput | 100,000 events/sec |

### 5.3 Video Capacity

| Metric | Target |
|--------|--------|
| Concurrent meetings | 500 |
| Participants per meeting | 100 |
| Bandwidth per participant | 1.5 Mbps (720p) |
| SFU server instances | 2 (Phase 2), scale per load |

---

## 6. Monitoring & Alerting

### 6.1 Key Metrics

| Metric | Alert Threshold |
|--------|----------------|
| Mail queue depth | > 10,000 → warning, > 50,000 → critical |
| Outbound delivery rate | < 95% in 1h → warning |
| Bounce rate | > 5% in 1h → warning |
| Spam score avg | > 3 → review |
| WS connection errors | > 1% → warning |
| WS event latency p95 | > 500ms → warning |
| Push delivery failure | > 10% → warning |
| Video SFU CPU | > 80% → scale out |

### 6.2 Logging

All communication events logged to structured JSON:
```json
{
  "timestamp": "ISO8601",
  "service": "mail-worker | ws-server | notification-service",
  "level": "info | warn | error",
  "event": "mail.delivered | ws.connect | push.sent",
  "userId": "uuid",
  "tenantId": "uuid",
  "messageId": "uuid",
  "durationMs": 42,
  "meta": {}
}
```

Log retention: 30 days hot (Elasticsearch), 1 year cold (S3).

---

*Part 02 of 02 — D6 Communication Engine Blueprint Complete*
