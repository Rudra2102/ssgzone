# SSGzone Communication Platform
# API BLUEPRINT
# D4 — PART 3 OF 5
## Mail API, Calendar API & Contacts API

---

# SECTION 6 — MAIL API

**Base path**: `/api/v1/mail`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 300 requests/minute

---

## 6.1 Folders

### GET /api/v1/mail/folders

List all folders for the authenticated user.

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Inbox",
      "type": "system",
      "system_type": "inbox",
      "unread_count": 12,
      "total_count": 450,
      "parent_id": null
    }
  ]
}
```

---

### POST /api/v1/mail/folders

Create a custom folder.

**Request Body**:
```json
{
  "name": "string",
  "parent_id": "uuid | null"
}
```

**Response** `201`: Created folder object

**Error**: `409` if folder name already exists at this level

---

### PUT /api/v1/mail/folders/:id

Rename a folder.

**Request Body**: `{ "name": "string" }`

**Response** `200`: Updated folder object

---

### DELETE /api/v1/mail/folders/:id

Delete a custom folder. Emails inside are moved to Trash.

**Response** `204`

**Error**: `422` if trying to delete a system folder

---

## 6.2 Messages

### GET /api/v1/mail/messages

List messages in a folder.

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| folder_id | uuid | Required |
| page | integer | Default 1 |
| per_page | integer | Default 20, max 100 |
| sort | string | received_at (default) |
| order | string | desc (default) |
| is_read | boolean | Filter by read status |
| is_starred | boolean | Filter by starred |
| has_attachment | boolean | Filter by attachment |
| search | string | Search in subject/from |

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "from_address": "string",
      "from_name": "string",
      "subject": "string",
      "preview": "First 150 chars of body...",
      "has_attachment": false,
      "attachment_count": 0,
      "is_read": false,
      "is_starred": false,
      "received_at": "ISO8601",
      "size_bytes": 2048
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 450 }
}
```

---

### GET /api/v1/mail/messages/:id

