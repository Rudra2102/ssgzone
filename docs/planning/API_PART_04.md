# SSGzone Communication Platform
# API BLUEPRINT
# D4 — PART 4 OF 5
## Chat API, Video API & Drive API

---

# SECTION 9 — CHAT API

**Base path**: `/api/v1/chat`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 300 requests/minute
**Real-time**: WebSocket at `wss://api.ssgzone.in/socket.io`

---

## 9.1 WebSocket Connection

### Connection

```
wss://api.ssgzone.in/socket.io?token=<access_token>
```

**Auth**: JWT passed as query parameter on connection.
Server validates token before accepting connection.
Invalid or missing token → connection rejected with `401`.

---

### WebSocket Events (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `join_channel` | `{ channel_id }` | Join a channel room |
| `leave_channel` | `{ channel_id }` | Leave a channel room |
| `send_message` | `{ channel_id, content, parent_id? }` | Send a message |
| `typing_start` | `{ channel_id }` | User started typing |
| `typing_stop` | `{ channel_id }` | User stopped typing |
| `mark_read` | `{ channel_id, message_id }` | Mark messages as read |
| `presence_update` | `{ status, custom_message? }` | Update presence status |
| `heartbeat` | `{}` | Keep presence alive (every 30s) |

---

### WebSocket Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | Message object | New message in a joined channel |
| `message_updated` | `{ message_id, content, is_edited }` | Message was edited |
| `message_deleted` | `{ message_id }` | Message was deleted |
| `reaction_added` | `{ message_id, emoji, user_id, count }` | Reaction added |
| `reaction_removed` | `{ message_id, emoji, user_id, count }` | Reaction removed |
| `user_typing` | `{ channel_id, user_id, user_name }` | Someone is typing |
| `user_stopped_typing` | `{ channel_id, user_id }` | Stopped typing |
| `presence_changed` | `{ user_id, status }` | User presence changed |
| `channel_updated` | Channel object | Channel was modified |
| `member_added` | `{ channel_id, user }` | New member joined |
| `member_removed` | `{ channel_id, user_id }` | Member removed |
| `error` | `{ code, message }` | Error event |

---

## 9.2 Channels

### GET /api/v1/chat/channels

List all channels the user is a member of.

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "general",
      "type": "public | private | announcement | direct",
      "description": "string | null",
      "is_muted": false,
      "unread_count": 5,
      "last_message": {
        "content": "string",
        "sender_name": "string",
        "sent_at": "ISO8601"
      },
      "member_count": 24
    }
  ]
}
```

---

### POST /api/v1/chat/channels

Create a channel.

**Request Body**:
```json
{
  "name": "string",
  "description": "string | null",
  "type": "public | private",
  "member_ids": ["uuid"]
}
```

**Response** `201`: Created channel object

**Error**: `409` if channel name already exists in this tenant

---

### GET /api/v1/chat/channels/:id

Get channel details.

**Response** `200`: Full channel object

---

### PUT /api/v1/chat/channels/:id

Update channel name or description.

**Request Body**: `{ "name": "string", "description": "string" }`

**Response** `200`: Updated channel object

---

### PATCH /api/v1/chat/channels/:id/mute

Mute or unmute a channel.

**Request Body**: `{ "is_muted": true }`

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/chat/channels/:id/leave

Leave a channel.

**Response** `204`

---

### PATCH /api/v1/chat/channels/:id/archive

Archive a channel (Tenant Admin only).

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/chat/channels/:id

Delete a channel and all messages (Tenant Admin only).

**Response** `204`

---

## 9.3 Channel Members

### GET /api/v1/chat/channels/:id/members

List channel members.

**Response** `200`: Array of member objects with presence status

---

### POST /api/v1/chat/channels/:id/members

Add members to a channel.

**Request Body**: `{ "user_ids": ["uuid"] }`

**Response** `200`: `{ "success": true, "data": { "added": 3 } }`

---

### DELETE /api/v1/chat/channels/:id/members/:user_id

Remove a member from a channel.

**Response** `204`

---

## 9.4 Messages

### GET /api/v1/chat/channels/:id/messages

List messages in a channel (paginated, newest first).

**Query Parameters**: `page`, `per_page`, `before_id` (cursor-based)

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "channel_id": "uuid",
      "sender": {
        "id": "uuid",
        "name": "string",
        "avatar_url": "string | null"
      },
      "content": "string",
      "content_type": "text | file | system",
      "is_edited": false,
      "is_deleted": false,
      "is_pinned": false,
      "reply_count": 0,
      "reactions": [ { "emoji": "thumbsup", "count": 3, "user_ids": [] } ],
      "attachments": [],
      "parent_id": null,
      "created_at": "ISO8601"
    }
  ],
  "meta": { "has_more": true, "oldest_id": "uuid" }
}
```

