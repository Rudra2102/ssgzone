# SSGzone Communication Platform
# DASHBOARD SPECIFICATION
# D2 — PART 1 OF 5
## Super Admin Dashboard

---

**Document Version**: 1.0
**Classification**: Internal — Product & Engineering
**Purpose**: Screen-level specification for every dashboard in the platform. This document defines menus, submenus, widgets, cards, tables, filters, buttons, permissions, workflows, and exports for each dashboard.

---

# SUPER ADMIN DASHBOARD

---

## Overview

The Super Admin Dashboard is the highest-level control panel of the entire SSGzone platform. It is accessible only to platform-level administrators employed by SSGzone itself. No SaaS Admin, Tenant Admin, or End User has access to this dashboard.

**URL**: `https://admin.ssgzone.in`
**Access**: Super Admin role only
**Authentication**: Email + Password + mandatory 2FA (TOTP)

---

## 1. Navigation Structure

### 1.1 Primary Sidebar Menu

| Menu Item | Icon | Submenu Items |
|-----------|------|---------------|
| Dashboard | Grid | Overview |
| SaaS Applications | Briefcase | All Apps, Create New, Suspended |
| Tenants | Building | All Tenants, Active, Suspended, Deleted |
| Users | Users | All Users, Active, Inactive, Admins |
| Mail System | Mail | Health, Queue, Deliverability, DKIM/DMARC |
| Storage | Database | Usage Overview, MinIO Status, Quotas |
| DNS Manager | Globe | Records, Verification, Automation |
| Billing | CreditCard | Plans, Subscriptions, Invoices, Revenue |
| Security | Shield | Audit Logs, Active Sessions, Threats |
| System | Settings | Services, Configuration, Maintenance |
| Reports | BarChart | Platform Reports, Exports |
| Support | HelpCircle | Tickets, Announcements |

### 1.2 Top Bar

| Element | Description |
|---------|-------------|
| Platform Logo | SSGzone logo — links to Dashboard Overview |
| Global Search | Search across SaaS apps, tenants, users |
| Notifications Bell | Platform-level alerts and system notifications |
| Admin Profile Menu | Profile, Change Password, 2FA Settings, Logout |
| System Status Indicator | Green/Yellow/Red dot showing overall platform health |

---

## 2. Dashboard Overview Page

### 2.1 Summary Cards (Top Row)

| Card | Metric | Refresh |
|------|--------|---------|
| Total SaaS Applications | Count of all registered SaaS apps | Real-time |
| Total Tenants | Count of all tenants across all SaaS apps | Real-time |
| Total Users | Count of all active end users | Real-time |
| Emails Sent Today | Total emails sent in last 24 hours | Every 5 min |
| Active Chat Sessions | Current WebSocket connections | Real-time |
| Storage Used | Total storage used across all tenants (GB) | Every 15 min |
| Active Video Rooms | Currently active video meetings | Real-time |
| System Health | Overall health score (0–100) | Every 1 min |

### 2.2 Charts Section (Middle Row)

| Chart | Type | Data | Time Range Options |
|-------|------|------|--------------------|
| Email Volume | Line chart | Emails sent + received per day | 7d, 30d, 90d |
| New Tenants | Bar chart | New tenants created per day | 7d, 30d, 90d |
| New Users | Bar chart | New users created per day | 7d, 30d, 90d |
| Storage Growth | Area chart | Total storage used over time | 30d, 90d, 1y |
| Chat Activity | Line chart | Messages sent per day | 7d, 30d |

### 2.3 Service Health Panel (Right Column)

| Service | Status Shown | Action |
|---------|-------------|--------|
| API Gateway | Online / Degraded / Offline | View Logs |
| Mail Server (SMTP) | Online / Degraded / Offline | View Logs |
| Mail Server (IMAP) | Online / Degraded / Offline | View Logs |
| Calendar Service | Online / Degraded / Offline | View Logs |
| DNS Manager | Online / Degraded / Offline | View Logs |
| PostgreSQL | Online / Degraded / Offline | View Logs |
| Redis | Online / Degraded / Offline | View Logs |
| MinIO | Online / Degraded / Offline | View Logs |
| Elasticsearch | Online / Degraded / Offline | View Logs |
| Video Server | Online / Degraded / Offline | View Logs |

### 2.4 Recent Activity Feed (Bottom)

Shows last 20 platform-level events:
- New SaaS application registered
- New tenant created
- User account suspended
- Mail delivery failure spike
- Storage quota exceeded
- Security alert triggered

---

## 3. SaaS Applications Section

### 3.1 All SaaS Applications — Table

