# SSGzone Communication Platform
# DASHBOARD SPECIFICATION
# D2 — PART 3 OF 5
## Tenant Admin Dashboard

---

# TENANT ADMIN DASHBOARD

---

## Overview

The Tenant Admin Dashboard is the control panel for an organization (tenant) that uses SSGzone through a SaaS application. The Tenant Admin manages their organization's users, departments, communication settings, and compliance. They operate within the limits set by the SaaS Admin.

**URL**: `https://[tenant-slug].[saas-slug].ssgzone.in/admin` or custom domain
**Access**: Tenant Admin role only
**Authentication**: Email + Password + optional 2FA (TOTP)

---

## 1. Navigation Structure

### 1.1 Primary Sidebar Menu

| Menu Item | Icon | Submenu Items |
|-----------|------|---------------|
| Dashboard | Grid | Overview |
| Users | Users | All Users, Create User, Bulk Import, Inactive |
| Departments | Sitemap | All Departments, Create Department |
| Mail Settings | Mail | Domain, DKIM, Aliases, Shared Mailboxes |
| Communication | MessageSquare | Chat Settings, Video Settings |
| Storage | HardDrive | Usage, Quotas, Shared Folders |
| Permissions | Lock | Roles, Custom Permissions |
| Compliance | Shield | Retention Policies, Audit Log, GDPR |
| Branding | Palette | Logo, Colors (within SaaS limits) |
| Settings | Settings | Organization Settings, Security, 2FA |
| Reports | BarChart | User Reports, Mail Reports, Storage Reports |
| Support | HelpCircle | Tickets, Help |

### 1.2 Top Bar

| Element | Description |
|---------|-------------|
| Organization Logo | Tenant's own logo |
| Organization Name | Tenant name |
| Search | Search users and departments |
| Notifications Bell | Quota warnings, user requests, system alerts |
| Admin Profile Menu | Profile, 2FA Settings, Logout |

---

## 2. Dashboard Overview Page

### 2.1 Summary Cards (Top Row)

| Card | Metric | Refresh |
|------|--------|---------|
| Total Users | Count of all users | Real-time |
| Active Users Today | Users logged in today | Every 5 min |
| Storage Used | GB used / GB quota | Every 15 min |
| Emails Sent Today | Emails sent in last 24h | Every 5 min |
| Chat Messages Today | Messages sent today | Every 5 min |
| Active Video Rooms | Current video meetings | Real-time |
| Pending User Requests | Users awaiting approval | Real-time |
| Open Support Tickets | Unresolved tickets | Real-time |

### 2.2 Charts Section

| Chart | Type | Data | Time Range |
|-------|------|------|------------|
| User Activity | Line chart | Daily active users | 7d, 30d |
| Email Volume | Bar chart | Emails sent per day | 7d, 30d |
| Storage Usage | Area chart | Storage used over time | 30d, 90d |
| Department Activity | Bar chart | Active users per department | 7d, 30d |

### 2.3 Resource Usage Panel

| Resource | Display |
|----------|---------|
| Users: Used / Limit | Progress bar |
| Storage: Used / Limit | Progress bar |
| Emails: Sent / Monthly Limit | Progress bar |

**Warning**: Yellow at 80%, Red at 95%

### 2.4 Recent Activity Feed

Last 20 events:
- New user created
- User login from new device
- Storage quota warning
- Department created
- Retention policy triggered
- Failed login attempts

---

## 3. Users Section

### 3.1 All Users — Table

| Column | Description | Sortable | Filterable |
|--------|-------------|----------|------------|
| Full Name | User's name | Yes | Yes |
| Email Address | Platform email | No | Yes |
| Department | Assigned department | Yes | Yes |
| Role | User / Manager / Admin | No | Yes |
| Status | Active / Inactive / Suspended | No | Yes |
| 2FA | Enabled / Disabled | No | Yes |
| Storage Used | User's storage | Yes | No |
| Last Login | Last login timestamp | Yes | Yes (date range) |
| Created Date | Account creation date | Yes | Yes (date range) |
| Actions | View, Edit, Suspend, Reset Password, Delete | No | No |

**Filters**: Status, Department, Role, 2FA Status, Date Range, Search by Name/Email

**Bulk Actions**:
- Suspend Selected
- Activate Selected
- Move to Department
- Reset Password (sends email)
- Export Selected
- Delete Selected (with confirmation)

**Export**: CSV, Excel

