# SSGzone Mail - Deletion Management Policy

## Overview

SSGzone Mail implements a **Soft Delete + 30-Day Restoration Window** strategy for user and tenant deletion. This ensures data safety while maintaining audit trails and allowing recovery if needed.

## Deletion Strategy

### Why Soft Delete?

1. **Data Safety** - No immediate data loss
2. **Audit Trail** - Complete history maintained
3. **Recovery** - 30-day restoration window
4. **Compliance** - GDPR right to be forgotten (after 30 days)
5. **Control** - Admin has final say on permanent deletion

### Timeline

```
Day 0: Deletion Request
  ↓
Days 1-30: Soft Delete (Data hidden, can be restored)
  ↓
Day 31: Automatic Permanent Deletion (if not restored)
```

## Deletion Types

### 1. User Deletion

**When:** Employee leaves company or is removed from SaaS

**Process:**
1. SaaS calls delete-user API
2. User marked as "deleted" in SSGzone
3. User cannot login
4. Data remains in database
5. Admin can restore within 30 days

**API Endpoint:**
```
POST /api/v1/saas/integration/delete-user
```

**Request:**
```json
{
  "saas_app_id": "app_123",
  "saas_app_secret": "secret_key",
  "user_email": "john@acmecorp.com",
  "tenant_slug": "acme-corp",
  "reason": "Employee left company",
  "permanent": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "User soft deleted successfully",
  "data": {
    "user_id": "user_xyz",
    "email": "john@acmecorp.com",
    "status": "deleted",
    "deleted_at": "2026-07-08T10:30:00Z",
    "permanent_deletion_date": "2026-08-07T10:30:00Z",
    "restoration_available_until": "2026-08-07T10:30:00Z"
  }
}
```

### 2. Tenant Deletion

**When:** Company closes or leaves SSGzone

**Process:**
1. SaaS calls delete-tenant API
2. Tenant marked as "deleted"
3. All users in tenant marked as "deleted"
4. Tenant cannot be accessed
5. Admin can restore within 30 days

**API Endpoint:**
```
POST /api/v1/saas/integration/delete-tenant
```

**Request:**
```json
{
  "saas_app_id": "app_123",
  "saas_app_secret": "secret_key",
  "tenant_slug": "acme-corp",
  "reason": "Company closed",
  "permanent": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant soft deleted successfully",
  "data": {
    "tenant_id": "tenant_abc",
    "tenant_slug": "acme-corp",
    "status": "deleted",
    "deleted_at": "2026-07-08T10:30:00Z",
    "permanent_deletion_date": "2026-08-07T10:30:00Z",
    "users_affected": "All users in this tenant marked as deleted"
  }
}
```

## Restoration

### Restore User

**Endpoint:**
```
POST /api/v1/saas/integration/restore-user
```

**Request:**
```json
{
  "user_id": "user_xyz",
  "reason": "Employee rehired"
}
```

**Conditions:**
- User must be in "deleted" status
- Must be within 30-day window
- Requires admin authentication

### Restore Tenant

**Endpoint:**
```
POST /api/v1/saas/integration/restore-tenant
```

**Request:**
```json
{
  "tenant_id": "tenant_abc",
  "reason": "Company reactivated"
}
```

**Conditions:**
- Tenant must be in "deleted" status
- Must be within 30-day window
- Requires super admin authentication
- Restores all users in tenant

## Permanent Deletion

### Manual Permanent Deletion

**Before 30 days:**
```json
{
  "saas_app_id": "app_123",
  "saas_app_secret": "secret_key",
  "user_email": "john@acmecorp.com",
  "tenant_slug": "acme-corp",
  "reason": "GDPR request",
  "permanent": true
}
```

**After 30 days:**
- Automatic permanent deletion via scheduled job
- No manual action needed
- Data completely removed from database

### Automatic Deletion Job

**Frequency:** Daily at 2:00 AM UTC

**Process:**
1. Find all deleted records with expired 30-day window
2. Permanently delete from database
3. Log deletion action
4. Send notification to admins

**Configuration:**
```javascript
// In cron job scheduler
const cron = require('node-cron');
const { permanentlyDeleteExpiredRecords } = require('./routes/saas-deletion');

// Run daily at 2:00 AM UTC
cron.schedule('0 2 * * *', async () => {
  await permanentlyDeleteExpiredRecords();
});
```

## Data Isolation During Soft Delete

### What Happens to User Data?

**Soft Delete (Days 1-30):**
- ✅ Data remains in database
- ❌ User cannot login
- ❌ User not visible in active user lists
- ✅ Data visible to admins (for restoration)
- ✅ Audit logs maintained

