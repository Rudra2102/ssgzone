# SSGzone Communication Platform
# DASHBOARD SPECIFICATION
# D2 — PART 4 OF 5
## End User / Employee Dashboard

---

# END USER / EMPLOYEE DASHBOARD

---

## Overview

The End User Dashboard is the personal workspace for every employee in an organization. It is the entry point to all communication tools — mail, chat, calendar, contacts, drive, video, and notifications. It must be fast, intuitive, and accessible from any browser.

**URL**: `https://[tenant-slug].[saas-slug].ssgzone.in` or custom domain
**Access**: End User role (Employee)
**Authentication**: Email + Password + optional 2FA

---

## 1. Navigation Structure

### 1.1 Primary Left Sidebar

| Item | Icon | Description |
|------|------|-------------|
| Home | Home | Personal dashboard / activity feed |
| Mail | Mail | Webmail interface |
| Chat | MessageSquare | Internal messaging |
| Calendar | Calendar | Personal and shared calendars |
| Contacts | Users | Personal contacts + org directory |
| Drive | HardDrive | Personal and shared file storage |
| Video | Video | Start or join a meeting |
| Notifications | Bell | All notifications |
| Search | Search | Unified search |
| Profile | User | Personal profile and settings |

### 1.2 Top Bar

| Element | Description |
|---------|-------------|
| Organization Logo | White-labeled logo |
| Global Search Bar | Unified search across all modules |
| Presence Status Indicator | Colored dot — click to change status |
| Notifications Bell | Unread count badge |
| Profile Avatar | Click to open profile menu |

### 1.3 Profile Menu (Top Right)

| Item | Action |
|------|--------|
| My Profile | Opens profile edit page |
| Settings | Opens personal settings |
| Change Password | Password change form |
| 2FA Settings | Enable/disable 2FA |
| Keyboard Shortcuts | Shows shortcut reference |
| Help | Opens documentation |
| Logout | Ends session, invalidates token |

---

## 2. Home Page (Personal Dashboard)

### 2.1 Summary Cards

| Card | Metric |
|------|--------|
| Unread Emails | Count with link to inbox |
| Unread Chat Messages | Count with link to chat |
| Today's Events | Count with link to calendar |
| Upcoming Meeting | Next meeting in next 2 hours |
| Files Shared With Me | New files shared today |
| Storage Used | GB used / GB quota |

### 2.2 Activity Feed

Chronological feed of recent activity:
- New email received (from, subject, time)
- New chat message (channel/person, preview, time)
- Calendar event reminder (event name, time)
- File shared with me (file name, shared by, time)
- @mention in chat (channel, preview, time)

Each item is clickable — navigates directly to the relevant item.

### 2.3 Today's Schedule Widget

- Mini calendar showing today's date
- List of today's events (time, title, location/video link)
- "Join" button for video meetings starting within 15 minutes
- "Add Event" quick button

### 2.4 Quick Actions Bar

| Button | Action |
|--------|--------|
| Compose Email | Opens compose window |
| New Chat Message | Opens new DM dialog |
| New Meeting | Creates a video room |
| Upload File | Opens Drive upload dialog |
| New Event | Opens calendar event form |

---

## 3. Profile & Settings Page

### 3.1 Profile Tab

| Field | Editable | Description |
|-------|----------|-------------|
| Profile Photo | Yes | Upload PNG/JPG, max 2MB |
| First Name | No (Admin only) | Display name |
| Last Name | No (Admin only) | Display name |
| Job Title | Yes | Shown in directory |
| Department | No (Admin only) | Assigned department |
| Phone Number | Yes | Optional, shown in directory if opted in |
| Bio | Yes | Short personal description |
| Show Phone in Directory | Toggle | Privacy control |

**Save Profile Button**

### 3.2 Preferences Tab