Get a single message with full body and attachments.

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "from_address": "string",
    "from_name": "string",
    "to_addresses": [ { "name": "string", "email": "string" } ],
    "cc_addresses": [],
    "bcc_addresses": [],
    "subject": "string",
    "body_html": "string",
    "body_text": "string",
    "attachments": [
      {
        "id": "uuid",
        "filename": "document.pdf",
        "content_type": "application/pdf",
        "size_bytes": 102400,
        "download_url": "https://..."
      }
    ],
    "is_read": true,
    "is_starred": false,
    "received_at": "ISO8601",
    "thread_id": "uuid"
  }
}
```

**Side Effect**: Marks message as read automatically.

---

### POST /api/v1/mail/messages/send

Send an email.

**Content-Type**: `multipart/form-data` (for attachments) or `application/json`

**Request Body**:
```json
{
  "to": [ { "name": "string", "email": "string" } ],
  "cc": [],
  "bcc": [],
  "subject": "string",
  "body_html": "string",
  "body_text": "string",
  "signature_id": "uuid | null",
  "reply_to_id": "uuid | null",
  "scheduled_at": "ISO8601 | null",
  "attachments": [],
  "drive_file_ids": []
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "message_id": "uuid",
    "status": "sent | scheduled",
    "scheduled_at": "ISO8601 | null"
  }
}
```

**Error**: `422` if storage quota exceeded
**Error**: `422` if attachment total exceeds 25MB

---

### POST /api/v1/mail/messages/draft

Save a draft.

**Request Body**: Same as send (without required validation)

**Response** `201`: Draft message object

---

### PUT /api/v1/mail/messages/draft/:id

Update a draft.

**Response** `200`: Updated draft object

---

### PATCH /api/v1/mail/messages/:id

Update message flags.

**Request Body**:
```json
{
  "is_read": true,
  "is_starred": false,
  "folder_id": "uuid"
}
```

**Response** `200`: Updated message object

---

### POST /api/v1/mail/messages/bulk

Bulk update multiple messages.

**Request Body**:
```json
{
  "message_ids": ["uuid", "uuid"],
  "action": "mark_read | mark_unread | star | unstar | move | delete | spam",
  "folder_id": "uuid"
}
```

**Response** `200`: `{ "success": true, "data": { "updated_count": 5 } }`

---

### DELETE /api/v1/mail/messages/:id

Move message to Trash (soft delete).

**Response** `204`

---

### DELETE /api/v1/mail/messages/:id/permanent

Permanently delete a message.

**Response** `204`

---

## 6.3 Attachments

### GET /api/v1/mail/attachments/:id/download

Download an attachment.

**Response**: File download with correct Content-Type header

---

## 6.4 Signatures

### GET /api/v1/mail/signatures

List all signatures for the authenticated user.

**Response** `200`: Array of signature objects

---

### POST /api/v1/mail/signatures

Create a signature.

**Request Body**:
```json
{
  "name": "string",
  "content": "HTML string",
  "is_default": false
}
```

**Response** `201`: Created signature object

---

### PUT /api/v1/mail/signatures/:id

Update a signature.

**Response** `200`: Updated signature object

---

### DELETE /api/v1/mail/signatures/:id

Delete a signature.

**Response** `204`

---

## 6.5 Rules

### GET /api/v1/mail/rules

List all mail rules.

**Response** `200`: Array of rule objects (ordered by sort_order)

---

### POST /api/v1/mail/rules

Create a mail rule.

**Request Body**:
```json
{
  "name": "Newsletter Filter",
  "conditions": [
    { "field": "from", "operator": "contains", "value": "newsletter" }
  ],
  "actions": [
    { "type": "move_to_folder", "folder_id": "uuid" }
  ],
  "stop_processing": false
}
```

**Response** `201`: Created rule object

---

### PUT /api/v1/mail/rules/:id

Update a rule.

**Response** `200`: Updated rule object

---

### PATCH /api/v1/mail/rules/reorder

Reorder rules.

**Request Body**:
```json
{
  "rule_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** `200`: `{ "success": true }`

---

### DELETE /api/v1/mail/rules/:id

Delete a rule.

**Response** `204`

---

## 6.6 Autoresponder

### GET /api/v1/mail/autoresponder

Get autoresponder settings.

**Response** `200`: Autoresponder object

---

### PUT /api/v1/mail/autoresponder

Update autoresponder settings.

**Request Body**:
```json
{
  "is_active": true,
  "subject": "Out of Office",
  "body": "I am currently unavailable...",
  "start_date": "2024-01-15",
  "end_date": "2024-01-22"
}
```

**Response** `200`: Updated autoresponder object

---

---

# SECTION 7 — CALENDAR API

**Base path**: `/api/v1/calendar`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 300 requests/minute

---

## 7.1 Calendars

### GET /api/v1/calendar/calendars

List all calendars (own + shared).

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Calendar",
      "color": "#4285F4",
      "type": "personal",
      "is_default": true,
      "is_visible": true,
      "owner": { "id": "uuid", "name": "string" },
      "permission": "owner | edit | view"
    }
  ]
}
```

---

### POST /api/v1/calendar/calendars

Create a calendar.

**Request Body**:
```json
{
  "name": "string",
  "color": "#4285F4",
  "description": "string | null"
}
```

**Response** `201`: Created calendar object

---

### PUT /api/v1/calendar/calendars/:id

Update a calendar.

**Response** `200`: Updated calendar object

---

### DELETE /api/v1/calendar/calendars/:id

Delete a calendar and all its events.

**Response** `204`

---

### POST /api/v1/calendar/calendars/:id/share

Share a calendar with another user.

**Request Body**:
```json
{
  "user_id": "uuid",
  "permission": "view | edit"
}
```

**Response** `201`: Share object

---

### DELETE /api/v1/calendar/calendars/:id/share/:user_id

Remove calendar sharing for a user.

**Response** `204`

---

## 7.2 Events

### GET /api/v1/calendar/events

List events in a date range.

**Query Parameters**:

| Parameter | Required | Description |
|-----------|----------|-------------|
| from | Yes | ISO8601 date |
| to | Yes | ISO8601 date |
| calendar_ids | No | Comma-separated UUIDs |

**Response** `200`: Array of event objects

---

### POST /api/v1/calendar/events

Create an event.

**Request Body**:
```json
{
  "calendar_id": "uuid",
  "title": "string",
  "description": "string | null",
  "location": "string | null",
  "start_at": "ISO8601",
  "end_at": "ISO8601",
  "is_all_day": false,
  "timezone": "Asia/Kolkata",
  "recurrence_rule": "RRULE:FREQ=WEEKLY;BYDAY=MO | null",
  "attendee_ids": ["uuid"],
  "attendee_emails": ["external@email.com"],
  "video_room": false,
  "reminder_minutes": 15
}
```

**Response** `201`: Created event object

---

### GET /api/v1/calendar/events/:id

Get a single event.

**Response** `200`: Full event object with attendees and RSVP status

---

### PUT /api/v1/calendar/events/:id

Update an event.

**Query Parameters**: `update_scope=this | this_and_following | all` (for recurring events)

**Response** `200`: Updated event object

---

### DELETE /api/v1/calendar/events/:id

Delete an event.

**Query Parameters**: `delete_scope=this | this_and_following | all`

**Response** `204`

---

### PATCH /api/v1/calendar/events/:id/rsvp

Respond to a meeting invitation.

**Request Body**:
```json
{
  "status": "accepted | declined | maybe"
}
```

**Response** `200`: `{ "success": true }`

---

---

# SECTION 8 — CONTACTS API

**Base path**: `/api/v1/contacts`
**Auth Required**: End User / Tenant Admin JWT
**Rate Limit**: 300 requests/minute

---

## 8.1 Contacts

### GET /api/v1/contacts

List all contacts for the authenticated user.

**Query Parameters**: `page`, `per_page`, `group_id`, `search`, `sort=name|created_at`

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "string",
      "last_name": "string",
      "display_name": "string",
      "company": "string | null",
      "job_title": "string | null",
      "emails": [ { "type": "work", "address": "string" } ],
      "phones": [ { "type": "mobile", "number": "string" } ],
      "avatar_url": "string | null"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 350 }
}
```