**Permanent Delete (Day 31+):**
- ❌ All user data deleted
- ❌ Emails deleted
- ❌ Chat messages deleted
- ❌ Audit logs deleted (except deletion log)
- ✅ Deletion event logged

### What Happens to Tenant Data?

**Soft Delete (Days 1-30):**
- ✅ Tenant data remains
- ✅ All user data remains
- ❌ Tenant cannot be accessed
- ❌ Users cannot login
- ✅ Data visible to super admin

**Permanent Delete (Day 31+):**
- ❌ Tenant deleted
- ❌ All users deleted
- ❌ All emails deleted
- ❌ All data deleted
- ✅ Deletion event logged

## Monitoring & Alerts

### Pending Deletion View

Query to see records pending permanent deletion:

```sql
SELECT * FROM pending_permanent_deletion
ORDER BY days_until_permanent_deletion ASC;
```

### Admin Dashboard

Super Admin can see:
- Recently deleted users/tenants
- Days until permanent deletion
- Restoration options
- Deletion reasons

### Alerts

- Email alert when deletion window expires (Day 29)
- Email alert when permanent deletion occurs
- Slack notification for bulk deletions

## Compliance

### GDPR Compliance

✅ **Right to be Forgotten:**
- User can request deletion
- Data deleted within 30 days
- Audit trail maintained
- Deletion logged

✅ **Data Retention:**
- Deletion logs retained for 7 years
- User data deleted after 30 days
- Audit trail maintained

### Data Retention Policy

| Data Type | Retention Period | After Deletion |
|-----------|-----------------|-----------------|
| Active User Data | Indefinite | Deleted after 30 days |
| Deleted User Data | 30 days | Permanently deleted |
| Emails | Indefinite | Deleted with user |
| Chat Messages | Indefinite | Deleted with user |
| Audit Logs | 7 years | Retained |
| Deletion Logs | 7 years | Retained |

## Implementation Checklist

- [ ] Add deletion columns to users table
- [ ] Add deletion columns to tenant_companies table
- [ ] Create deletion_logs table
- [ ] Create indexes for soft delete queries
- [ ] Create active_users view
- [ ] Create active_tenants view
- [ ] Create pending_permanent_deletion view
- [ ] Implement delete-user API
- [ ] Implement delete-tenant API
- [ ] Implement restore-user API
- [ ] Implement restore-tenant API
- [ ] Implement auto-deletion job
- [ ] Add deletion alerts
- [ ] Create admin dashboard for deletions
- [ ] Test all deletion scenarios
- [ ] Document for admins
- [ ] Train support team

## Testing Scenarios

### Scenario 1: User Deletion & Restoration
```
1. Delete user (soft delete)
2. Verify user cannot login
3. Verify data in database
4. Restore user
5. Verify user can login
6. Verify data intact
```

### Scenario 2: Automatic Permanent Deletion
```
1. Delete user (soft delete)
2. Wait 30 days (or simulate)
3. Run auto-deletion job
4. Verify user permanently deleted
5. Verify deletion logged
```

### Scenario 3: Tenant Deletion with Users
```
1. Delete tenant (soft delete)
2. Verify all users marked deleted
3. Verify tenant cannot be accessed
4. Restore tenant
5. Verify all users restored
6. Verify users can login
```

## Support & Recovery

### If User Accidentally Deleted

1. Contact Super Admin
2. Super Admin checks deletion_logs
3. Super Admin restores user
4. User receives password reset email
5. User can login again

### If Tenant Accidentally Deleted

1. Contact Super Admin
2. Super Admin checks deletion_logs
3. Super Admin restores tenant
4. All users automatically restored
5. Users receive notification

### If Permanent Deletion Needed Immediately

1. Super Admin calls delete API with `permanent: true`
2. Data immediately deleted
3. Deletion logged
4. Cannot be undone

## FAQ

**Q: Can I recover data after permanent deletion?**
A: No. Permanent deletion is irreversible. Only deletion logs remain.

**Q: How long is the restoration window?**
A: 30 days from deletion date.

**Q: What if I delete a user by mistake?**
A: Contact Super Admin within 30 days for restoration.

**Q: Are deleted users visible in reports?**
A: No. Deleted users are excluded from active reports but visible in audit logs.

**Q: Can users delete their own accounts?**
A: No. Only admins can delete users. Users can request deletion through support.

**Q: What happens to user emails after deletion?**
A: Emails are deleted with the user account.

**Q: Can I export data before deletion?**
A: Yes. Export data before requesting deletion.
