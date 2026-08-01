# SSGzone Communication Platform
# DASHBOARD SPECIFICATION
# D2 — PART 2 OF 5
## SaaS Admin Dashboard

---

# SAAS ADMIN DASHBOARD

---

## Overview

The SaaS Admin Dashboard is the control panel for businesses that have purchased SSGzone as a platform to offer communication services to their own customers (tenants). A SaaS Admin manages their application, its tenants, billing, branding, and developer integrations.

**URL**: `https://app.ssgzone.in/saas-admin` or custom domain
**Access**: SaaS Admin role only
**Authentication**: Email + Password + optional 2FA (TOTP)

---

## 1. Navigation Structure

### 1.1 Primary Sidebar Menu

| Menu Item | Icon | Submenu Items |
|-----------|------|---------------|
| Dashboard | Grid | Overview |
| Tenants | Building | All Tenants, Create New, Suspended |
| Users | Users | All Users, Active, Inactive |
| Branding | Palette | Logo, Colors, Custom Domain |
| Billing | CreditCard | Current Plan, Usage, Invoices, Upgrade |
| Developer Hub | Code | API Keys, Webhooks, SDK, Sandbox |
| Analytics | BarChart | Usage, Mail, Chat, Storage |
| Settings | Settings | Application Settings, SSO, Security |
| Audit Log | FileText | Activity History |
| Support | HelpCircle | Tickets, Documentation |

### 1.2 Top Bar

| Element | Description |
|---------|-------------|
| Application Logo | SaaS app's own logo (white-labeled) |
| Application Name | SaaS app name |
| Global Search | Search tenants and users |
| Notifications Bell | Alerts: quota warnings, failed webhooks, billing |
| Admin Profile Menu | Profile, 2FA Settings, Logout |

---

## 2. Dashboard Overview Page

### 2.1 Summary Cards (Top Row)

| Card | Metric | Refresh |
|------|--------|---------|
| Total Tenants | Count of all tenants | Real-time |
| Total Users | Count of all users across tenants | Real-time |
| Storage Used | Total storage used (GB / quota) | Every 15 min |
| Emails This Month | Total emails sent this month | Every 5 min |
| Active Users Today | Users who logged in today | Every 5 min |
| Plan | Current billing plan name | Static |
| Days Until Renewal | Billing cycle countdown | Daily |
| Open Support Tickets | Count of unresolved tickets | Real-time |

### 2.2 Charts Section

| Chart | Type | Data | Time Range |
|-------|------|------|------------|
| Tenant Growth | Line chart | New tenants per day | 30d, 90d |
| User Growth | Bar chart | New users per day | 30d, 90d |
| Email Volume | Line chart | Emails sent per day | 7d, 30d |
| Storage Growth | Area chart | Storage used over time | 30d, 90d |
| Active Users | Bar chart | Daily active users | 7d, 30d |

### 2.3 Plan Usage Panel

| Metric | Display |
|--------|---------|
| Tenants Used / Limit | Progress bar (e.g., 45 / 100) |
| Users Used / Limit | Progress bar |
| Storage Used / Limit | Progress bar |
| Emails Sent / Monthly Limit | Progress bar |
| API Calls This Month / Limit | Progress bar |

**Warning**: Yellow at 80%, Red at 95%, with "Upgrade Plan" CTA button

### 2.4 Recent Activity Feed

Last 20 events:
- New tenant created
- New user added
- Webhook delivery failed
- API key created/rotated
- Billing payment processed
- Tenant suspended

---

## 3. Tenants Section

### 3.1 All Tenants — Table

| Column | Description | Sortable | Filterable |
|--------|-------------|----------|------------|
| Tenant Name | Organization name | Yes | Yes |
| Slug | URL slug | No | Yes |
| Users | User count | Yes | No |
| Storage Used | Storage in GB | Yes | No |
| Emails This Month | Email volume | Yes | No |
| Status | Active / Suspended / Pending | No | Yes |
| Created Date | Registration date | Yes | Yes (date range) |
| Actions | View, Edit, Suspend, Delete | No | No |

**Filters**: Status, Date Range, Search by Name/Slug

**Bulk Actions**: Suspend Selected, Export Selected

**Export**: CSV, Excel

### 3.2 Create New Tenant — Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Organization Name | Text | Yes | 2–100 characters |
| Slug | Text | Yes | Lowercase, alphanumeric, hyphens, unique |
| Admin First Name | Text | Yes | 2–50 characters |
| Admin Last Name | Text | Yes | 2–50 characters |
| Admin Email | Email | Yes | Valid email, unique |
| Admin Password | Password | Yes | Complexity rules |
| Max Users | Number | Yes | Within SaaS plan limits |
| Storage Quota (GB) | Number | Yes | Within SaaS plan limits |
| Custom Domain | Text | No | Valid domain format |