---

### POST /api/v1/contacts

Create a contact.

**Request Body**:
```json
{
  "first_name": "string",
  "last_name": "string",
  "company": "string | null",
  "job_title": "string | null",
  "emails": [ { "type": "work", "address": "string" } ],
  "phones": [ { "type": "mobile", "number": "string" } ],
  "addresses": [],
  "notes": "string | null"
}
```

**Response** `201`: Created contact object

---

### GET /api/v1/contacts/:id

Get a single contact.

**Response** `200`: Full contact object

---

### PUT /api/v1/contacts/:id

Update a contact.

**Response** `200`: Updated contact object

---

### DELETE /api/v1/contacts/:id

Delete a contact.

**Response** `204`

---

### POST /api/v1/contacts/import

Import contacts from CSV or vCard.

**Content-Type**: `multipart/form-data`

**Form Fields**:
| Field | Type | Description |
|-------|------|-------------|
| file | file | CSV or .vcf file |
| format | string | csv or vcard |
| duplicate_action | string | skip or overwrite |

**Response** `202`:
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "total_rows": 500
  }
}
```

---

### GET /api/v1/contacts/import/:job_id

Get import job status.

**Response** `200`: Job status with created/skipped/failed counts

---

### GET /api/v1/contacts/export

Export contacts.

**Query Parameters**: `format=csv|vcard`, `group_id`

**Response**: File download

---

## 8.2 Contact Groups

### GET /api/v1/contacts/groups

List all contact groups.

**Response** `200`: Array of group objects with member count

---

### POST /api/v1/contacts/groups

Create a group.

**Request Body**: `{ "name": "string" }`

**Response** `201`: Created group object

---

### PUT /api/v1/contacts/groups/:id

Rename a group.

**Response** `200`: Updated group object

---

### DELETE /api/v1/contacts/groups/:id

Delete a group (contacts are not deleted).

**Response** `204`

---

### POST /api/v1/contacts/groups/:id/members

Add contacts to a group.

**Request Body**: `{ "contact_ids": ["uuid", "uuid"] }`

**Response** `200`: `{ "success": true, "data": { "added": 2 } }`

---

### DELETE /api/v1/contacts/groups/:id/members/:contact_id

Remove a contact from a group.

**Response** `204`

---

## 8.3 Directory

### GET /api/v1/contacts/directory

Get the organization directory.

**Query Parameters**: `page`, `per_page`, `department_id`, `search`

**Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "display_name": "string",
      "email": "string",
      "job_title": "string | null",
      "department": "string | null",
      "avatar_url": "string | null",
      "presence_status": "online | away | busy | dnd | offline"
    }
  ],
  "meta": { "page": 1, "per_page": 50, "total": 1200 }
}
```

---

### GET /api/v1/contacts/directory/:user_id

Get a single user's directory profile.

**Response** `200`: Full directory profile

---

*End of D4 Part 3 of 5*
*Next: API_PART_04.md — Chat API, Video API, Drive API*