| Setting | Type | Options |
|---------|------|---------|
| Language | Dropdown | All supported languages |
| Timezone | Dropdown | All timezones |
| Date Format | Dropdown | DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD |
| Time Format | Dropdown | 12-hour, 24-hour |
| Theme | Toggle | Light / Dark |
| Email Notifications | Toggle | On/Off |
| Chat Notifications | Toggle | On/Off |
| Calendar Reminders | Toggle | On/Off |
| Drive Notifications | Toggle | On/Off |
| Email Digest | Dropdown | Daily / Weekly / Never |
| Push Notifications | Toggle | On/Off (requires browser permission) |

### 3.3 Security Tab

| Feature | Description |
|---------|-------------|
| Change Password | Current password + new password + confirm |
| 2FA Setup | QR code + manual key + backup codes |
| 2FA Disable | Requires current password confirmation |
| Active Sessions | Table of all active sessions with revoke button |
| Login History | Last 20 logins (date, IP, device, result) |

---

## 4. Presence Status Control

### 4.1 Status Options

| Status | Color | Description |
|--------|-------|-------------|
| Online | Green | Available and active |
| Away | Yellow | Logged in but inactive |
| Busy | Red | Do not disturb |
| Do Not Disturb | Red with line | No notifications |
| Offline | Grey | Appears offline to others |

### 4.2 Custom Status

- Text field: "What's your status?" (max 100 characters)
- Emoji picker for status emoji
- Duration: Until I change it / 30 min / 1 hour / Today / This week
- Clear status button

---

## 5. Notifications Center

### 5.1 Notification Panel (Bell Icon)

| Element | Description |
|---------|-------------|
| Unread Count Badge | Number on bell icon |
| "Mark All as Read" Button | Clears all unread |
| Filter Tabs | All / Mail / Chat / Calendar / Drive |
| Notification List | Scrollable list of notifications |

### 5.2 Notification Item Structure

Each notification shows:
- Module icon (mail, chat, calendar, drive)
- Short description ("John sent you a message")
- Timestamp (relative: "2 minutes ago")
- Unread indicator (blue dot)
- Click action (navigates to relevant item)

### 5.3 Notification Settings Link

"Manage notification preferences" link at bottom of panel → opens Settings → Preferences tab

---

## 6. Permissions

| Action | End User | Manager | Tenant Admin |
|--------|----------|---------|--------------|
| Access own mail | ✅ | ✅ | ✅ |
| Access own calendar | ✅ | ✅ | ✅ |
| Access own contacts | ✅ | ✅ | ✅ |
| Access own drive | ✅ | ✅ | ✅ |
| Join/create video meetings | ✅ | ✅ | ✅ |
| Send/receive chat messages | ✅ | ✅ | ✅ |
| View org directory | ✅ | ✅ | ✅ |
| Edit other users' profiles | ❌ | Dept only | ✅ |
| Access admin dashboard | ❌ | ❌ | ✅ |
| View other users' mail | ❌ | ❌ | ✅ (shared mailbox only) |

---

## 7. Key Workflows

### 7.1 First Login Experience
```
User logs in for the first time
  → Welcome screen shown
  → Step 1: Set profile photo and bio
  → Step 2: Set timezone and language
  → Step 3: Enable 2FA (optional but recommended)
  → Step 4: Enable push notifications (browser prompt)
  → Step 5: Tour of main features (skippable)
  → Redirect to Home Dashboard
```

### 7.2 Change Presence Status
```
User clicks presence dot in top bar
  → Status dropdown appears
  → User selects status (Online / Away / Busy / DND / Offline)
  → Optional: Set custom status message
  → Optional: Set duration
  → Status updates immediately across all modules
  → Other users see updated status in chat and directory
```

### 7.3 Unified Search
```
User clicks search bar or presses Ctrl+K
  → Search overlay opens
  → User types query (min 2 characters)
  → Results appear in real-time grouped by module:
      Mail (subject, sender)
      Chat (message preview, channel)
      Contacts (name, email)
      Files (filename, folder)
      Calendar (event name)
  → User clicks result → navigates to item
  → Filter tabs to narrow by module
  → Date range filter available
```

---

*End of D2 Part 4 of 5*
*Next: DASHBOARD_PART_05.md — Webmail Dashboard (End User Communication Interface)*