**Buttons**: Create Tenant, Cancel

**On Success**: Success toast, redirect to tenant detail, send welcome email to Tenant Admin

### 3.3 Tenant Detail Page

**Tabs**: Overview, Users, Mail Settings, Storage, Branding Override, Settings

**Overview Cards**: Total Users, Active Users, Storage Used, Emails This Month

**Settings Tab Actions**:
- Edit tenant name and slug
- Change storage quota
- Change max users
- Suspend / Reactivate tenant
- Delete tenant (with 2-step confirmation)
- Reset Tenant Admin password

---

## 4. Users Section

### 4.1 All Users — Table

| Column | Sortable | Filterable |
|--------|----------|------------|
| Full Name | Yes | Yes |
| Email Address | No | Yes |
| Tenant | Yes | Yes |
| Status | No | Yes |
| 2FA Enabled | No | Yes |
| Last Login | Yes | Yes (date range) |
| Created Date | Yes | Yes (date range) |
| Actions | No | No |

**Actions per row**: View, Edit, Suspend, Reset Password, Delete

**Bulk Actions**: Suspend Selected, Export Selected

**Export**: CSV, Excel

---

## 5. Branding Section

### 5.1 Branding Configuration

| Setting | Type | Description |
|---------|------|-------------|
| Application Logo | File Upload | PNG/SVG, max 2MB, shown in all portals |
| Favicon | File Upload | ICO/PNG, 32x32 |
| Primary Color | Color Picker | Main brand color (buttons, links) |
| Secondary Color | Color Picker | Accent color |
| Background Color | Color Picker | Dashboard background |
| Text Color | Color Picker | Primary text color |
| Application Name | Text | Shown in browser tab and emails |
| Support Email | Email | Shown in system emails |
| Custom Domain | Text | e.g., `mail.mycompany.com` |

**Preview Button**: Shows a live preview of the dashboard with applied branding

**Save Button**: Applies branding to all tenant portals immediately

**Reset to Default Button**: Reverts to SSGzone default branding

### 5.2 Email Template Branding

| Template | Customizable Fields |
|----------|---------------------|
| Welcome Email | Logo, brand name, support email, colors |
| Password Reset | Logo, brand name |
| Meeting Invitation | Logo, brand name |
| Storage Quota Warning | Logo, brand name |

---

## 6. Developer Hub Section

### 6.1 API Keys — Table

| Column | Description |
|--------|-------------|
| Key Name | Descriptive name |
| Key Prefix | First 8 characters (rest hidden) |
| Created Date | When key was created |
| Last Used | Last API call timestamp |
| Expires | Expiry date |
| Status | Active / Expired / Revoked |
| Actions | View, Rotate, Revoke |

**Create New API Key Button**:
- Field: Key Name (required)
- Field: Expiry (30 days / 90 days / 1 year / Never)
- On create: Show full key ONCE — user must copy it

### 6.2 Webhooks — Table

| Column | Description |
|--------|-------------|
| Endpoint URL | Webhook destination URL |
| Events | Which events trigger this webhook |
| Status | Active / Paused / Failed |
| Last Delivery | Timestamp of last delivery attempt |
| Success Rate | % of successful deliveries |
| Actions | Edit, Test, Pause, Delete |

**Create Webhook Button**:
- Field: Endpoint URL
- Field: Events (multi-select checkboxes)
  - tenant.created, tenant.deleted
  - user.created, user.deleted
  - mail.sent, mail.bounced
  - storage.quota_warning
- Field: Secret (for HMAC signature)

**Webhook Delivery Log**:
- Table: Timestamp, Event, Status, Response Code, Response Body, Retry Count
- Filter: Date Range, Event Type, Status
- Action per row: Retry

### 6.3 SDK Section

| SDK | Download | Documentation Link |
|-----|----------|--------------------|
| Node.js SDK | Download button + npm install command | Link to docs |
| Python SDK | Download button + pip install command | Link to docs |

### 6.4 Sandbox Environment

| Feature | Description |
|---------|-------------|
| Sandbox Toggle | Switch between Production and Sandbox mode |
| Sandbox API Key | Separate key for sandbox — shown here |
| Reset Sandbox | Clears all sandbox data |
| Sandbox Indicator | Red banner shown when in sandbox mode |

---

## 7. Analytics Section

### 7.1 Usage Analytics

