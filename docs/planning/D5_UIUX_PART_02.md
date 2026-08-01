# D5 — UI/UX Design System | Part 02: Component Library

## 1. Component Architecture

All components follow this structure:
- **Atomic**: Button, Input, Badge, Avatar, Spinner, Tooltip
- **Molecular**: FormField, SearchBar, UserCard, MailRow, ChatBubble
- **Organism**: Sidebar, TopBar, DataTable, MailCompose, ChatPanel
- **Template**: AppShell, DashboardLayout, SettingsLayout

File structure:
```
src/
  components/
    ui/           ← Atomic + Molecular (shared, no business logic)
    features/     ← Organism + Template (business-aware)
  styles/
    tokens.css    ← All design tokens (Part 01)
    reset.css     ← Minimal CSS reset
    global.css    ← Base element styles
```

---

## 2. Atomic Components

### 2.1 Button

Variants: `primary` | `secondary` | `ghost` | `danger` | `link`
Sizes: `sm` | `md` | `lg`

```jsx
// Props
{
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link',
  size: 'sm' | 'md' | 'lg',
  loading: boolean,
  disabled: boolean,
  leftIcon: ReactNode,
  rightIcon: ReactNode,
  fullWidth: boolean,
  onClick: () => void
}
```

```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  border: var(--border-width-thin) solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  white-space: nowrap;
}
.btn:focus-visible { box-shadow: var(--shadow-focus); outline: none; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Sizes */
.btn-sm  { padding: var(--space-1) var(--space-3); font-size: var(--text-sm);  height: 32px; }
.btn-md  { padding: var(--space-2) var(--space-4); font-size: var(--text-base); height: 40px; }
.btn-lg  { padding: var(--space-3) var(--space-6); font-size: var(--text-lg);  height: 48px; }

/* Variants */
.btn-primary   { background: var(--color-brand-500); color: var(--text-inverse); }
.btn-primary:hover { background: var(--color-brand-600); }

.btn-secondary { background: var(--surface-card); color: var(--text-primary); border-color: var(--border-default); }
.btn-secondary:hover { background: var(--color-neutral-100); }

.btn-ghost     { background: transparent; color: var(--text-primary); }
.btn-ghost:hover { background: var(--color-neutral-100); }

.btn-danger    { background: var(--color-error); color: var(--text-inverse); }
.btn-danger:hover { background: var(--color-error-dark); }

.btn-link      { background: transparent; color: var(--text-link); padding: 0; height: auto; }
.btn-link:hover { color: var(--text-link-hover); text-decoration: underline; }
```

---

### 2.2 Input

Variants: `text` | `email` | `password` | `search` | `textarea` | `select`

```css
.input {
  width: 100%;
  height: 40px;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  color: var(--text-primary);
  background: var(--surface-input);
  border: var(--border-width-thin) solid var(--border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}
.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--shadow-focus);
  background: var(--surface-input-focus);
}
.input.error { border-color: var(--border-error); }
.input:disabled { background: var(--color-neutral-100); color: var(--text-disabled); cursor: not-allowed; }
.input-with-icon { padding-left: var(--space-10); }  /* 40px for icon */
```

---

### 2.3 Badge

Variants: `default` | `success` | `warning` | `error` | `info` | `brand`
Sizes: `sm` | `md`

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.badge-success { background: var(--color-success-light); color: var(--color-success-dark); }
.badge-warning { background: var(--color-warning-light); color: var(--color-warning-dark); }
.badge-error   { background: var(--color-error-light);   color: var(--color-error-dark);   }
.badge-info    { background: var(--color-info-light);    color: var(--color-info-dark);    }
.badge-brand   { background: var(--color-brand-100);     color: var(--color-brand-700);    }
```

Badge usage map:
| Context | Variant |
|---------|---------|
| User online | `success` |
| User away | `warning` |
| User offline | `default` |
| Mail unread count | `brand` |
| Error status | `error` |
| Plan tier | `info` |

---

### 2.4 Avatar

```css
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  overflow: hidden;
  flex-shrink: 0;
}
/* Sizes */
.avatar-xs { width: 24px; height: 24px; font-size: var(--text-xs); }
.avatar-sm { width: 32px; height: 32px; font-size: var(--text-sm); }
.avatar-md { width: 40px; height: 40px; font-size: var(--text-base); }
.avatar-lg { width: 48px; height: 48px; font-size: var(--text-lg); }
.avatar-xl { width: 64px; height: 64px; font-size: var(--text-xl); }
```

Avatar with presence indicator:
```jsx
// Presence dot positioned bottom-right of avatar
// dot size: 10px for md, 8px for sm
// dot color: success=online, warning=away, neutral-400=offline
```

---

### 2.5 Spinner

```css
.spinner {
  border: 2px solid var(--color-neutral-200);
  border-top-color: var(--color-brand-500);
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}
.spinner-sm { width: 16px; height: 16px; }
.spinner-md { width: 24px; height: 24px; }
.spinner-lg { width: 40px; height: 40px; }