| Column | Description | Sortable | Filterable |
|--------|-------------|----------|------------|
| App Name | Name of the SaaS application | Yes | Yes |
| Slug | URL slug (e.g., `lms`) | No | Yes |
| Owner Email | SaaS Admin email | No | Yes |
| Plan | Current billing plan | Yes | Yes |
| Tenants | Number of tenants | Yes | No |
| Users | Total users across all tenants | Yes | No |
| Storage Used | Total storage used | Yes | No |
| Status | Active / Suspended / Pending | No | Yes |
| Created Date | Registration date | Yes | Yes (date range) |
| Actions | View, Edit, Suspend, Delete | No | No |

**Filters Available**: Status, Plan, Date Range, Search by Name/Slug/Email

**Bulk Actions**: Suspend Selected, Delete Selected, Export Selected

**Export**: CSV, Excel

### 3.2 Create New SaaS Application — Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Application Name | Text | Yes | 3–100 characters |
| Slug | Text | Yes | Lowercase, alphanumeric, hyphens only, unique |
| Admin First Name | Text | Yes | 2–50 characters |
| Admin Last Name | Text | Yes | 2–50 characters |
| Admin Email | Email | Yes | Valid email, unique |
| Admin Password | Password | Yes | Min 8 chars, complexity rules |
| Plan | Dropdown | Yes | Free, Starter, Professional, Enterprise |
| Max Tenants | Number | Yes | 1–1000 |
| Max Users Per Tenant | Number | Yes | 1–10000 |
| Storage Quota (GB) | Number | Yes | 1–10000 |
| Custom Domain | Text | No | Valid domain format |

**Buttons**: Create Application, Cancel

**On Success**: Show success toast, redirect to app detail page, send welcome email to admin

### 3.3 SaaS Application Detail Page

**Tabs**: Overview, Tenants, Users, Billing, Branding, Settings, Audit Log

**Overview Tab Cards**:
- Total Tenants, Total Users, Storage Used, Emails Sent This Month, Plan Details

**Tenants Tab**: Table of all tenants under this app (same columns as Tenant section)

**Branding Tab**:
- Logo upload (PNG, max 2MB)
- Primary color picker
- Secondary color picker
- Custom domain field
- Preview button

**Settings Tab**:
- Suspend / Reactivate Application
- Reset Admin Password
- Regenerate API Keys
- Delete Application (with confirmation dialog)

---

## 4. Tenants Section

### 4.1 All Tenants — Table

| Column | Sortable | Filterable |
|--------|----------|------------|
| Tenant Name | Yes | Yes |
| Slug | No | Yes |
| SaaS Application | Yes | Yes |
| Users | Yes | No |
| Storage Used | Yes | No |
| Status | No | Yes |
| Created Date | Yes | Yes (date range) |
| Actions | No | No |

**Actions per row**: View, Edit, Suspend, Delete

**Bulk Actions**: Suspend Selected, Export Selected

### 4.2 Tenant Detail Page

**Tabs**: Overview, Users, Mail, Storage, Settings, Audit Log

**Overview Cards**: Total Users, Active Users, Storage Used, Emails This Month, Chat Messages This Month

---

## 5. Users Section

### 5.1 All Users — Table

| Column | Sortable | Filterable |
|--------|----------|------------|
| Full Name | Yes | Yes |
| Email Address | No | Yes |
| Tenant | Yes | Yes |
| SaaS App | Yes | Yes |
| Role | No | Yes |
| Status | No | Yes |
| 2FA Enabled | No | Yes |
| Last Login | Yes | Yes (date range) |
| Created Date | Yes | Yes (date range) |
| Actions | No | No |

**Actions per row**: View, Edit, Suspend, Reset Password, Impersonate, Delete

**Impersonate**: Logs the impersonation in audit log, opens user's session in new tab

**Bulk Actions**: Suspend Selected, Reset Password Selected, Export Selected

**Export**: CSV, Excel

---

## 6. Mail System Section

### 6.1 Mail Health Dashboard

| Widget | Description |
|--------|-------------|
| Delivery Rate (24h) | % of emails successfully delivered |
| Bounce Rate (24h) | % of emails bounced |
| Spam Rate (24h) | % of emails marked as spam |
| Queue Depth | Current number of emails in send queue |
| Average Delivery Time | Average time from send to delivery |
| DKIM Pass Rate | % of outgoing emails with valid DKIM |
| DMARC Pass Rate | % of outgoing emails passing DMARC |

### 6.2 Mail Queue Table