| Chart | Type | Filters |
|-------|------|---------|
| Daily Active Users | Line chart | Tenant, Date Range |
| New Users Per Day | Bar chart | Tenant, Date Range |
| Login Activity by Hour | Heatmap | Tenant, Date Range |
| Feature Usage | Bar chart (Mail, Chat, Calendar, Drive, Video) | Tenant, Date Range |

### 7.2 Mail Analytics

| Chart | Type | Filters |
|-------|------|---------|
| Emails Sent Per Day | Line chart | Tenant, Date Range |
| Delivery Rate | Line chart | Tenant, Date Range |
| Bounce Rate | Line chart | Tenant, Date Range |
| Top Senders | Table (user, count) | Tenant, Date Range |

### 7.3 Storage Analytics

| Widget | Description |
|--------|-------------|
| Storage by Tenant | Bar chart — storage used per tenant |
| Storage by Module | Pie chart — Mail vs Drive vs Attachments |
| Storage Growth | Area chart over time |
| Top Storage Users | Table (user, tenant, storage used) |

---

## 8. Settings Section

### 8.1 Application Settings

| Setting | Type | Description |
|---------|------|-------------|
| Application Name | Text | Editable |
| Application Slug | Text | Read-only after creation |
| Default Language | Dropdown | English, Hindi, etc. |
| Default Timezone | Dropdown | All timezones |
| Default Storage Quota per Tenant | Number | GB |
| Default Max Users per Tenant | Number | Count |
| Allow Tenant Admins to Create Users | Toggle | On/Off |
| Allow Custom Domains for Tenants | Toggle | On/Off |

### 8.2 SSO Configuration

| Field | Description |
|-------|-------------|
| SSO Provider | Dropdown: None, SAML 2.0, OAuth2 |
| IdP Metadata URL | For SAML — IdP metadata endpoint |
| Entity ID | SAML entity ID |
| ACS URL | Read-only — provided to IdP |
| Test SSO Button | Initiates a test SSO login flow |

### 8.3 Security Settings

| Setting | Type | Description |
|---------|------|-------------|
| Require 2FA for Tenant Admins | Toggle | Enforce 2FA |
| Session Timeout | Dropdown | 15 min / 1 hour / 8 hours / 24 hours |
| IP Allowlist | Text area | Restrict admin access to specific IPs |
| Password Policy | Dropdown | Standard / Strong / Very Strong |

---

## 9. Audit Log Section

### 9.1 Audit Log Table

| Column | Filterable |
|--------|------------|
| Timestamp | Yes (date range) |
| Actor | Yes (search) |
| Action | Yes (search) |
| Target | Yes |
| IP Address | Yes |
| Result | Yes (Success / Failed) |

**Export**: CSV, Excel (max 50,000 rows)

**Note**: Audit logs are read-only — no edit or delete

---

## 10. Permissions

| Action | SaaS Admin | Tenant Admin | End User |
|--------|------------|--------------|----------|
| Access SaaS Admin Dashboard | ✅ | ❌ | ❌ |
| Create / Delete Tenants | ✅ | ❌ | ❌ |
| Manage Branding | ✅ | ❌ | ❌ |
| Create / Revoke API Keys | ✅ | ❌ | ❌ |
| Configure Webhooks | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ❌ | ❌ |
| View Billing | ✅ | ❌ | ❌ |
| Configure SSO | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |

---

## 11. Key Workflows

### 11.1 Create and Onboard a New Tenant
```
SaaS Admin clicks "Create New Tenant"
  → Fills form (name, slug, admin email, quotas)
  → System creates tenant record
  → System creates Tenant Admin account
  → System provisions DNS subdomain
  → System provisions mail server for subdomain
  → System provisions MinIO storage bucket
  → Welcome email sent to Tenant Admin
  → Redirect to tenant detail page
```

### 11.2 Rotate API Key
```
SaaS Admin clicks "Rotate" on an API key
  → Warning dialog: "Rotating this key will invalidate the current key immediately."
  → On confirm: new key generated
  → New key shown ONCE — must be copied
  → Old key immediately invalidated
  → Audit log entry created
```

### 11.3 Upgrade Billing Plan
```
SaaS Admin clicks "Upgrade Plan"
  → Plan comparison table shown
  → SaaS Admin selects new plan
  → Payment confirmation screen
  → On payment success: plan upgraded immediately
  → New limits applied to all tenants
  → Invoice generated and emailed
```

---

*End of D2 Part 2 of 5*
*Next: DASHBOARD_PART_03.md — Tenant Admin Dashboard*