---

### GET /api/v1/chat/channels/:id/messages/:message_id/thread

Get thread replies for a message.

**Response** `200`: Array of reply message objects

---

### PUT /api/v1/chat/messages/:id

Edit a message.

**Request Body**: `{ "content": "string" }`

**Response** `200`: Updated message object

**Error**: `403` if message is older than 24 hours

---

### DELETE /api/v1/chat/messages/:id

Delete a message (soft delete — shows "Message deleted").

**Response** `204`

---

### POST /api/v1/chat/messages/:id/reactions

Add a reaction to a message.

**Request Body**: `{ "emoji": "thumbsup" }`

**Response** `201`: `{ "success": true }`

---

### DELETE /api/v1/chat/messages/:id/reactions/:emoji

Remove a reaction.

**Response** `204`

---

### GET /api/v1/chat/channels/:id/pinned

Get all pinned messages in a channel.

**Response** `200`: Array of pinned message objects

---

### PATCH /api/v1/chat/messages/:id/pin

Pin or unpin a message.

**Request Body**: `{ "is_pinned": true }`

**Response** `200`: `{ "success": true }`

---

## 9.5 Direct Messages

### GET /api/v1/chat/dm

List all DM conversations.

**Response** `200`: Array of DM thread objects with last message

---

### POST /api/v1/chat/dm

Start or get a DM conversation with a user.

**Request Body**: `{ "user_id": "uuid" }`

**Response** `200 | 201`: DM thread object with channel_id

---

## 9.6 Presence

### GET /api/v1/chat/presence

Get presence status for a list of users.

**Query Parameters**: `user_ids=uuid,uuid,uuid`

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "uuid1": { "status": "online", "custom_message": "In a meeting" },
    "uuid2": { "status": "offline" }
  }
}
```

---

### PUT /api/v1/chat/presence

Update own presence status.

**Request Body**:
```json
{
  "status": "online | away | busy | dnd | offline",
  "custom_message": "string | null",
  "expires_in_minutes": 60
}
```

**Response** `200`: `{ "success": true }`

---

---

# SECTION 10 — VIDEO API

**Base path**: `/api/v1/video`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 60 requests/minute

---

### GET /api/v1/video/rooms

List video rooms for this tenant.

**Query Parameters**: `status=waiting|active|ended`, `page`, `per_page`

**Response** `200`: Paginated room list

---

### POST /api/v1/video/rooms

Create a new video room.

**Request Body**:
```json
{
  "name": "string | null",
  "allow_guests": false,
  "max_participants": 50
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "room_code": "abc-def-ghi",
    "join_url": "https://meet.ssgzone.in/abc-def-ghi",
    "join_link_expires_at": "ISO8601"
  }
}
```

---

### GET /api/v1/video/rooms/:id

Get room details.

**Response** `200`: Full room object with participant list

---

### PATCH /api/v1/video/rooms/:id/lock

Lock or unlock a room.

**Request Body**: `{ "is_locked": true }`

**Response** `200`: `{ "success": true }`

---

### POST /api/v1/video/rooms/:id/end

End a meeting for all participants (host only).

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/video/rooms/:id/participants/:user_id

Remove a participant from a meeting (host only).

**Response** `204`

---

### GET /api/v1/video/rooms/:id/token

Get a join token for the video server.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "token": "video_server_jwt",
    "server_url": "wss://video.ssgzone.in",
    "room_id": "server_room_id"
  }
}
```

---

---

# SECTION 11 — DRIVE API

**Base path**: `/api/v1/drive`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 300 requests/minute

---

## 11.1 Items (Files & Folders)

### GET /api/v1/drive/items

List items in a folder.

**Query Parameters**:

