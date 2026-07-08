# SSGzone Mail - Role Hierarchy & Permission Model

## Role Hierarchy

```
Super Admin (Level 1)
    ↓
Admin/SaaS Company (Level 2) - Multiple Admins possible
    ↓
Tenant/Company (Level 3) - Multiple Tenants per Admin
    ↓
User/Employee (Level 4) - Multiple Users per Tenant
```

## Access Control Principles

### 1. Super Admin (Level 1)
**Access:** FULL - All features and functionalities
- Can create/manage multiple Admins
- Can grant/revoke any feature to Admins
- Can view all data across all Admins, Tenants, and Users
- Can manage system-wide settings
- Can access all chat/communication logs
- Can manage platform branding, billing, etc.

### 2. Admin/SaaS Company (Level 2)
**Access:** LIMITED - Only features granted by Super Admin
- Can create/manage multiple Tenants
- Can grant only those features to Tenants that Super Admin granted to Admin
- Can view only their own Tenants and Users (cannot see other Admins' data)
- Cannot see other Admins' downline
- Can manage communication with Tenants (email, chat meetings, etc.)
- **CANNOT** directly chat with Tenant's employees
- Can view analytics/reports for their Tenants only

### 3. Tenant/Company (Level 3)
**Access:** LIMITED - Only features granted by their Admin
- Can create/manage multiple Users/Employees
- Can grant only those features to Users that Admin granted to Tenant
- Can view only their own Users and data
- Cannot see other Tenants' data or downline
- Can communicate internally with their Users
- Can participate in chat/communication with Admin (through system)
- Can manage their own email accounts, templates, etc.

### 4. User/Employee (Level 4)
**Access:** MINIMAL - Only features granted by their Tenant
- Can view/manage only their own information
- Can use email, compose, sent emails, templates (if granted)
- Can participate in internal chat with Tenant company
- Cannot see other Users' data
- Cannot access admin functions
- Cannot manage other users

## Data Isolation Rules

### Super Admin
- ✅ Can see all data
- ✅ Can see all Admins, Tenants, Users
- ✅ Can access all chat logs

### Admin
- ✅ Can see own Tenants and their Users
- ❌ Cannot see other Admins' data
- ❌ Cannot see other Admins' Tenants
- ❌ Cannot see other Admins' Users
- ✅ Can see communication with own Tenants
- ❌ Cannot see direct chat between Tenant and Users

### Tenant
- ✅ Can see own Users/Employees
- ❌ Cannot see other Tenants' data
- ❌ Cannot see other Tenants' Users
- ✅ Can see internal communication with own Users
- ✅ Can see communication with their Admin

### User
- ✅ Can see only own data
- ❌ Cannot see other Users' data
- ✅ Can see own email, templates, etc.
- ✅ Can participate in internal chat

## Communication Rules

### Chat System
```
Allowed:
- Tenant ↔ User (Internal - Private)
- Admin ↔ Tenant (Through system - Not direct employee chat)
- Super Admin ↔ Anyone (For support/management)

NOT Allowed:
- Admin ↔ User (Direct chat with Tenant's employees)
- User ↔ User (Cross-tenant communication)
- Admin ↔ Admin (Direct chat - use email/meetings)
```

### Email System
```
Allowed:
- User can send/receive emails
- Tenant can manage email templates
- Admin can send emails to Tenants
- Super Admin can send system emails

Restrictions:
- User emails isolated to their account
- Tenant email templates isolated to their company
- Admin cannot access User email accounts directly
```

## Permission Delegation Rules

### Super Admin → Admin
- Super Admin grants specific features to Admin
- Admin can only use granted features
- Admin cannot grant features not granted by Super Admin

### Admin → Tenant
- Admin can grant only features that Super Admin granted to Admin
- Tenant can only use granted features
- Tenant cannot grant features not granted by Admin

### Tenant → User
- Tenant can grant only features that Admin granted to Tenant
- User can only use granted features
- User cannot grant any features

## Dashboard Structure

### 1. Super Admin Dashboard
**Pages:**
- Dashboard (Overview of all data)
- Admins Management (Create, Edit, Delete, Grant Features)
- Tenants Management (View all tenants across all admins)
- Users Management (View all users across all tenants)
- Platform Settings & Branding
- System Logs & Audit
- Billing & Analytics
- Communication Management

### 2. Admin Dashboard
**Pages:**
- Dashboard (Overview of own tenants)
- Tenants Management (Create, Edit, Delete, Grant Features)
- Users Management (View users of own tenants)
- Email Templates
- Communication (Email, Meetings with Tenants)
- Analytics & Reports (Own tenants only)
- Settings (Own settings only)

### 3. Tenant Dashboard
**Pages:**
- Dashboard (Overview of own users)
- Users Management (Create, Edit, Delete, Grant Features)
- Email Accounts
- Email Templates
- Internal Communication (Chat with Users)
- Analytics & Reports (Own data only)
- Settings (Own settings only)

### 4. User Dashboard
**Pages:**
- Dashboard (Personal overview)
- Inbox (Own emails)
- Compose (Send emails)
- Sent Emails
- Templates (Assigned templates)
- Internal Chat (With Tenant company)
- Settings (Own settings only)

## Security Implementation

### Database Level
- All queries must include role-based WHERE clauses
- Foreign key constraints enforce hierarchy
- Audit logs track all access

### API Level
- Authentication middleware validates JWT token
- Authorization middleware checks role and permissions
- Request validation ensures data isolation
- Rate limiting per role

### Frontend Level
- Conditional rendering based on role
- Menu items hidden based on permissions
- API calls include role context
- Error handling for unauthorized access

## Feature Matrix

| Feature | Super Admin | Admin | Tenant | User |
|---------|------------|-------|--------|------|
| View Dashboard | ✅ All | ✅ Own | ✅ Own | ✅ Own |
| Manage Admins | ✅ | ❌ | ❌ | ❌ |
| Manage Tenants | ✅ | ✅ Own | ❌ | ❌ |
| Manage Users | ✅ | ✅ Own | ✅ Own | ❌ |
| Grant Features | ✅ | ✅ Limited | ✅ Limited | ❌ |
| Send Email | ✅ | ✅ | ✅ | ✅ |
| Chat with Tenants | ✅ | ✅ | ❌ | ❌ |
| Chat with Users | ✅ | ❌ | ✅ | ✅ |
| View Logs | ✅ | ✅ Own | ✅ Own | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |
| Billing | ✅ | ✅ Own | ✅ Own | ❌ |

## Implementation Checklist

- [ ] Database schema with role-based foreign keys
- [ ] Authentication system with JWT tokens
- [ ] Authorization middleware for API routes
- [ ] Role-based query builders
- [ ] Audit logging system
- [ ] Super Admin Dashboard
- [ ] Admin Dashboard
- [ ] Tenant Dashboard
- [ ] User Dashboard
- [ ] Permission management UI
- [ ] Data isolation tests
- [ ] Security audit
