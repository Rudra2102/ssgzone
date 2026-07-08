# Unified Dashboard Implementation

## Overview
A single, role-based dashboard that adapts to the user's role (Super Admin, Admin, Tenant, User). The dashboard displays different content, metrics, and actions based on the user's permissions.

## Architecture

### Components

1. **UnifiedDashboard.js** - Main dashboard component
   - Fetches role-specific data
   - Renders role-appropriate content
   - Handles loading states

2. **PermissionWrapper.js** - Conditional rendering component
   - Wraps components that require specific permissions
   - Shows fallback content if user lacks permission
   - Supports single or multiple permission checks

3. **usePermissions.js** - Custom React hook
   - Provides permission checking functions
   - Returns user role and permissions
   - Offers helper methods (isSuperAdmin, isAdmin, etc.)

4. **permissions.js** - Permission matrix
   - Defines all permissions for each role
   - Centralized permission management
   - Easy to update and maintain

### Supporting Components

- **MetricCard.js** - Displays key metrics
- **TenantTable.js** - Shows tenant data
- **UserTable.js** - Shows user data
- **QuickActionsRoleBased.js** - Role-specific action buttons

## Permission Structure

```
PERMISSIONS = {
  super_admin: { ... },  // Full access
  admin: { ... },        // Limited access to own tenants
  tenant: { ... },       // Limited access to own users
  user: { ... }          // Minimal access to own data
}
```

## Usage Examples

### Using PermissionWrapper

```jsx
// Single permission check
<PermissionWrapper module="dashboard" action="viewAllMetrics">
  <MetricCard title="Total Users" value={100} />
</PermissionWrapper>

// Multiple permissions (any)
<PermissionWrapper 
  module="users" 
  actions={['viewAll', 'viewOwn']} 
  requireAll={false}
>
  <UserTable users={users} />
</PermissionWrapper>

// Multiple permissions (all required)
<PermissionWrapper 
  module="tenants" 
  actions={['create', 'update']} 
  requireAll={true}
>
  <TenantForm />
</PermissionWrapper>

// With fallback
<PermissionWrapper 
  module="settings" 
  action="system"
  fallback={<p>You don't have access to system settings</p>}
>
  <SystemSettings />
</PermissionWrapper>
```

### Using usePermissions Hook

```jsx
import usePermissions from '../components/usePermissions';

function MyComponent() {
  const { 
    role, 
    isSuperAdmin, 
    isAdmin, 
    hasPermission,
    hasAnyPermission 
  } = usePermissions();

  if (isSuperAdmin) {
    return <SuperAdminView />;
  }

  if (hasPermission('users', 'create')) {
    return <CreateUserButton />;
  }

  return <RestrictedView />;
}
```

## Role-Based Dashboard Content

### Super Admin Dashboard
- ✅ All metrics (Total SaaS Apps, Active Tenants, Total Users, etc.)
- ✅ All tenants table
- ✅ All users table
- ✅ All quick actions
- ✅ System settings access

### Admin Dashboard
- ✅ Own tenants metrics
- ✅ Own tenants table
- ✅ Own users table
- ✅ Admin-specific quick actions
- ✅ Billing access

### Tenant Dashboard
- ✅ Own users metrics
- ✅ Own users table
- ✅ Email management
- ✅ Internal chat
- ✅ Own settings

### User Dashboard
- ✅ Personal metrics
- ✅ Own email account
- ✅ Internal chat
- ✅ Own settings

## Data Isolation

### API Level
- Backend validates user role and returns only accessible data
- Queries include role-based WHERE clauses
- Foreign key constraints enforce hierarchy

### Frontend Level
- PermissionWrapper prevents unauthorized component rendering
- usePermissions hook validates before showing UI
- Error handling for unauthorized access

## Security Considerations

1. **Frontend Security**
   - Permission checks are UI-level only
   - Always validate on backend
   - Never trust frontend permissions alone

2. **Backend Security**
   - Validate JWT token on every request
   - Check user role and permissions
   - Return only accessible data
   - Log unauthorized access attempts

3. **Data Isolation**
   - Admin cannot see other Admin's data
   - Tenant cannot see other Tenant's data
   - User can only see own data

## Adding New Permissions

1. Update `permissions.js` with new permission
2. Use PermissionWrapper or usePermissions in component
3. Update backend API to validate permission
4. Test with all roles

Example:
```javascript
// In permissions.js
admin: {
  reports: {
    view: true,
    export: true,
    delete: false
  }
}

// In component
<PermissionWrapper module="reports" action="export">
  <ExportButton />
</PermissionWrapper>
```

## Testing Checklist

- [ ] Super Admin sees all content
- [ ] Admin sees only own tenants/users
- [ ] Tenant sees only own users
- [ ] User sees only own data
- [ ] Unauthorized components don't render
- [ ] API returns role-specific data
- [ ] No data leakage between roles
- [ ] Permission changes reflect immediately
- [ ] Fallback content shows when unauthorized
- [ ] All quick actions work for each role

## File Structure

```
super-admin-portal/src/
├── pages/
│   ├── UnifiedDashboard.js
│   └── Dashboard.css
├── components/
│   ├── permissions.js
│   ├── usePermissions.js
│   ├── PermissionWrapper.js
│   ├── MetricCard.js
│   ├── TenantTable.js
│   ├── UserTable.js
│   ├── QuickActionsRoleBased.js
│   ├── MetricCard.css
│   ├── TenantTable.css
│   ├── UserTable.css
│   └── QuickActions.css
```

## Future Enhancements

1. Dynamic permission loading from backend
2. Permission caching with TTL
3. Real-time permission updates via WebSocket
4. Audit logging for permission checks
5. Permission analytics dashboard
6. Role templates for easier management
