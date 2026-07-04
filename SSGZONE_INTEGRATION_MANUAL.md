# SSGzone Integration Manual
## Complete Guide for SaaS App Integration & Tenant Management

---

## 🎯 Overview

SSGzone is a unified communication platform that provides email and messaging services to SaaS applications through a multi-tenant architecture. This manual covers complete integration process for SaaS apps and tenant management.

---

## 📋 SaaS App Integration Process

### Step 1: Register SaaS Application

**SuperAdmin Dashboard → Applications → Add Application**

#### Required Information:
```json
{
  "name": "PEMS",
  "slug": "pems", 
  "description": "Prashast Enterprise Management System",
  "webhook_url": "https://pems.company.com/api/ssgzone/webhook",
  "domain_prefix": "pems",
  "status": "active"
}
```

#### ⚠️ Webhook URL Explanation:
**Webhook URL को SaaS App Developer को अपने application में create करना होता है:**

1. **Developer का काम**: अपने SaaS app में webhook endpoint बनाना
2. **Example**: `https://pems.company.com/api/ssgzone/webhook`
3. **Purpose**: SSGzone से events receive करने के लिए
4. **Events**: Email delivery, WhatsApp status, user creation आदि

**Webhook Endpoint Example (SaaS App में):**
```javascript
// PEMS application में यह endpoint बनाना होगा
app.post('/api/ssgzone/webhook', (req, res) => {
  const { event, data } = req.body;
  
  switch(event) {
    case 'email.delivered':
      // Email delivery confirmation handle करें
      break;
    case 'tenant.created':
      // New tenant creation notification
      break;
  }
  
  res.status(200).send('OK');
});
```

**अगर Webhook URL नहीं है तो:**
- **Optional Field**: छोड़ सकते हैं या empty रख सकते हैं
- **Later Addition**: बाद में add कर सकते हैं जब endpoint ready हो
- **Testing**: Sandbox environment में test कर सकते हैं

#### Generated Configuration:
```json
{
  "app_id": "uuid-generated",
  "api_key": "ssg_live_xxxxxxxxxxxx",
  "api_secret": "ssg_secret_xxxxxxxxxxxx",
  "webhook_secret": "whk_xxxxxxxxxxxx"
}
```

### Step 2: SaaS App Settings Configuration

#### A. Authentication Settings
- **API Authentication**: Bearer token based
- **Webhook Security**: HMAC-SHA256 signature verification
- **Rate Limiting**: 1000 requests/minute per tenant
- **IP Whitelisting**: Optional security layer

#### B. Communication Features
```json
{
  "email_service": {
    "enabled": true,
    "daily_limit": 10000,
    "attachment_limit": "25MB",
    "custom_templates": true
  },
  "whatsapp_service": {
    "enabled": true,
    "monthly_limit": 1000,
    "business_templates": true
  },
  "chat_service": {
    "enabled": true,
    "real_time": true,
    "file_sharing": true
  }
}
```

#### C. Domain Configuration
- **Email Domain**: `*.pems.ssgzone.in`
- **Subdomain Pattern**: `{tenant}.pems.ssgzone.in`
- **SSL Certificate**: Auto-generated via Let's Encrypt
- **DNS Management**: Automatic CNAME/MX record setup

---

## 🏢 Tenant Company Management (Frontend Guide)

### Step 1: Access SuperAdmin Dashboard

1. **Login to SSGzone**: Navigate to `https://admin.ssgzone.in`
2. **SuperAdmin Credentials**: Use your SuperAdmin account
3. **Dashboard Access**: You'll see the main SuperAdmin dashboard

### Step 2: Add New Tenant Company (UI Steps)

#### Method 1: From Dashboard Overview Tab
1. **Navigate**: SuperAdmin Dashboard → Overview Tab → "Tenant Management" tab
2. **Click**: "Create Tenant" button (top right)
3. **Fill Form**: Complete the tenant creation dialog

#### Method 2: From Sidebar Menu
1. **Navigate**: SuperAdmin Dashboard → Sidebar → "User Management"
2. **Switch to Tenants**: Look for tenant management section
3. **Add Tenant**: Click "Add New Tenant" button

#### Tenant Creation Form Fields:
```
┌─────────────────────────────────────────┐
│ Create New Tenant Company               │
├─────────────────────────────────────────┤
│ Company Name: [NABC Institute         ] │
│ Company Slug: [nabc                   ] │
│ SaaS App:     [▼ Select PEMS          ] │
│ Admin Name:   [Dr. Amit Sharma        ] │
│ Admin Email:  [amit@nabc.pems.ssgzone.] │
│ Max Users:    [500                    ] │
│ Plan:         [▼ Enterprise           ] │
│                                         │
│ [Cancel]              [Create Tenant]   │
└─────────────────────────────────────────┘
```

### Step 3: View Tenant Details (Where to Find)