@keyframes spin { to { transform: rotate(360deg); } }
```

---

### 2.6 Tooltip

```jsx
// Props
{ content: string, placement: 'top'|'bottom'|'left'|'right', delay: number }
```

```css
.tooltip {
  position: absolute;
  background: var(--color-neutral-900);
  color: var(--text-inverse);
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
  z-index: var(--z-tooltip);
  animation: fadeIn var(--duration-fast) var(--ease-out);
}
```

---

## 3. Molecular Components

### 3.1 FormField

Wraps label + input + helper/error text.

```jsx
// Props
{
  label: string,
  required: boolean,
  error: string,
  hint: string,
  children: ReactNode  // the input element
}
```

Layout:
```
[Label]  [Required *]
[Input / Select / Textarea]
[Error message | Hint text]
```

---

### 3.2 SearchBar

Used in TopBar (global) and within list views (local).

```jsx
// Props
{
  placeholder: string,
  value: string,
  onChange: (val: string) => void,
  onClear: () => void,
  loading: boolean,
  scope: 'global' | 'local'
}
```

- Global: full-width modal overlay on focus, shows recent + suggestions
- Local: inline, filters current list in real-time

---

### 3.3 UserCard

Used in directory, chat, contacts.

```jsx
// Props
{
  name: string,
  email: string,
  role: string,
  department: string,
  presence: 'online' | 'away' | 'offline' | 'dnd',
  avatarUrl: string,
  actions: ReactNode
}
```

Layout:
```
[Avatar + Presence] [Name (bold)]     [Action buttons]
                    [Role · Dept]
                    [email@domain]
```

---

### 3.4 MailRow

Used in mail list view.

```jsx
// Props
{
  from: string,
  subject: string,
  preview: string,
  timestamp: string,
  isRead: boolean,
  isStarred: boolean,
  hasAttachment: boolean,
  labels: string[],
  isSelected: boolean,
  onSelect: () => void,
  onClick: () => void
}
```

Layout:
```
[Checkbox] [Avatar] [From (bold if unread)] [Subject] [Preview...]  [Time] [Star]
```

States:
- Unread: `--font-semibold`, `--surface-card` background
- Read: `--font-regular`, `--color-neutral-50` background
- Selected: `--color-brand-50` background, `--border-focus` left border
- Hover: `--color-neutral-100` background

---

### 3.5 ChatBubble

```jsx
// Props
{
  message: string,
  sender: { name, avatarUrl },
  timestamp: string,
  isSelf: boolean,
  status: 'sending' | 'sent' | 'delivered' | 'read',
  reactions: { emoji, count }[],
  replyTo: { sender, preview } | null,
  attachments: { name, size, type }[]
}
```

Layout (self):
```
                    [Message bubble — brand-100 bg]  [Avatar]
                    [Timestamp + status icon]
```

Layout (other):
```
[Avatar]  [Sender name]
          [Message bubble — neutral-100 bg]
          [Timestamp]
```

---

## 4. Organism Components

### 4.1 Sidebar

```
Width: 240px (expanded) | 64px (collapsed)
Background: --surface-sidebar
Transition: width 200ms ease

Structure:
┌─────────────────────┐
│ Logo / Brand        │  ← 56px height, matches TopBar
├─────────────────────┤
│ Nav Items           │  ← scrollable
│  • Icon + Label     │
│  • Active state     │
│  • Badge count      │
├─────────────────────┤
│ Bottom Items        │  ← fixed: Settings, Help, User
└─────────────────────┘
```

Nav item states:
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-neutral-400);
  transition: all var(--duration-fast);
}
.nav-item:hover { background: var(--surface-sidebar-hover); color: var(--text-inverse); }
.nav-item.active { background: var(--color-brand-600); color: var(--text-inverse); }
```

---

### 4.2 TopBar

