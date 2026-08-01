# D5 — UI/UX Design System | Part 03: Screen Flows & Interaction Patterns

## 1. Navigation Architecture

### 1.1 Role-Based Navigation Map

#### Super Admin
```
Sidebar:
  Dashboard          /admin
  Platforms          /admin/platforms
  Tenants            /admin/tenants
  Mail Queue         /admin/mail-queue
  DNS Manager        /admin/dns
  Billing            /admin/billing
  Audit Logs         /admin/audit
  System Health      /admin/health
  Settings           /admin/settings
```

#### SaaS Admin
```
Sidebar:
  Dashboard          /saas
  Tenants            /saas/tenants
  Users              /saas/users
  Branding           /saas/branding
  Developer Hub      /saas/developer
  Analytics          /saas/analytics
  Billing            /saas/billing
  Settings           /saas/settings
```

#### Tenant Admin
```
Sidebar:
  Dashboard          /tenant
  Users              /tenant/users
  Departments        /tenant/departments
  Mail Settings      /tenant/mail
  Compliance         /tenant/compliance
  Analytics          /tenant/analytics
  Settings           /tenant/settings
```

#### End User (Webmail)
```
Sidebar:
  Mail               /mail
    Inbox
    Sent
    Drafts
    Starred
    Trash
    [Labels]
  Calendar           /calendar
  Contacts           /contacts
  Chat               /chat
  Video              /video
  Drive              /drive
  Notifications      /notifications
  Settings           /settings
```

---

### 1.2 URL Structure

```
Base: https://mail.ssgzone.in

Auth:
  /login
  /logout
  /forgot-password
  /reset-password/:token
  /mfa

Admin:
  /admin/*

SaaS:
  /saas/*

Tenant:
  /tenant/*

Webmail:
  /mail
  /mail/:folder
  /mail/:folder/:messageId
  /calendar
  /calendar/:view          ← day | week | month | agenda
  /contacts
  /contacts/:contactId
  /chat
  /chat/:conversationId
  /video
  /video/:meetingId
  /drive
  /drive/:folderId
  /settings/:section
```

---

## 2. Core Screen Flows

### 2.1 Authentication Flow

```
[/login]
  ├── Enter email → validate domain → show tenant branding
  ├── Enter password → POST /auth/login
  │     ├── Success + MFA disabled → redirect to /mail
  │     ├── Success + MFA enabled  → /mfa
  │     └── Failure → inline error, no page reload
  └── Forgot password → /forgot-password

[/mfa]
  ├── Enter 6-digit TOTP
  ├── Success → redirect to /mail
  └── Failure → error + retry (max 5 attempts → lockout)

[/forgot-password]
  ├── Enter email → POST /auth/forgot-password
  ├── Show: "If this email exists, you'll receive a link"
  └── Email link → /reset-password/:token

[/reset-password/:token]
  ├── Validate token (expired → show error + resend link)
  ├── New password + confirm
  └── Success → redirect to /login with success toast
```

---

### 2.2 Mail Flow

```
[/mail/inbox]
  ├── Mail list (virtualized, 50 per page)
  ├── Click row → split view: list left (40%) + detail right (60%)
  │     OR full-screen on mobile
  ├── Compose button → MailCompose modal (bottom-right, minimizable)
  ├── Select multiple → bulk action bar appears above list
  │     Actions: Mark read | Star | Move | Label | Delete
  └── Search → global search overlay

[Mail Detail View]
  ├── From / To / CC / Date / Subject header
  ├── Body (sanitized HTML)
  ├── Attachments row (download / preview)
  ├── Action bar: Reply | Reply All | Forward | Star | Move | Delete
  └── Thread view: collapsed previous messages, expand on click

[Compose Flow]
  ├── To field: type → autocomplete from contacts/directory
  ├── Subject + body
  ├── Attach: file picker → upload → show progress chip
  ├── Schedule: date/time picker → confirm
  ├── Send → optimistic UI (move to Sent) → API call
  └── Draft auto-save: every 30s or on blur
```

---

### 2.3 Calendar Flow

```
[/calendar] — default: week view
  ├── View toggle: Day | Week | Month | Agenda
  ├── Click empty slot → quick-create event popover
  │     Fields: Title, Time, Duration
  │     [More options] → full event modal
  ├── Click event → event detail popover
  │     Actions: Edit | Delete | Copy link | RSVP
  └── Full event modal:
        Title, Description, Location/Video link
        Start/End datetime, All-day toggle
        Recurrence (None | Daily | Weekly | Monthly | Custom)
        Attendees (autocomplete from directory)
        Reminders (15min | 30min | 1hr | custom)
        [Save] [Cancel] [Delete if editing]
```

---

### 2.4 Chat Flow

