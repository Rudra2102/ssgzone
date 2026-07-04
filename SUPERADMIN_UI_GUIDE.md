# SSGzone SuperAdmin UI Guide
## Frontend Tenant Management Manual

---

## 🎯 Dashboard Navigation

### Login & Access
1. **URL**: `https://admin.ssgzone.in`
2. **Credentials**: SuperAdmin account
3. **Dashboard**: Main control panel loads

### Sidebar Menu Structure
```
SSGzone
├── 📊 Overview
├── 🏢 Applications  
├── 📧 Communication
├── 👥 User Management
├── 📈 Analytics
└── ⚙️ System Config
```

---

## 🏢 Adding New Tenant Company

### Method 1: From Overview Dashboard

#### Step 1: Navigate to Tenant Management
```
Dashboard → Overview Tab → "Tenant Management" Tab
```

#### Step 2: Click Create Tenant Button
- **Location**: Top right corner
- **Button**: Blue "Create Tenant" button with + icon

#### Step 3: Fill Tenant Creation Form
```
┌─────────────────────────────────────────┐
│ Create New Tenant Company               │
├─────────────────────────────────────────┤
│ Company Name: [                       ] │ ← Required
│ Company Slug: [                       ] │ ← Auto-generated from name
│ SaaS App:     [▼ Select Application   ] │ ← Choose from dropdown
│ Admin Name:   [                       ] │ ← Tenant admin full name
│ Admin Email:  [                       ] │ ← Will be auto-formatted
│ Phone Number: [                       ] │ ← Optional
│ Max Users:    [100                    ] │ ← Based on plan
│ Plan:         [▼ Select Plan          ] │ ← Starter/Business/Enterprise
│ Notes:        [                       ] │ ← Optional comments
│                                         │
│ [Cancel]              [Create Tenant]   │
└─────────────────────────────────────────┘
```

#### Step 4: Form Validation & Auto-Fill
- **Company Slug**: Auto-generates from company name (e.g., "NABC Institute" → "nabc")
- **Admin Email**: Auto-formats as `admin@{slug}.{saas}.ssgzone.in`
- **Domain Preview**: Shows `{slug}.{saas}.ssgzone.in`
- **Plan Limits**: Updates max users based on selected plan

#### Step 5: Submit & Confirmation
1. **Click**: "Create Tenant" button
2. **Processing**: Loading spinner appears
3. **Success**: Green notification "Tenant created successfully"
4. **Auto-redirect**: To tenant details page

---

## 📋 Viewing Tenant Details