```
Height: 56px
Background: --surface-card
Border-bottom: 1px solid --border-default
Position: sticky top-0, z-index: --z-sticky

Left:   [Hamburger/Toggle] [Logo] [Breadcrumb]
Center: [Global Search — expands on focus]
Right:  [Help] [Notifications Bell + count] [User Avatar + name + chevron]
```

---

### 4.3 DataTable

```jsx
// Props
{
  columns: { key, label, sortable, width, render }[],
  data: object[],
  loading: boolean,
  pagination: { page, pageSize, total, onChange },
  selection: { selected, onSelect, onSelectAll },
  filters: ReactNode,
  emptyState: ReactNode,
  onRowClick: (row) => void
}
```

Features:
- Column sorting (click header)
- Row selection (checkbox)
- Sticky header
- Loading skeleton (3 rows of shimmer)
- Empty state slot
- Pagination: `[Prev] [1] [2] ... [N] [Next]` + "Showing X–Y of Z"

```css
.table { width: 100%; border-collapse: collapse; }
.table th {
  background: var(--color-neutral-50);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-width-thin) solid var(--border-default);
}
.table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-width-thin) solid var(--border-default);
  font-size: var(--text-sm);
}
.table tr:hover td { background: var(--color-neutral-50); }
.table tr.selected td { background: var(--color-brand-50); }
```

---

### 4.4 Modal

```jsx
// Props
{
  isOpen: boolean,
  onClose: () => void,
  title: string,
  size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen',
  footer: ReactNode,
  closeOnOverlayClick: boolean
}
```

Sizes:
| Size | Max Width |
|------|-----------|
| `sm` | 400px |
| `md` | 560px |
| `lg` | 720px |
| `xl` | 960px |
| `fullscreen` | 100vw |

Animation: slide-up + fade-in on open, reverse on close.

---

### 4.5 Toast / Notification

```jsx
// Props
{
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  duration: number,  // ms, 0 = persistent
  action: { label, onClick } | null
}
```

Position: bottom-right, stacked, max 5 visible.
Animation: slide-in from right, auto-dismiss with progress bar.

---

### 4.6 MailCompose

Full compose window (modal or inline panel).

```
┌─────────────────────────────────────────────┐
│ [X Close]  Compose New Message   [Minimize] │
├─────────────────────────────────────────────┤
│ To:   [recipient chips + input]             │
│ Cc:   [toggle]                              │
│ Bcc:  [toggle]                              │
│ Subject: [input]                            │
├─────────────────────────────────────────────┤
│ [Rich Text Toolbar]                         │
│ B  I  U  S  | Link  Image  | List  Quote   │
├─────────────────────────────────────────────┤
│                                             │
│  [Body — contenteditable]                  │
│                                             │
├─────────────────────────────────────────────┤
│ [Attach] [Template] [Schedule]  [Send →]   │
└─────────────────────────────────────────────┘
```

---

### 4.7 ChatPanel

Right-side panel or full-page view.

```
┌──────────────────────────────────────────┐
│ [← Back]  [Avatar] Name  [Video] [Info] │  ← Header
├──────────────────────────────────────────┤
│                                          │
│  [Message list — virtualized scroll]    │  ← Body
│                                          │
├──────────────────────────────────────────┤
│ [Attach] [Emoji]  [Input...]  [Send →]  │  ← Footer
└──────────────────────────────────────────┘
```

---

## 5. Skeleton / Loading States

Every data-fetching component has a skeleton variant:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 25%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Skeleton shapes:
- `skeleton-text`: height 14px, various widths
- `skeleton-avatar`: circle, matches avatar sizes
- `skeleton-card`: full card height
- `skeleton-row`: table row height (48px)

---

## 6. Empty States

Standard empty state component:

```jsx
// Props
{ icon: ReactNode, title: string, description: string, action: ReactNode }
```

Layout:
```
        [Icon — 48px, neutral-300]
        [Title — text-lg, semibold]
        [Description — text-sm, secondary]
        [Action Button — optional]
```

Standard empty state messages:
| Context | Title | Description |
|---------|-------|-------------|
| Mail inbox | No messages | Your inbox is empty |
| Search results | No results | Try different keywords |
| Contacts | No contacts | Add your first contact |
| Chat | No conversations | Start a new conversation |
| Drive | No files | Upload or create a file |
| Notifications | All caught up | No new notifications |

---

*Part 02 of 03 — Next: Screen Flows & Interaction Patterns*