```
[/chat]
  ├── Left panel: conversation list
  │     Tabs: Direct Messages | Channels
  │     Search conversations
  │     [+ New DM] [+ New Channel]
  ├── Right panel: active conversation (ChatPanel)
  └── No selection: empty state "Select a conversation"

[Conversation]
  ├── Messages: virtualized, load older on scroll-up
  ├── Typing indicator: "Alice is typing..."
  ├── Message actions (hover): React | Reply | Forward | Copy | Delete
  ├── Reactions: emoji picker → add/remove reaction
  ├── Reply: quoted message above input
  └── File attach: drag-drop or picker → upload → preview in chat

[New DM]
  ├── Search users (directory autocomplete)
  ├── Select one or more → Create
  └── If conversation exists → navigate to it
```

---

### 2.5 Video Meeting Flow

```
[/video]
  ├── [New Meeting] → generate meeting ID → /video/:meetingId
  ├── [Join Meeting] → enter meeting ID → /video/:meetingId
  └── Scheduled meetings list (from calendar)

[/video/:meetingId — Pre-join lobby]
  ├── Camera preview
  ├── Mic/Camera toggle
  ├── Name display (pre-filled from profile)
  └── [Join Now] → enter meeting room

[Meeting Room]
  ├── Video grid (speaker view / gallery view toggle)
  ├── Bottom bar: [Mic] [Camera] [Screen Share] [Chat] [Participants] [Leave]
  ├── Side panel (toggle): Chat | Participants
  ├── Screen share: select window/tab/screen
  └── [Leave] → confirm dialog → /video
```

---

### 2.6 Drive Flow

```
[/drive]
  ├── Left: folder tree
  ├── Right: file grid (default) or list view toggle
  ├── [Upload] → file picker or drag-drop zone
  ├── [New Folder] → inline rename input
  ├── File click → preview panel (right side)
  │     Preview types: PDF, image, video, text, office docs
  ├── File right-click / kebab menu:
  │     Download | Share | Move | Rename | Copy link | Delete
  └── Share modal:
        Add people (autocomplete)
        Permission: View | Comment | Edit
        Link sharing: Off | Anyone with link
        [Copy link] [Send invite]
```

---

### 2.7 Settings Flow

```
[/settings]
  ├── Left nav: sections list
  └── Right: section content

Sections (End User):
  Profile         → name, avatar, timezone, language
  Security        → password change, MFA setup, active sessions
  Mail            → signature, vacation reply, filters, forwarding
  Notifications   → per-channel toggles (email, push, in-app)
  Appearance      → theme (light/dark/system), density (compact/default)
  Integrations    → connected apps, API tokens
```

---

## 3. Interaction Patterns

### 3.1 Optimistic UI

Apply to: send mail, send chat message, star/unstar, mark read/unread, move to folder.

Pattern:
1. Update UI immediately (assume success)
2. Fire API call in background
3. On success: no visible change (already updated)
4. On failure: revert UI + show error toast

---

### 3.2 Infinite Scroll vs Pagination

| Context | Strategy |
|---------|----------|
| Mail list | Pagination (50/page) — predictable position |
| Chat messages | Infinite scroll (load older on scroll-up) |
| Contacts | Pagination (25/page) |
| Drive files | Pagination (grid: 24/page, list: 50/page) |
| Audit logs | Pagination (100/page) |
| Notifications | Infinite scroll |

---

### 3.3 Drag and Drop

| Context | Behavior |
|---------|----------|
| Mail → folder | Drag mail row to sidebar folder |
| Drive files | Drag files between folders |
| Calendar events | Drag to reschedule (day/week view) |
| File upload | Drag files to Drive or Compose |

Visual feedback: drag ghost (semi-transparent copy), drop target highlight (`--color-brand-100` bg + `--border-focus` border).

---

### 3.4 Keyboard Shortcuts

#### Global
| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open global search |
| `Ctrl+N` | New compose (in mail context) |
| `?` | Show keyboard shortcuts help |
| `Esc` | Close modal / panel |

#### Mail
| Shortcut | Action |
|----------|--------|
| `C` | Compose |
| `R` | Reply |
| `A` | Reply all |
| `F` | Forward |
| `E` | Archive |
| `#` | Delete |
| `U` | Mark unread |
| `S` | Star/unstar |
| `J` / `K` | Next / previous message |
| `G I` | Go to Inbox |
| `G S` | Go to Sent |

#### Navigation
| Shortcut | Action |
|----------|--------|
| `G M` | Go to Mail |
| `G C` | Go to Calendar |
| `G T` | Go to Chat |
| `G D` | Go to Drive |

---

### 3.5 Form Validation

Rules:
- Validate on blur (not on every keystroke)
- Show error below field, replace hint text
- On submit: validate all fields, focus first error
- Never clear user input on error
- Password strength: show meter (weak/fair/strong/very strong)

```
Error display:
[Input — red border]
⚠ This field is required.   ← --color-error, --text-sm
```