### 3.2 Create User — Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| First Name | Text | Yes | 2–50 characters |
| Last Name | Text | Yes | 2–50 characters |
| Username | Text | Yes | Lowercase, alphanumeric, dots, unique |
| Email (auto-generated) | Read-only | — | `username@tenant.saas.ssgzone.in` |
| Password | Password | Yes | Complexity rules |
| Department | Dropdown | No | From existing departments |
| Role | Dropdown | Yes | User / Manager |
| Storage Quota (GB) | Number | Yes | Within tenant limits |
| Send Welcome Email | Toggle | Yes | Default: On |

**Buttons**: Create User, Create and Add Another, Cancel

### 3.3 Bulk Import Users — Form

| Feature | Description |
|---------|-------------|
| Download Template | CSV template with required columns |
| Upload CSV | File upload — max 1,000 users per import |
| Preview | Show first 10 rows before import |
| Validation | Highlight rows with errors before import |
| Import Button | Runs import as background job |
| Progress Indicator | Shows import progress |
| Result Summary | Shows created / skipped / failed counts |

**Required CSV Columns**: first_name, last_name, username, department, role

### 3.4 User Detail Page

**Tabs**: Profile, Mail, Storage, Activity, Permissions, Security

**Profile Tab**:
- Edit name, department, role, phone, bio
- Profile photo upload

**Mail Tab**:
- Email address (read-only)
- Aliases (add/remove)
- Storage quota (editable)
- Mail usage chart

**Activity Tab**:
- Login history table (date, IP, device, result)
- Last 30 days activity summary

**Security Tab**:
- Reset password button
- Revoke all sessions button
- 2FA status + reset 2FA button
- Suspend / Reactivate account button

---

## 4. Departments Section

### 4.1 All Departments — Table

| Column | Description | Sortable |
|--------|-------------|----------|
| Department Name | Name | Yes |
| Manager | Assigned manager | No |
| Users | User count | Yes |
| Created Date | Creation date | Yes |
| Actions | View, Edit, Delete | No |

### 4.2 Create Department — Form

| Field | Type | Required |
|-------|------|----------|
| Department Name | Text | Yes |
| Department Manager | User search dropdown | No |
| Description | Textarea | No |

### 4.3 Department Detail Page

- Department info (name, manager, description)
- Users table (same as All Users but filtered to this department)
- Move users to another department button
- Delete department button (users are not deleted — moved to "No Department")

---

## 5. Mail Settings Section

### 5.1 Domain Settings

| Setting | Description |
|---------|-------------|
| Primary Domain | Read-only — `tenant.saas.ssgzone.in` |
| Custom Domain | Add/edit custom domain |
| DNS Verification Status | Verified / Pending / Failed with instructions |
| Verify DNS Button | Re-check DNS records |

### 5.2 DKIM Status

| Field | Description |
|-------|-------------|
| DKIM Status | Active / Inactive |
| DKIM Selector | Current selector name |
| DNS Record | TXT record to publish (copy button) |
| Regenerate DKIM | Button — requires DNS update |

### 5.3 Shared Mailboxes

| Column | Description |
|--------|-------------|
| Mailbox Name | e.g., `support@tenant.saas.ssgzone.in` |
| Members | Users with access |
| Status | Active / Inactive |
| Actions | Edit, Delete |

**Create Shared Mailbox Button**:
- Field: Mailbox name (prefix only — domain is fixed)
- Field: Members (multi-select user search)

### 5.4 Email Aliases

| Column | Description |
|--------|-------------|
| Alias Address | The alias email |
| Delivers To | Primary user |
| Status | Active / Inactive |
| Actions | Edit, Delete |

---

## 6. Communication Settings Section

### 6.1 Chat Settings

| Setting | Type | Description |
|---------|------|-------------|
| Allow External File Sharing | Toggle | Users can share files from Drive in chat |
| Message Retention Period | Dropdown | 30 days / 90 days / 1 year / Forever |
| Allow Users to Create Channels | Toggle | On/Off |
| Allow Direct Messages | Toggle | On/Off |
| Max File Size in Chat | Dropdown | 10MB / 25MB / 50MB |

### 6.2 Video Settings

| Setting | Type | Description |
|---------|------|-------------|
| Allow Guest Access | Toggle | Non-platform users can join meetings |
| Max Participants Per Room | Dropdown | 10 / 25 / 50 |
| Allow Recording | Toggle | On/Off (Phase 3 feature) |
| Default Meeting Duration | Dropdown | 30 min / 1 hour / 2 hours / Unlimited |

---

## 7. Permissions Section

### 7.1 Roles Overview

| Role | Description | Editable |
|------|-------------|----------|
| User | Standard end user | No (base role) |
| Manager | Can manage their department's users | Yes |
| Tenant Admin | Full tenant management | No (this role) |