| Parameter | Description |
|-----------|-------------|
| parent_id | Folder ID (null = root) |
| type | file \| folder \| all |
| sort | name \| modified \| size |
| order | asc \| desc |
| page | Page number |
| per_page | Items per page |

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "type": "file | folder",
      "content_type": "application/pdf | null",
      "size_bytes": 102400,
      "is_starred": false,
      "shared": false,
      "owner": { "id": "uuid", "name": "string" },
      "modified_at": "ISO8601",
      "thumbnail_url": "string | null"
    }
  ],
  "meta": { "page": 1, "per_page": 50, "total": 120 }
}
```

---

### POST /api/v1/drive/items/folder

Create a new folder.

**Request Body**:
```json
{
  "name": "string",
  "parent_id": "uuid | null"
}
```

**Response** `201`: Created folder object

**Error**: `409` if folder name already exists in parent

---

### GET /api/v1/drive/items/:id

Get item details.

**Response** `200`: Full item object with sharing info and version count

---

### PATCH /api/v1/drive/items/:id

Rename or move an item.

**Request Body**:
```json
{
  "name": "string",
  "parent_id": "uuid | null"
}
```

**Response** `200`: Updated item object

---

### DELETE /api/v1/drive/items/:id

Move item to Trash.

**Response** `204`

---

### POST /api/v1/drive/items/:id/restore

Restore item from Trash.

**Response** `200`: Restored item object

---

### DELETE /api/v1/drive/items/:id/permanent

Permanently delete item.

**Response** `204`

---

### PATCH /api/v1/drive/items/:id/star

Star or unstar an item.

**Request Body**: `{ "is_starred": true }`

**Response** `200`: `{ "success": true }`

---

## 11.2 File Upload & Download

### POST /api/v1/drive/upload

Upload a file.

**Content-Type**: `multipart/form-data`

**Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | File to upload (max 500MB) |
| parent_id | string | No | Parent folder UUID |
| name | string | No | Override filename |

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "size_bytes": 102400,
    "content_type": "string",
    "version_number": 1
  }
}
```

**Error**: `422` if storage quota would be exceeded
**Error**: `422` if file is flagged by virus scanner

---

### POST /api/v1/drive/upload/version/:id

Upload a new version of an existing file.

**Content-Type**: `multipart/form-data`

**Response** `201`: New version object

---

### GET /api/v1/drive/download/:id

Download a file.

**Response**: File download with correct Content-Type and Content-Disposition headers

---

### GET /api/v1/drive/preview/:id

Get a preview URL for a file.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "preview_url": "https://...",
    "preview_type": "pdf | image | text | unsupported",
    "expires_at": "ISO8601"
  }
}
```

---

## 11.3 Versions

### GET /api/v1/drive/items/:id/versions

List version history for a file.

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "version_number": 3,
      "size_bytes": 102400,
      "uploaded_by": { "id": "uuid", "name": "string" },
      "created_at": "ISO8601"
    }
  ]
}
```

---

### POST /api/v1/drive/items/:id/versions/:version_id/restore

Restore a previous version.

**Response** `200`: Updated item object with new current version

---

## 11.4 Sharing

### GET /api/v1/drive/items/:id/shares

List sharing permissions for an item.

**Response** `200`: Array of share objects

---

### POST /api/v1/drive/items/:id/shares

Share an item with users or generate a link.

**Request Body**:
```json
{
  "user_ids": ["uuid"],
  "permission": "view | edit",
  "generate_link": false,
  "link_expires_in_days": 7
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "shares": [],
    "share_link": "https://... | null"
  }
}
```

---

### DELETE /api/v1/drive/items/:id/shares/:share_id

Remove a share.

**Response** `204`

---

## 11.5 Special Views

### GET /api/v1/drive/shared-with-me

List items shared with the authenticated user.

**Response** `200`: Paginated item list

---

### GET /api/v1/drive/recent

List recently accessed items.

**Response** `200`: Array of recent items (max 20)

---

### GET /api/v1/drive/starred

List starred items.

**Response** `200`: Paginated starred items

---

### GET /api/v1/drive/trash

List items in Trash.

**Response** `200`: Paginated trash items

---

### DELETE /api/v1/drive/trash

Empty the Trash (permanently delete all trashed items).

**Response** `204`

---

### GET /api/v1/drive/storage

Get storage usage for the authenticated user.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "used_bytes": 5368709120,
    "quota_bytes": 10737418240,
    "used_gb": 5.0,
    "quota_gb": 10.0,
    "percentage_used": 50.0
  }
}
```

---

*End of D4 Part 4 of 5*
*Next: API_PART_05.md — Notifications API, Search API, Integration API, Webhooks*