| Column | Description |
|--------|-------------|
| Message ID | Unique message identifier |
| From | Sender address |
| To | Recipient address |
| Subject | Email subject |
| Status | Queued / Sending / Failed / Retrying |
| Attempts | Number of delivery attempts |
| Next Retry | Scheduled retry time |
| Created | Queue entry time |

**Actions**: Force Retry, Remove from Queue, View Full Message

### 6.3 DKIM / DMARC Management

| Feature | Description |
|---------|-------------|
| DKIM Records Table | All DKIM keys per SaaS app/tenant with status |
| Regenerate DKIM | Button to regenerate DKIM key for a domain |
| DMARC Policy Table | DMARC policy per domain |
| Edit DMARC Policy | Set p=none / quarantine / reject |
| Verify DNS | Button to verify DNS records are correctly published |

---

## 7. Security Section

### 7.1 Audit Log Table

| Column | Filterable |
|--------|------------|
| Timestamp | Yes (date range) |
| Actor | Yes (search by email) |
| Actor Role | Yes |
| Action | Yes (search) |
| Target | Yes |
| IP Address | Yes |
| Result | Yes (Success / Failed) |

**Filters**: Date Range, Actor, Action Type, Role, IP Address

**Export**: CSV, Excel (max 100,000 rows per export)

**Note**: Audit logs are immutable — no edit or delete buttons

### 7.2 Active Sessions Table

| Column | Description |
|--------|-------------|
| User | Email address |
| Role | User role |
| IP Address | Login IP |
| Device | Browser / OS |
| Login Time | Session start time |
| Last Activity | Last API call time |
| Actions | Revoke Session |

**Bulk Action**: Revoke All Sessions (emergency use)

### 7.3 Security Alerts Panel

Displays last 50 security events:
- Failed login attempts (5+ from same IP)
- Impersonation events
- API key rotation
- Suspicious activity flags

---

## 8. Reports Section

### 8.1 Available Reports

| Report Name | Description | Format | Schedule |
|-------------|-------------|--------|----------|
| Platform Usage Summary | Users, tenants, storage, mail volume | CSV, Excel, PDF | On-demand, Monthly |
| Mail Deliverability Report | DKIM, DMARC, bounce, spam rates | CSV, PDF | On-demand, Weekly |
| Storage Usage Report | Per-tenant storage breakdown | CSV, Excel | On-demand, Monthly |
| Security Audit Report | All admin actions in date range | CSV, PDF | On-demand |
| New Registrations Report | New SaaS apps and tenants | CSV | On-demand, Monthly |
| Revenue Report | Billing and subscription data | CSV, Excel, PDF | On-demand, Monthly |

---

## 9. Permissions

| Action | Super Admin | SaaS Admin | Tenant Admin | End User |
|--------|-------------|------------|--------------|----------|
| Access Super Admin Dashboard | ✅ | ❌ | ❌ | ❌ |
| Create SaaS Application | ✅ | ❌ | ❌ | ❌ |
| Suspend SaaS Application | ✅ | ❌ | ❌ | ❌ |
| Delete SaaS Application | ✅ | ❌ | ❌ | ❌ |
| Impersonate any user | ✅ | ❌ | ❌ | ❌ |
| View all audit logs | ✅ | ❌ | ❌ | ❌ |
| Revoke any session | ✅ | ❌ | ❌ | ❌ |
| View mail queue | ✅ | ❌ | ❌ | ❌ |
| Manage DKIM/DMARC | ✅ | ❌ | ❌ | ❌ |
| View platform reports | ✅ | ❌ | ❌ | ❌ |

---

## 10. Key Workflows

### 10.1 Onboard New SaaS Application
```
Super Admin clicks "Create New SaaS App"
  → Fills form (name, slug, admin email, plan)
  → System creates SaaS app record
  → System creates SaaS Admin account
  → System sends welcome email to SaaS Admin
  → System provisions default DNS records
  → Redirect to SaaS App detail page
```

### 10.2 Suspend SaaS Application
```
Super Admin clicks "Suspend" on SaaS App
  → Confirmation dialog: "This will suspend all tenants and users. Confirm?"
  → On confirm: all tenants suspended, all users blocked from login
  → Audit log entry created
  → SaaS Admin receives suspension notification email
```

### 10.3 Impersonate User
```
Super Admin clicks "Impersonate" on a user
  → Confirmation dialog: "You are about to impersonate [user]. This will be logged."
  → On confirm: impersonation session created
  → Audit log entry created with Super Admin identity
  → New browser tab opens with user's session
  → Banner shown: "You are impersonating [user]. Click to end."
```

---

*End of D2 Part 1 of 5*
*Next: DASHBOARD_PART_02.md — SaaS Admin Dashboard*