### 7.2 Custom Permissions (Manager Role)

| Permission | Toggle |
|------------|--------|
| Can create users in their department | On/Off |
| Can reset passwords in their department | On/Off |
| Can view department analytics | On/Off |
| Can create shared mailboxes | On/Off |
| Can manage department chat channels | On/Off |

---

## 8. Compliance Section

### 8.1 Retention Policies

| Policy | Setting | Description |
|--------|---------|-------------|
| Email Retention | Dropdown: 30d / 90d / 1y / 3y / Forever | Auto-delete emails after period |
| Chat Retention | Dropdown: 30d / 90d / 1y / Forever | Auto-delete messages after period |
| File Retention | Dropdown: 1y / 3y / 5y / Forever | Auto-delete files after period |
| Audit Log Retention | Read-only: 1 year | Set by SaaS Admin |

**Save Retention Policy Button**

**Warning**: "Retention policies permanently delete data. This cannot be undone."

### 8.2 GDPR Tools

| Tool | Description |
|------|-------------|
| Export User Data | Select user → export all their data as ZIP |
| Delete User Data | Select user → GDPR erasure request |
| Deletion Queue | Table of pending deletion requests with status |

### 8.3 Audit Log Table

| Column | Filterable |
|--------|------------|
| Timestamp | Yes (date range) |
| Actor | Yes (search by name/email) |
| Action | Yes (search) |
| Target | Yes |
| IP Address | Yes |
| Result | Yes |

**Export**: CSV (max 10,000 rows)

**Note**: Read-only — no edit or delete

---

## 9. Reports Section

### 9.1 Available Reports

| Report | Description | Format |
|--------|-------------|--------|
| User Activity Report | Login history, active days per user | CSV, Excel |
| Mail Usage Report | Emails sent/received per user | CSV, Excel |
| Storage Usage Report | Storage per user | CSV, Excel |
| Department Summary | Users, activity, storage per department | CSV, Excel, PDF |
| Inactive Users Report | Users with no login in 30+ days | CSV |

**All reports**: Date range filter, Department filter, Export button

---

## 10. Settings Section

### 10.1 Organization Settings

| Setting | Type | Description |
|---------|------|-------------|
| Organization Name | Text | Editable |
| Default Language | Dropdown | All supported languages |
| Default Timezone | Dropdown | All timezones |
| Default Storage Per User (GB) | Number | Within tenant quota |
| Welcome Email Template | Textarea | Customizable welcome message |

### 10.2 Security Settings

| Setting | Type | Description |
|---------|------|-------------|
| Require 2FA for All Users | Toggle | Enforce 2FA org-wide |
| Session Timeout | Dropdown | 1h / 4h / 8h / 24h |
| Password Policy | Dropdown | Standard / Strong / Very Strong |
| Login Attempt Limit | Number | 3 / 5 / 10 attempts before lockout |
| Lockout Duration | Dropdown | 5 min / 15 min / 1 hour |

---

## 11. Permissions

| Action | Tenant Admin | Manager | End User |
|--------|-------------|---------|----------|
| Access Tenant Admin Dashboard | ✅ | ❌ | ❌ |
| Create / Delete Users | ✅ | Configurable | ❌ |
| Create Departments | ✅ | ❌ | ❌ |
| Configure Mail Settings | ✅ | ❌ | ❌ |
| Configure Retention Policies | ✅ | ❌ | ❌ |
| Export User Data (GDPR) | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |
| View Reports | ✅ | Configurable | ❌ |
| Configure Branding | ✅ | ❌ | ❌ |

---

## 12. Key Workflows

### 12.1 Onboard a New User
```
Tenant Admin clicks "Create User"
  → Fills form (name, username, department, role)
  → System generates email address automatically
  → System creates user account
  → Welcome email sent with login credentials
  → User appears in All Users table
```

### 12.2 Bulk Import Users
```
Tenant Admin clicks "Bulk Import"
  → Downloads CSV template
  → Fills template with user data
  → Uploads CSV
  → System validates all rows
  → Preview shown with any errors highlighted
  → Tenant Admin fixes errors or proceeds
  → Import runs as background job
  → Completion notification sent to Tenant Admin
```

### 12.3 GDPR Data Export
```
Tenant Admin goes to Compliance → GDPR Tools
  → Selects user from dropdown
  → Clicks "Export User Data"
  → System queues export job
  → Export includes: all emails, contacts, calendar events, chat messages, files
  → Download link sent to Tenant Admin email when ready
  → Link expires after 24 hours
```

---

*End of D2 Part 3 of 5*
*Next: DASHBOARD_PART_04.md — End User / Employee Dashboard*