---

### 3.6 Confirmation Dialogs

Use for: delete, revoke access, bulk actions, irreversible operations.

Pattern:
```
┌─────────────────────────────────┐
│ Delete 3 messages?              │
│                                 │
│ This action cannot be undone.   │
│                                 │
│ [Cancel]        [Delete — red]  │
└─────────────────────────────────┘
```

Rules:
- Destructive action button always on the right
- Destructive button uses `btn-danger`
- Default focus on Cancel (not the destructive action)
- Pressing Enter should NOT trigger destructive action

---

### 3.7 Notification / Alert Patterns

| Type | When | Duration |
|------|------|----------|
| Success toast | Action completed | 3s auto-dismiss |
| Error toast | Action failed | 6s, manual dismiss |
| Warning toast | Partial success | 5s auto-dismiss |
| Info toast | Background update | 4s auto-dismiss |
| Persistent banner | System-wide alert | Manual dismiss only |
| Inline error | Form validation | Until corrected |

---

### 3.8 Responsive Behavior

| Breakpoint | Sidebar | TopBar | Mail Layout | Chat Layout |
|------------|---------|--------|-------------|-------------|
| `2xl/xl` | 240px expanded | Full | Split 40/60 | Split 30/70 |
| `lg` | 240px, toggle to 64px | Full | Split 40/60 | Split 30/70 |
| `md` | Hidden, drawer on hamburger | Compact | List only → detail on click | List only |
| `sm/xs` | Hidden, bottom nav | Minimal | Full screen list/detail | Full screen |

Bottom nav (mobile) — 5 items max:
```
[Mail] [Calendar] [Chat] [Drive] [More ▾]
```

---

## 4. Tenant Branding System

### 4.1 Brandable Elements

| Element | Token | Tenant Override |
|---------|-------|-----------------|
| Primary color | `--color-brand-500/600` | ✅ |
| Logo | `--logo-url` | ✅ |
| Favicon | `--favicon-url` | ✅ |
| Sidebar background | `--surface-sidebar` | ✅ |
| Login page background | `--login-bg` | ✅ |
| Font family | `--font-sans` | ✅ (from approved list) |
| Border radius | `--radius-md/lg` | ✅ (within range) |

Non-brandable (locked):
- Semantic colors (success/error/warning)
- Z-index scale
- Spacing scale
- Typography scale

### 4.2 Brand Token Injection

```js
// On app load, after auth:
// GET /api/v1/tenant/branding → { primaryColor, logoUrl, ... }
// Inject as:
document.body.setAttribute('data-tenant', tenantSlug);
// CSS vars injected via <style> tag in <head>
```

---

## 5. Component Refactoring Map

Per DASHBOARD_PART_05 requirement — WebmailDashboard.js (1500+ lines) → 14 components:

| Component | File | Max Lines | Responsibility |
|-----------|------|-----------|----------------|
| `AppShell` | AppShell.jsx | 80 | Layout wrapper, sidebar + topbar slots |
| `Sidebar` | Sidebar.jsx | 150 | Nav items, collapse, badges |
| `TopBar` | TopBar.jsx | 100 | Search, notifications, user menu |
| `MailLayout` | MailLayout.jsx | 120 | Split pane, list + detail |
| `MailList` | MailList.jsx | 200 | Virtualized mail rows, selection |
| `MailDetail` | MailDetail.jsx | 250 | Message view, thread, actions |
| `MailCompose` | MailCompose.jsx | 280 | Compose modal, rich text, attachments |
| `CalendarView` | CalendarView.jsx | 250 | Day/week/month/agenda views |
| `EventModal` | EventModal.jsx | 200 | Create/edit event form |
| `ChatLayout` | ChatLayout.jsx | 100 | Conversation list + panel split |
| `ChatPanel` | ChatPanel.jsx | 280 | Message list, input, reactions |
| `DriveLayout` | DriveLayout.jsx | 200 | Folder tree + file grid/list |
| `VideoRoom` | VideoRoom.jsx | 250 | Meeting room UI, controls |
| `SettingsLayout` | SettingsLayout.jsx | 150 | Settings nav + section router |

Total: ~2,660 lines across 14 files vs 1,500+ in one file.
Each file is independently testable and lazy-loadable.

---

## 6. Design Handoff Checklist

Before any component moves to development:

- [ ] All states defined: default, hover, focus, active, disabled, loading, error, empty
- [ ] Dark mode variant specified
- [ ] Mobile/responsive behavior documented
- [ ] All design tokens used (no hardcoded colors/sizes)
- [ ] Accessibility: contrast checked, keyboard flow documented, ARIA roles noted
- [ ] Animation: duration and easing specified
- [ ] Edge cases: long text truncation, empty data, max items
- [ ] Tenant branding: which elements are overridable

---

*Part 03 of 03 — D5 UI/UX Design System Complete*
