# SSGzone Communication Platform
# DASHBOARD SPECIFICATION
# D2 — PART 5 OF 5
## Webmail Dashboard — End User Communication Interface

---

# WEBMAIL DASHBOARD

---

## Overview

The Webmail Dashboard is the primary communication interface for end users. It is a single-page application that provides access to Mail, Chat, Calendar, Contacts, Drive, and Video from one unified interface. This is the module that currently exists as a 1500-line monolith (`WebmailDashboard.js`) and must be refactored into focused, independent components.

**URL**: `https://[tenant-slug].[saas-slug].ssgzone.in/webmail`
**Access**: End User, Manager, Tenant Admin
**Layout**: Three-panel layout (Sidebar | List Panel | Detail Panel)

---

## 1. Overall Layout

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR: Logo | Search | Presence | Notifications | Profile │
├──────────┬──────────────────────┬───────────────────────────┤
│          │                      │                           │
│  MODULE  │   LIST / INDEX       │   DETAIL / COMPOSE        │
│  SIDEBAR │   PANEL              │   PANEL                   │
│          │                      │                           │
│  Mail    │  (Inbox list /       │  (Email content /         │
│  Chat    │   Channel list /     │   Chat messages /         │
│  Cal     │   Contact list /     │   Event detail /          │
│  Drive   │   File list /        │   File preview /          │
│  Video   │   Event list)        │   Video room)             │
│  Dir     │                      │                           │
│          │                      │                           │
└──────────┴──────────────────────┴───────────────────────────┘
```

---

## 2. Mail Interface

### 2.1 Left Panel — Folder Tree

| Item | Description |
|------|-------------|
| Compose Button | Opens compose window (full-width overlay) |
| Inbox | Unread count badge |
| Starred | Starred emails |
| Sent | Sent emails |
| Drafts | Draft count badge |
| Spam | Spam folder |
| Trash | Deleted emails |
| Archive | Archived emails |
| — Custom Folders — | User-created folders |
| + New Folder | Create folder button |

### 2.2 Middle Panel — Email List

| Column | Description |
|--------|-------------|
| Sender Avatar | Initials or photo |
| Sender Name | Bold if unread |
| Subject | Bold if unread |
| Preview | First line of email body |
| Timestamp | Relative time (2h ago) |
| Attachment Icon | Shown if email has attachments |
| Star Icon | Toggle starred |

**Toolbar above list**:
- Select All checkbox
- Bulk actions: Mark Read, Mark Unread, Move to Folder, Delete, Spam
- Sort dropdown: Date, Sender, Subject
- Filter dropdown: All, Unread, Starred, With Attachments
- Search within folder (inline search bar)

**Pagination**: Load more on scroll (infinite scroll) or page numbers

### 2.3 Right Panel — Email Detail

| Element | Description |
|---------|-------------|
| Subject | Large heading |
| From | Sender name + email (click to add to contacts) |
| To | Recipients |
| CC / BCC | Shown if present (collapsible) |
| Date | Full date and time |
| Attachments | File icons with name, size, download button, preview button |
| Email Body | Rendered HTML (sanitized with DOMPurify) |
| Action Buttons | Reply, Reply All, Forward, Delete, Move, Star, Print, More |

**More Menu**:
- Mark as Unread
- Add Sender to Contacts
- Create Rule from this Email
- View Raw Source
- Report Spam

### 2.4 Compose Window

**Triggered by**: Compose button, Reply, Reply All, Forward

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| To | Tag input | Email addresses with autocomplete from contacts |
| CC | Tag input | Collapsible |
| BCC | Tag input | Collapsible |
| Subject | Text | |
| Body | Rich text editor | Bold, italic, underline, lists, links, images |
| Signature | Dropdown | Select from saved signatures |
| Attachments | File upload | Drag and drop or click to upload |
| Attach from Drive | Button | Opens Drive file picker |

**Toolbar Buttons**:
- Send
- Save Draft (auto-save every 30 seconds)
- Schedule Send (date/time picker)
- Discard

**Attachment Display**: File name, size, remove button

### 2.5 Mail Settings (within Webmail)

Accessible from gear icon in mail panel:

| Setting | Description |
|---------|-------------|
| Signatures | Create, edit, delete signatures |
| Autoresponder | Enable/disable, set message and date range |
| Mail Rules | Create, edit, delete, reorder rules |
| Aliases | View aliases (manage in admin) |
| Vacation Mode | Quick toggle for autoresponder |

---

## 3. Chat Interface

### 3.1 Left Panel — Channel & DM List

**Sections**:

| Section | Description |
|---------|-------------|
| Search Channels | Search bar at top |
| Starred Channels | Pinned/starred channels |
| Channels | All joined channels with unread count |
| Direct Messages | DM conversations with presence indicator |
| + New Channel | Create channel button |
| + New DM | Start DM button |

**Channel Item Shows**:
- Channel name
- Unread message count badge
- Muted indicator (if muted)

**DM Item Shows**:
- User avatar with presence dot
- User name
- Unread count badge
- Last message preview

### 3.2 Middle/Right Panel — Chat Window

**Top Bar**:
- Channel name / DM user name
- Member count (for channels)
- Presence status (for DMs)
- Search in channel button
- Pinned messages button
- Members list button
- More options menu

**Message List**:

| Element | Description |
|---------|-------------|
| User Avatar | Initials or photo |
| User Name | Bold |
| Timestamp | Relative time |
| Message Body | Text with @mention highlighting, URL previews |
| File Attachment | File icon, name, size, download |
| Image | Inline preview |
| Reactions | Emoji reactions with count |
| Thread Count | "3 replies" link if thread exists |
| Hover Actions | React, Reply in Thread, Edit, Delete, Pin, More |

**Message Input Bar**:

| Element | Description |
|---------|-------------|
| Text Input | Rich text — bold, italic, code, lists |
| Emoji Picker | Emoji selection button |
| Attach File | Upload file (max 50MB) |
| Attach from Drive | Drive file picker |
| @Mention | Type @ to trigger user autocomplete |
| Send Button | Send message |

**Typing Indicator**: "John is typing..." shown below input

### 3.3 Thread Panel (Right Side Overlay)

Opens when user clicks "Reply in Thread":
- Shows parent message at top
- Thread replies below
- Thread reply input at bottom
- Close button

### 3.4 Channel Management

**Create Channel Dialog**:

| Field | Type | Required |
|-------|------|----------|
| Channel Name | Text | Yes |
| Description | Text | No |
| Type | Radio | Public / Private |
| Add Members | User search | No |

**Channel Settings (gear icon)**:
- Edit name and description
- Add/remove members
- Mute channel
- Leave channel
- Archive channel (Tenant Admin only)
- Delete channel (Tenant Admin only)

---

## 4. Calendar Interface

### 4.1 Left Panel — Calendar List

| Element | Description |
|---------|-------------|
| Mini Calendar | Month view for date navigation |
| My Calendars | List of personal calendars with color dots |
| Shared Calendars | Calendars shared with me |
| Other Calendars | Organization-wide calendars |
| + New Calendar | Create calendar button |

Each calendar has:
- Visibility toggle (show/hide)
- Color picker
- Settings menu (share, edit, delete)

### 4.2 Main Panel — Calendar View

**View Switcher**: Day | Week | Month | Agenda

**Day View**:
- Hourly time slots
- Events shown as colored blocks
- Click empty slot to create event

**Week View**:
- 7-day columns with hourly rows
- Events shown as colored blocks
- Drag to move events

**Month View**:
- Full month grid
- Events shown as colored pills
- "+3 more" link for days with many events

**Agenda View**:
- Chronological list of upcoming events
- Grouped by date

**Top Bar**:
- Previous / Next navigation arrows
- Today button
- Date range display
- View switcher
- Create Event button

### 4.3 Event Detail Popup

Shown on clicking an event:

| Element | Description |
|---------|-------------|
| Event Title | Large heading |
| Date & Time | Full date, start and end time |
| Location | If set |
| Video Link | "Join Meeting" button if video link attached |
| Organizer | Who created the event |
| Attendees | List with accept/decline status |
| Description | Event notes |
| Edit Button | Opens full edit form |
| Delete Button | Delete with confirmation |
| RSVP Buttons | Accept / Maybe / Decline (for invited events) |

### 4.4 Create / Edit Event Form

| Field | Type | Required |
|-------|------|----------|
| Title | Text | Yes |
| Date | Date picker | Yes |
| Start Time | Time picker | Yes |
| End Time | Time picker | Yes |
| All Day | Toggle | No |
| Repeat | Dropdown: None / Daily / Weekly / Monthly / Yearly | No |
| Location | Text | No |
| Add Video Meeting | Toggle | No — creates video room and adds link |
| Invite People | User search (multi-select) | No |
| Calendar | Dropdown (select which calendar) | Yes |
| Description | Textarea | No |
| Reminder | Dropdown: None / 5 min / 15 min / 30 min / 1 hour / 1 day | No |

**Buttons**: Save, Cancel, Delete (edit mode only)

---

## 5. Contacts Interface

### 5.1 Left Panel — Contact Groups

| Item | Description |
|------|-------------|
| All Contacts | Total count |
| Frequently Contacted | Auto-generated from mail/chat activity |
| — My Groups — | User-created groups |
| + New Group | Create group button |
| Organization Directory | Link to directory module |

### 5.2 Middle Panel — Contact List

| Column | Description |
|--------|-------------|
| Avatar | Initials or photo |
| Name | Full name |
| Email | Primary email |
| Phone | If available |
| Company | If available |

**Toolbar**:
- Search contacts (inline)
- Sort: Name, Company, Recently Added
- Filter: All, With Phone, With Company
- Import button (CSV / vCard)
- Export button (CSV / vCard)
- + New Contact button

### 5.3 Right Panel — Contact Detail

| Element | Description |
|---------|-------------|
| Avatar | Large photo or initials |
| Name | Full name |
| Job Title | If available |
| Company | If available |
| Email Addresses | All emails with "Send Email" button |
| Phone Numbers | All phones |
| Address | If available |
| Notes | Free text notes |
| Groups | Which groups this contact belongs to |
| Action Buttons | Edit, Delete, Add to Group |

### 5.4 Create / Edit Contact Form

| Field | Type |
|-------|------|
| First Name | Text |
| Last Name | Text |
| Email (multiple) | Email inputs with +Add button |
| Phone (multiple) | Phone inputs with +Add button |
| Company | Text |
| Job Title | Text |
| Address | Textarea |
| Notes | Textarea |
| Photo | File upload |

---

## 6. Drive Interface

### 6.1 Left Panel — Drive Navigation

| Item | Description |
|------|-------------|
| My Drive | Personal files root |
| Shared With Me | Files others shared with me |
| Recent | Recently accessed files |
| Starred | Starred files |
| Trash | Deleted files |
| Storage Usage | Progress bar (used / quota) |

### 6.2 Middle Panel — File / Folder List

**View Toggle**: Grid (thumbnails) | List (table)

**List View Columns**:

| Column | Sortable |
|--------|----------|
| Name | Yes |
| Modified | Yes |
| Size | Yes |
| Shared | No |
| Actions | No |

**Toolbar**:
- Upload File button
- New Folder button
- Sort dropdown
- View toggle (grid/list)
- Search within folder

**Right-click Context Menu on File**:
- Open / Preview
- Download
- Share
- Move
- Rename
- Copy
- Star / Unstar
- Version History
- Delete

### 6.3 Right Panel — File Preview / Detail

| Element | Description |
|---------|-------------|
| File Preview | PDF, image, text preview in panel |
| File Name | Editable on click |
| File Size | Display |
| Modified Date | Display |
| Owner | Who owns the file |
| Shared With | List of users with access |
| Version History | List of previous versions with restore button |
| Activity Log | Who viewed/edited and when |
| Action Buttons | Download, Share, Move, Delete |

### 6.4 Share Dialog

| Field | Description |
|-------|-------------|
| Add People | User search (multi-select) |
| Permission | Dropdown: View / Edit |
| Share Link | Toggle to generate shareable link |
| Link Permission | View only / Edit |
| Copy Link Button | Copies link to clipboard |
| Current Access List | Table of who has access with remove button |

---

## 7. Video Interface

### 7.1 Video Home Panel

| Element | Description |
|---------|-------------|
| Start Instant Meeting | Button — creates room and joins immediately |
| Schedule Meeting | Button — opens calendar event form with video pre-selected |
| Join with Code | Input field for meeting code |
| Upcoming Meetings | List of calendar events with video links in next 24 hours |
| Recent Meetings | Last 5 meetings with date, duration, participant count |

### 7.2 In-Meeting Interface

| Element | Description |
|---------|-------------|
| Video Grid | Participant video tiles in grid layout |
| Self Preview | Small self-view in corner |
| Participant Name Labels | Name shown below each video tile |
| Mute Button | Toggle microphone |
| Camera Button | Toggle camera |
| Screen Share Button | Share screen or application window |
| Chat Button | Toggle in-meeting chat panel |
| Participants Button | Toggle participant list panel |
| Raise Hand Button | Signal to host |
| Leave Button | Leave meeting |
| End Meeting Button | End for all (host only) |

**Participant List Panel**:
- List of all participants
- Mute/unmute individual (host only)
- Remove participant (host only)
- Hand raised indicator

**In-Meeting Chat Panel**:
- Message list
- Text input
- Send button

---

## 8. Component Architecture (Refactoring Guide)

The current `WebmailDashboard.js` (1500+ lines) must be broken into these independent components:

| Component | File | Responsibility |
|-----------|------|----------------|
| WebmailLayout | WebmailLayout.js | Top bar, sidebar, three-panel layout |
| MailModule | mail/MailModule.js | Mail folder tree, list, detail, compose |
| MailCompose | mail/MailCompose.js | Compose window only |
| MailList | mail/MailList.js | Email list panel |
| MailDetail | mail/MailDetail.js | Email detail panel |
| ChatModule | chat/ChatModule.js | Channel list, chat window, thread panel |
| ChatWindow | chat/ChatWindow.js | Message list and input |
| CalendarModule | calendar/CalendarModule.js | Calendar views and event management |
| EventForm | calendar/EventForm.js | Create/edit event form |
| ContactsModule | contacts/ContactsModule.js | Contact list and detail |
| DriveModule | drive/DriveModule.js | File browser and preview |
| VideoModule | video/VideoModule.js | Video home and in-meeting UI |
| NotificationsPanel | NotificationsPanel.js | Notification bell and list |
| PresenceControl | PresenceControl.js | Status indicator and picker |
| UnifiedSearch | UnifiedSearch.js | Search overlay |

**Rule**: No component file should exceed 300 lines.

---

## 9. Responsive Design Requirements

| Breakpoint | Layout Behavior |
|------------|-----------------|
| Desktop (>1200px) | Full three-panel layout |
| Tablet (768–1200px) | Two panels — sidebar collapses to icons |
| Mobile (<768px) | Single panel — bottom navigation bar replaces sidebar |

**Mobile Navigation Bar** (bottom):
- Mail, Chat, Calendar, Drive, More (overflow menu)

---

*End of D2 Part 5 of 5*
*D2 — Dashboard Specification Complete*

---

## D2 DOCUMENT INDEX

| Part | File | Dashboard |
|------|------|-----------|
| Part 1 | DASHBOARD_PART_01.md | Super Admin Dashboard |
| Part 2 | DASHBOARD_PART_02.md | SaaS Admin Dashboard |
| Part 3 | DASHBOARD_PART_03.md | Tenant Admin Dashboard |
| Part 4 | DASHBOARD_PART_04.md | End User / Employee Dashboard |
| Part 5 | DASHBOARD_PART_05.md | Webmail Dashboard (Communication Interface) |

*Next Document: D3 — Database Blueprint*
