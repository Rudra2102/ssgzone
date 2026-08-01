# SSGzone Communication Platform
# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# D1 — PART 3 OF 6
## Internal Chat & Presence PRD

---

# MODULE 4 — INTERNAL CHAT

---

## 4.1 Objective

Provide a real-time internal messaging system for teams within an organization. Chat must support channels (group conversations), direct messages (one-to-one), file sharing, reactions, threads, and mentions. It must be secure, scalable across multiple servers, and integrated with the presence system.

---

## 4.2 User Stories

### End User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| CHAT-U01 | End User | Send a text message in a channel | I can communicate with my team |
| CHAT-U02 | End User | Send a direct message to a colleague | I can have a private conversation |
| CHAT-U03 | End User | Create a new channel | I can organize team conversations by topic |
| CHAT-U04 | End User | Add members to a channel | I can include the right people |
| CHAT-U05 | End User | React to a message with an emoji | I can acknowledge messages without replying |
| CHAT-U06 | End User | Reply to a message in a thread | I can keep conversations organized |
| CHAT-U07 | End User | Mention a colleague with @username | I can get someone's attention |
| CHAT-U08 | End User | Share a file in a chat | I can send documents and images |
| CHAT-U09 | End User | Search message history | I can find past conversations |
| CHAT-U10 | End User | Pin an important message | The team can find key information easily |
| CHAT-U11 | End User | Edit a message I sent | I can correct mistakes |
| CHAT-U12 | End User | Delete a message I sent | I can remove something I sent by mistake |
| CHAT-U13 | End User | See read receipts | I know if my message was seen |
| CHAT-U14 | End User | See typing indicators | I know when someone is composing a reply |
| CHAT-U15 | End User | Mute a channel | I can stop notifications from a busy channel |
| CHAT-U16 | End User | Leave a channel | I can remove myself from irrelevant channels |
| CHAT-U17 | End User | See who is online in my organization | I know who is available to chat |

### Tenant Admin Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| CHAT-T01 | Tenant Admin | Create announcement channels (read-only for members) | I can broadcast to the whole organization |
| CHAT-T02 | Tenant Admin | Archive a channel | Old channels are preserved but not active |
| CHAT-T03 | Tenant Admin | Delete a channel and its history | I can remove inappropriate channels |
| CHAT-T04 | Tenant Admin | Configure message retention policy | Messages are deleted after a defined period |
| CHAT-T05 | Tenant Admin | View all channels in the organization | I have visibility into team communications |

---

## 4.3 Acceptance Criteria

### Messaging

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-CHAT-01 | Message is delivered to all channel members within 500ms | Send message, measure delivery time to second user |
| AC-CHAT-02 | Direct message is delivered to recipient within 500ms | Send DM, measure delivery time |
| AC-CHAT-03 | Message persists after page refresh | Send message, refresh page, verify message still visible |
| AC-CHAT-04 | User can edit a sent message and edit history is visible | Edit message, verify "(edited)" label and history |
| AC-CHAT-05 | User can delete a sent message | Delete message, verify it shows "Message deleted" |
| AC-CHAT-06 | Emoji reaction appears on message for all channel members | React to message, verify reaction visible to others |
| AC-CHAT-07 | Thread reply is nested under the parent message | Reply in thread, verify nesting |
| AC-CHAT-08 | @mention triggers a notification for the mentioned user | Mention user, verify they receive notification |

### Security

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-CHAT-09 | Unauthenticated WebSocket connection is rejected | Connect without JWT, verify rejection |
| AC-CHAT-10 | User from Tenant A cannot join a channel belonging to Tenant B | Attempt cross-tenant join with valid JWT, verify rejection |
| AC-CHAT-11 | User can only see channels they are a member of | Verify channel list only shows member channels |

### Files & Search

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-CHAT-12 | User can share a file up to 50MB in chat | Upload 50MB file, verify delivery |
| AC-CHAT-13 | Image files show a preview in chat | Share image, verify inline preview |
| AC-CHAT-14 | Search returns results from message history within 2 seconds | Search for known message content |
| AC-CHAT-15 | Pinned messages are accessible from a dedicated pinned messages view | Pin message, open pinned view, verify presence |

### Scalability

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-CHAT-16 | Presence status is correct when API runs on 2+ server instances | Run 2 API instances, verify presence consistency |
| AC-CHAT-17 | 1,000 concurrent WebSocket connections are handled without degradation | Load test with 1,000 connections |

---

## 4.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Message delivery latency (p99) | < 500ms | WebSocket timing logs |
| WebSocket connection success rate | > 99.9% | Connection error logs |
| Daily active users in chat | > 70% of provisioned users | Usage analytics |
| Messages per user per day | > 10 | Usage analytics |
| Search response time | < 2 seconds | Performance test |

---

## 4.5 Business Rules