### Tenant List Table
**Location**: Overview → Tenant Management Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tenant Companies                                    [+ Create Tenant] [Export] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Company Name    │ SaaS App │ Admin Email              │ Users   │ Status │ ⚙️  │
├─────────────────┼──────────┼──────────────────────────┼─────────┼────────┼────┤
│ NABC Institute  │ PEMS     │ amit@nabc.pems.ssgzone   │ 45/500  │ 🟢 Active│ ⋯  │
│ TechCorp Ltd    │ CRM      │ admin@tech.crm.ssgzone   │ 23/200  │ 🟢 Active│ ⋯  │
│ EduHub Academy │ LMS      │ head@edu.lms.ssgzone     │ 156/500 │ 🟡 Trial │ ⋯  │
└─────────────────┴──────────┴──────────────────────────┴─────────┴────────┴────┘
```

### Individual Tenant Details Page
**Access**: Click on tenant row or Actions → "View Details"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Tenants    NABC Institute                    [Edit] [Delete] [⋯]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 📊 Quick Stats                                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐                   │
│ │ 👥 Users    │ 📧 Emails   │ 💬 WhatsApp │ 💾 Storage  │                   │
│ │ 45/500      │ 1,234 today │ 56/1000     │ 12.5/50 GB  │                   │
│ └─────────────┴─────────────┴─────────────┴─────────────┘                   │
│                                                                             │
│ 📋 Company Information                                                      │
│ • Company Name: NABC Institute                                              │
│ • Slug: nabc                                                                │
│ • Domain: nabc.pems.ssgzone.in                                              │
│ • SaaS App: PEMS (Prashast Enterprise Management)                           │
│ • Plan: Enterprise (₹15,000/month)                                          │
│ • Status: 🟢 Active since Jan 15, 2024                                      │
│                                                                             │
│ 👤 Admin Details                                                            │
│ • Name: Dr. Amit Sharma                                                     │
│ • Email: amit@nabc.pems.ssgzone.in                                          │
│ • Phone: +91-9876543210                                                     │
│ • Last Login: 2 hours ago                                                   │
│                                                                             │
│ 🔗 Access Links                                                             │
│ • Admin Portal: https://admin.nabc.pems.ssgzone.in                         │
│ • Webmail: https://mail.nabc.pems.ssgzone.in                               │
│ • Mobile App: SSGzone App (Tenant: nabc)                                    │
│                                                                             │
│ 📈 Usage Analytics (Last 30 Days)                                           │
│ • Email Sent: 15,678 (98.5% delivered)                                     │
│ • WhatsApp Messages: 456 (100% delivered)                                  │
│ • Storage Growth: +2.3 GB                                                  │
│ • Active Users: 42/45 (93% engagement)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Tenant Management Actions

### Edit Tenant Information
1. **Access**: Tenant Details → "Edit" button
2. **Form**: Same as creation form, pre-filled
3. **Editable Fields**:
   - Company Name
   - Admin Name/Email/Phone
   - Max Users
   - Plan
   - Status (Active/Suspended/Trial)

### Reset Admin Password
1. **Access**: Tenant Details → Actions (⋯) → "Reset Password"
2. **Confirmation**: "Are you sure?" dialog
3. **Process**: 
   - Generates new temporary password
   - Sends email to admin
   - Shows success notification

### Suspend/Activate Tenant
1. **Access**: Tenant Details → Actions (⋯) → "Suspend/Activate"
2. **Effect**: 
   - Suspended: All services disabled
   - Active: All services restored

### Delete Tenant
1. **Access**: Tenant Details → Actions (⋯) → "Delete Tenant"
2. **Warning**: Red confirmation dialog
3. **Requirements**: Type "DELETE" to confirm
4. **Effect**: Permanent deletion (cannot be undone)

---

## 🔍 Search & Filter Tenants

### Search Bar
**Location**: Top of tenant list
```
[🔍 Search tenants by name, email, or domain...                    ]
```

### Filter Options
```
┌─────────────────────────────────────────────────────────────────┐
│ Filters: [SaaS App: All ▼] [Status: All ▼] [Plan: All ▼] [Clear]│
└─────────────────────────────────────────────────────────────────┘
```

### Quick Filter Buttons
```
[📊 All] [🟢 Active] [🟡 Trial] [🔴 Suspended] [📅 Recent]
```

### Advanced Search
**Access**: Click "Advanced" next to search bar
```
┌─────────────────────────────────────────────────────────────────┐
│ Advanced Search                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Company Name:     [                                          ] │
│ Admin Email:      [                                          ] │
│ SaaS Application: [▼ Select                                  ] │
│ Plan:             [▼ Select                                  ] │
│ Status:           [▼ Select                                  ] │
│ Created Date:     [From: ____] [To: ____]                     │
│ User Count:       [Min: ___] [Max: ___]                       │
│                                                               │
│ [Clear All]                              [Search] [Cancel]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Bulk Operations

### Export Tenant Data
1. **Access**: Tenant List → "Export" button
2. **Options**:
   ```
   ┌─────────────────────────────────────────┐
   │ Export Tenant Data                      │
   ├─────────────────────────────────────────┤
   │ Format: [▼ Excel] [CSV] [PDF]           │
   │                                         │
   │ Include Columns:                        │
   │ ☑️ Company Name                          │
   │ ☑️ Admin Email                           │
   │ ☑️ SaaS App                              │
   │ ☑️ Plan & Pricing                        │
   │ ☑️ User Count                            │
   │ ☑️ Status                                │
   │ ☑️ Created Date                          │
   │ ☑️ Usage Stats                           │
   │                                         │
   │ [Cancel]              [Export]          │
   └─────────────────────────────────────────┘
   ```