#### A. Tenant List View
**Location**: SuperAdmin Dashboard → Overview → Tenant Management Tab

**Table Columns**:
- Company Name
- SaaS App
- Admin Email  
- Users (Current/Max)
- Status
- Actions (Edit/Delete)

#### B. Individual Tenant Details
**Access**: Click on any tenant row or "View Details" button

**Tenant Details Panel**:
```
┌─────────────────────────────────────────┐
│ NABC Institute Details                  │
├─────────────────────────────────────────┤
│ Basic Information:                      │
│ • Company: NABC Institute               │
│ • Slug: nabc                           │
│ • Domain: nabc.pems.ssgzone.in         │
│ • Plan: Enterprise                      │
│ • Status: Active                        │
│                                         │
│ Admin Details:                          │
│ • Name: Dr. Amit Sharma                │
│ • Email: amit@nabc.pems.ssgzone.in     │
│ • Phone: +91-9876543210                │
│                                         │
│ Usage Statistics:                       │
│ • Users: 45/500                        │
│ • Storage: 2.3GB/25GB                  │
│ • Emails Today: 234                     │
│ • WhatsApp: 12/1000                    │
│                                         │
│ Access Links:                           │
│ • Admin Portal: admin.nabc.pems.ssgzone│
│ • Webmail: mail.nabc.pems.ssgzone.in   │
│                                         │
│ [Edit Tenant] [Reset Password] [Delete] │
└─────────────────────────────────────────┘
```

### Step 4: Tenant Management Actions

#### A. Edit Tenant Information
1. **Access**: Tenant Details → "Edit Tenant" button
2. **Modify**: Update company details, limits, plan
3. **Save**: Changes are applied immediately

#### B. Reset Admin Password
1. **Access**: Tenant Details → "Reset Password" button
2. **Generate**: New temporary password
3. **Notify**: Admin receives email with new credentials

#### C. View Tenant Analytics
1. **Access**: Tenant Details → "Analytics" tab
2. **View**: Email stats, WhatsApp usage, user activity
3. **Export**: Download reports in PDF/Excel format

### Step 5: Bulk Tenant Operations

#### A. Import Tenants from CSV
1. **Navigate**: Tenant Management → "Import" button
2. **Upload**: CSV file with tenant data
3. **Preview**: Review before creating
4. **Process**: Bulk create tenants

#### B. Export Tenant List
1. **Navigate**: Tenant Management → "Export" button
2. **Select**: Columns to include
3. **Download**: Excel/CSV file

### Step 6: Search and Filter Tenants

#### Search Options:
- **By Company Name**: Type in search box
- **By SaaS App**: Filter dropdown
- **By Status**: Active/Inactive filter
- **By Plan**: Starter/Business/Enterprise

#### Quick Filters:
```
[🔍 Search: NABC        ] [SaaS: All ▼] [Status: All ▼]
[📊 Show: Active Only   ] [📅 Created: Last 30 days ▼]
```

### Step 7: What Tenant Companies Get (Auto-Generated)

#### A. Email Infrastructure
```json
{
  "domain": "nabc.pems.ssgzone.in",
  "email_accounts": {
    "admin": "amit@nabc.pems.ssgzone.in",
    "pattern": "{username}@nabc.pems.ssgzone.in",
    "aliases": ["info@nabc.pems.ssgzone.in", "support@nabc.pems.ssgzone.in"]
  },
  "storage": "50GB per user",
  "features": ["IMAP/POP3", "Webmail", "Mobile sync", "Calendar", "Contacts"]
}
```

#### B. WhatsApp Business Integration
```json
{
  "business_number": "+91-XXXXXXXXXX",
  "verified_name": "NABC Institute",
  "message_templates": [
    "admission_confirmation",
    "fee_reminder", 
    "exam_notification",
    "general_announcement"
  ],
  "monthly_quota": 1000
}
```

#### C. Communication Dashboard Access
- **Tenant Admin Portal**: `https://admin.nabc.pems.ssgzone.in`
- **Employee Webmail**: `https://mail.nabc.pems.ssgzone.in`
- **Mobile App Access**: SSGzone Mobile App with tenant login

#### D. API Integration Credentials
```json
{
  "tenant_id": "uuid-generated",
  "api_endpoint": "https://api.ssgzone.in/v1/tenant/nabc",
  "api_key": "tenant_nabc_xxxxxxxxxxxx",
  "webhook_url": "https://nabc.pems.ssgzone.in/webhook/ssgzone"
}
```

---

## 🔧 Technical Integration Guide

### For SaaS App Developers

#### 1. Install SSGzone SDK
```bash
npm install @ssgzone/communication-sdk
# or
pip install ssgzone-python-sdk
```

#### 2. Initialize SDK
```javascript
const SSGzone = require('@ssgzone/communication-sdk');

const ssgzone = new SSGzone({
  apiKey: 'ssg_live_xxxxxxxxxxxx',
  apiSecret: 'ssg_secret_xxxxxxxxxxxx',
  environment: 'production' // or 'sandbox'
});
```