| ID | Rule |
|----|------|
| BR-CHAT-01 | Every WebSocket connection must present a valid JWT — no anonymous connections |
| BR-CHAT-02 | A user can only access channels within their own tenant |
| BR-CHAT-03 | A channel name must be unique within a tenant |
| BR-CHAT-04 | A user can edit their own messages within 24 hours of sending |
| BR-CHAT-05 | A user can delete their own messages at any time — Tenant Admin can delete any message |
| BR-CHAT-06 | File attachments in chat are stored in MinIO with tenant isolation |
| BR-CHAT-07 | Maximum file size per chat attachment is 50MB |
| BR-CHAT-08 | A channel can have a maximum of 1,000 members |
| BR-CHAT-09 | Direct message conversations are private — only the two participants can see them |
| BR-CHAT-10 | Announcement channels can only be posted to by Tenant Admin or designated users |
| BR-CHAT-11 | Message retention policy, when set, permanently deletes messages — this cannot be undone |
| BR-CHAT-12 | Presence data is stored in Redis — not in the database |

---

## 4.6 Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-CHAT-01 | User sends a message and immediately loses internet connection | Message is queued locally and sent when connection is restored |
| EC-CHAT-02 | User is mentioned in a channel they have muted | Notification is still delivered for direct mentions |
| EC-CHAT-03 | User tries to share a file that exceeds 50MB | Upload is rejected with a clear error message before upload starts |
| EC-CHAT-04 | User is removed from a channel while they have it open | User sees a message "You have been removed from this channel" |
| EC-CHAT-05 | Channel is deleted while a user has it open | User sees a message "This channel has been deleted" |
| EC-CHAT-06 | Two users send a message at exactly the same time | Both messages are delivered — ordering is by server timestamp |
| EC-CHAT-07 | User sends a message with 1,000 emoji reactions already on it | 1,001st reaction is accepted — no hard limit on reactions |
| EC-CHAT-08 | User's account is deactivated while they are in a chat | WebSocket connection is terminated, user cannot reconnect |
| EC-CHAT-09 | Message contains a URL | URL is rendered as a clickable link with a preview card |
| EC-CHAT-10 | User searches for a message in a channel they have since left | Search does not return results from channels the user is not a member of |
| EC-CHAT-11 | Tenant has 10,000 users — all online simultaneously | Redis presence handles load — no in-memory fallback |
| EC-CHAT-12 | User sends an empty message | Empty message is rejected — send button is disabled |

---

---

# MODULE 5 — PRESENCE SYSTEM

---

## 5.1 Objective

Provide a real-time presence system that shows the online/offline/busy status of every user across all modules — chat, directory, contacts, and video. Presence must be accurate, scalable across multiple server instances, and respect user privacy preferences.

---

## 5.2 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| PRE-U01 | End User | See which colleagues are currently online | I know who is available to chat or call |
| PRE-U02 | End User | Set my status to Online, Away, Busy, or Do Not Disturb | I can communicate my availability |
| PRE-U03 | End User | Set a custom status message | I can give context about my availability |
| PRE-U04 | End User | Have my status automatically set to Away after 10 minutes of inactivity | My status is accurate without manual updates |
| PRE-U05 | End User | Hide my online status from colleagues | I can work without being disturbed |
| PRE-U06 | End User | See presence status in the chat user list | I can see who is available before messaging |
| PRE-U07 | End User | See presence status in the organization directory | I can see availability across the org |

---

## 5.3 Acceptance Criteria

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-PRE-01 | User's status changes to Online within 2 seconds of login | Log in, check status in another browser |
| AC-PRE-02 | User's status changes to Offline within 30 seconds of closing the browser | Close browser, check status after 30 seconds |
| AC-PRE-03 | User's status changes to Away after 10 minutes of no mouse/keyboard activity | Leave browser idle for 10 minutes, verify status change |
| AC-PRE-04 | Status set to Do Not Disturb suppresses all notifications | Set DND, send message, verify no notification |
| AC-PRE-05 | Presence is consistent across 2 server instances | Run 2 API instances, verify same status shown from both |
| AC-PRE-06 | Custom status message is visible in chat and directory | Set custom message, verify in both locations |
| AC-PRE-07 | User with hidden status shows as Offline to others | Enable privacy setting, verify others see Offline |

---

## 5.4 Business Rules

| ID | Rule |
|----|------|
| BR-PRE-01 | Presence data is stored exclusively in Redis — never in PostgreSQL |
| BR-PRE-02 | Presence TTL in Redis is 60 seconds — client must heartbeat every 30 seconds |
| BR-PRE-03 | If a user has multiple browser tabs open, they are Online as long as at least one tab is active |
| BR-PRE-04 | Do Not Disturb status suppresses all notifications except direct @mentions |
| BR-PRE-05 | A user can only see presence of users within their own tenant |
| BR-PRE-06 | Presence status is visible in: chat user list, directory, contact cards, video meeting participant list |

---

## 5.5 Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-PRE-01 | User has 5 browser tabs open and closes 4 | Status remains Online — one tab still active |
| EC-PRE-02 | User's internet drops for 45 seconds then reconnects | Status goes Offline after 60 seconds, returns Online on reconnect |
| EC-PRE-03 | Redis goes down temporarily | Presence shows as Unknown for all users — graceful degradation |
| EC-PRE-04 | User sets status to Busy and then their session expires | Status is cleared from Redis after TTL — shows Offline |
| EC-PRE-05 | 10,000 users are online simultaneously | Redis handles load — no database queries for presence |

---

*End of D1 Part 3 of 6*
*Next: PRD_PART_04.md — Video Meetings + Shared Drive*