### Import Tenants from CSV
1. **Access**: Tenant List → "Import" button
2. **Process**:
   ```
   Step 1: Download Template
   [📥 Download CSV Template]
   
   Step 2: Upload File
   [📁 Choose File] [tenant_import.csv]
   
   Step 3: Preview & Validate
   ┌─────────────────────────────────────────┐
   │ Preview Import (5 tenants found)        │
   ├─────────────────────────────────────────┤
   │ ✅ NABC Institute - Valid               │
   │ ✅ TechCorp Ltd - Valid                 │
   │ ❌ EduHub - Missing SaaS App            │
   │ ✅ StartupXYZ - Valid                   │
   │ ⚠️ MegaCorp - Email format issue        │
   └─────────────────────────────────────────┘
   
   Step 4: Process Import
   [Skip Errors] [Fix & Retry] [Import Valid Only]
   ```

---

## 📈 Analytics & Reports

### Tenant Analytics Dashboard
**Access**: Analytics → Tenant Reports

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tenant Analytics Overview                                    [📅 Last 30 Days]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 📊 Key Metrics                                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐                   │
│ │ Total       │ Active      │ Trial       │ Revenue     │                   │
│ │ Tenants     │ Tenants     │ Tenants     │ This Month  │                   │
│ │ 156         │ 142         │ 14          │ ₹12,45,000  │                   │
│ └─────────────┴─────────────┴─────────────┴─────────────┘                   │
│                                                                             │
│ 📈 Growth Trends                                                            │
│ [Line Chart: Tenant Growth Over Time]                                       │
│                                                                             │
│ 🏆 Top Performing Tenants                                                   │
│ 1. TechCorp Ltd - 15,678 emails/month                                      │
│ 2. NABC Institute - 12,456 emails/month                                    │
│ 3. EduHub Academy - 9,876 emails/month                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Individual Tenant Reports
**Access**: Tenant Details → "Analytics" tab

- **Email Performance**: Delivery rates, bounce rates, open rates
- **WhatsApp Usage**: Messages sent, delivery status, engagement
- **Storage Utilization**: Current usage, growth trends
- **User Activity**: Login frequency, feature usage

---

## 🚨 Notifications & Alerts

### System Notifications
**Location**: Top right bell icon

```
🔔 Notifications (3)
├── ⚠️ Tenant "EduHub" approaching user limit (190/200)
├── ✅ New tenant "StartupXYZ" created successfully  
└── 📧 Monthly billing report generated
```

### Email Alerts Setup
**Access**: System Config → Notifications

- **Tenant Limits**: Alert when approaching user/storage limits
- **Payment Issues**: Failed payments, expired cards
- **System Health**: Service outages, performance issues
- **Security Events**: Failed logins, suspicious activity

---

## 🔐 Security & Access Control

### SuperAdmin Permissions
- ✅ Create/Edit/Delete tenants
- ✅ View all tenant data
- ✅ Reset admin passwords
- ✅ Suspend/Activate services
- ✅ Access system analytics
- ✅ Configure global settings

### Audit Logs
**Access**: System Config → Security → Audit Logs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Recent Admin Activities                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2024-01-20 14:30 | Created tenant "StartupXYZ" | SuperAdmin: admin@ssgzone │
│ 2024-01-20 14:15 | Reset password for "NABC"   | SuperAdmin: admin@ssgzone │
│ 2024-01-20 13:45 | Suspended tenant "BadCorp"  | SuperAdmin: admin@ssgzone │
│ 2024-01-20 13:20 | Updated plan for "TechCorp" | SuperAdmin: admin@ssgzone │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile Access

### Responsive Design
- **Tablet**: Full functionality with adapted layout
- **Mobile**: Essential features with simplified UI
- **Touch**: Optimized for touch interactions

### Mobile-Specific Features
- **Quick Actions**: Swipe gestures for common tasks
- **Push Notifications**: Real-time alerts
- **Offline Mode**: View cached tenant data

---

## 🆘 Troubleshooting

### Common Issues & Solutions

#### Tenant Creation Fails
1. **Check**: SaaS app is active and configured
2. **Verify**: Email domain is not already in use
3. **Confirm**: Slug is unique across all tenants

#### Admin Cannot Access Portal
1. **Reset**: Admin password from SuperAdmin panel
2. **Check**: Tenant status is "Active"
3. **Verify**: DNS records are properly configured

#### Email Delivery Issues
1. **Monitor**: Communication → Email Service Status
2. **Check**: SMTP server health
3. **Review**: Spam/bounce reports

---

**🎯 Pro Tip: Use the search and filter features to quickly find specific tenants. Bookmark frequently accessed tenant details pages for faster navigation.**