#### 3. Send Email via SSGzone
```javascript
const emailResult = await ssgzone.email.send({
  tenant_id: 'nabc-tenant-id',
  from: 'noreply@nabc.pems.ssgzone.in',
  to: 'student@nabc.pems.ssgzone.in',
  subject: 'Fee Payment Reminder',
  template: 'fee_reminder',
  data: {
    student_name: 'Rahul Kumar',
    amount: '₹25,000',
    due_date: '2024-01-15'
  }
});
```

#### 4. Send WhatsApp Message
```javascript
const whatsappResult = await ssgzone.whatsapp.send({
  tenant_id: 'nabc-tenant-id',
  to: '+919876543210',
  template: 'admission_confirmation',
  data: {
    student_name: 'Priya Singh',
    course: 'B.Tech CSE',
    admission_date: '2024-01-10'
  }
});
```

#### 5. Handle Webhooks
```javascript
app.post('/api/ssgzone/webhook', (req, res) => {
  const signature = req.headers['x-ssgzone-signature'];
  const payload = req.body;
  
  if (ssgzone.webhook.verify(payload, signature)) {
    switch(payload.event) {
      case 'email.delivered':
        // Handle email delivery confirmation
        break;
      case 'whatsapp.read':
        // Handle WhatsApp message read receipt
        break;
      case 'user.created':
        // Handle new user creation in tenant
        break;
    }
  }
  
  res.status(200).send('OK');
});
```

---

## 📊 Tenant Admin Features

### Dashboard Capabilities
1. **Employee Management**
   - Add/remove email accounts
   - Set user permissions
   - Monitor usage statistics

2. **Communication Settings**
   - Email signatures
   - Auto-responders
   - Forwarding rules
   - WhatsApp templates

3. **Analytics & Reports**
   - Email delivery rates
   - WhatsApp engagement
   - Storage usage
   - User activity logs

### Employee Features
1. **Webmail Access**
   - Full-featured email client
   - Calendar integration
   - Contact management
   - File attachments

2. **Mobile App**
   - Push notifications
   - Offline email access
   - WhatsApp integration
   - Cross-device sync

---

## 🔐 Security & Compliance

### Data Protection
- **Encryption**: AES-256 for data at rest, TLS 1.3 for transit
- **Backup**: Daily automated backups with 30-day retention
- **GDPR Compliance**: Data portability and deletion rights
- **Audit Logs**: Complete activity tracking

### Access Control
- **Multi-factor Authentication**: Required for admin accounts
- **Role-based Permissions**: Granular access control
- **IP Restrictions**: Optional IP whitelisting
- **Session Management**: Automatic timeout and device tracking

---

## 💰 Pricing & Plans

### Tenant Plans
```json
{
  "starter": {
    "users": 50,
    "storage": "25GB per user",
    "emails": "5000/month",
    "whatsapp": "500/month",
    "price": "₹2000/month"
  },
  "business": {
    "users": 200,
    "storage": "50GB per user", 
    "emails": "20000/month",
    "whatsapp": "2000/month",
    "price": "₹7500/month"
  },
  "enterprise": {
    "users": "unlimited",
    "storage": "100GB per user",
    "emails": "unlimited",
    "whatsapp": "10000/month",
    "price": "₹15000/month"
  }
}
```

---

## 🚀 Go-Live Checklist

### For SaaS Apps
- [ ] Register application in SSGzone
- [ ] Configure webhook endpoints
- [ ] Implement SDK integration
- [ ] Test email/WhatsApp functionality
- [ ] Setup monitoring and logging
- [ ] Configure DNS records
- [ ] SSL certificate validation

### For Tenant Companies
- [ ] Create tenant account
- [ ] Setup admin credentials
- [ ] Configure email accounts
- [ ] Test WhatsApp integration
- [ ] Train admin users
- [ ] Import existing contacts
- [ ] Setup email signatures
- [ ] Configure mobile apps

---

## 📞 Support & Resources

### Documentation
- **API Reference**: https://docs.ssgzone.in/api
- **SDK Documentation**: https://docs.ssgzone.in/sdk
- **Webhook Guide**: https://docs.ssgzone.in/webhooks

### Support Channels
- **Technical Support**: tech@ssgzone.in
- **Integration Help**: integration@ssgzone.in
- **Emergency Support**: +91-XXXXXXXXXX (24/7)

### Developer Resources
- **Sandbox Environment**: https://sandbox.ssgzone.in
- **Postman Collection**: Available in developer portal
- **Code Examples**: https://github.com/ssgzone/examples

---

**🎯 Remember: SSGzone handles all communication infrastructure so SaaS apps can focus on their core business logic while providing enterprise-grade communication features to their customers.**
