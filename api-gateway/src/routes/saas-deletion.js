/**
 * SSGzone Mail - User/Tenant Deletion Management
 * 
 * Strategy: Soft Delete + Webhook Notification
 * 
 * When SaaS deletes a user/tenant:
 * 1. SaaS calls SSGzone deletion API
 * 2. SSGzone marks as "deleted" (soft delete)
 * 3. Data remains in database (audit trail)
 * 4. User cannot login
 * 5. Admin can restore within 30 days
 * 6. After 30 days, permanent deletion option available
 */

const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// ============================================
// 1. SOFT DELETE USER
// ============================================
/**
 * POST /api/v1/saas/integration/delete-user
 * 
 * Called by: SaaS Application
 * When: Employee is deleted in SaaS
 * 
 * Request Body:
 * {
 *   "saas_app_id": "app_123",
 *   "saas_app_secret": "secret_key",
 *   "user_email": "john@acmecorp.com",
 *   "tenant_slug": "acme-corp",
 *   "reason": "Employee left company",
 *   "permanent": false
 * }
 */
router.post('/delete-user', async (req, res) => {
  try {
    const { saas_app_id, saas_app_secret, user_email, tenant_slug, reason, permanent } = req.body;

    // Validate SaaS credentials
    const saasApp = await db.query(
      'SELECT * FROM saas_applications WHERE id = $1 AND secret_key = $2',
      [saas_app_id, saas_app_secret]
    );

    if (saasApp.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid SaaS credentials'
      });
    }

    // Get tenant
    const tenantResult = await db.query(
      'SELECT * FROM tenant_companies WHERE company_slug = $1',
      [tenant_slug]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    // Get user
    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
      [user_email, tenant.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (permanent) {
      // Permanent deletion (after 30 days)
      await db.query(
        'DELETE FROM users WHERE id = $1',
        [user.id]
      );

      await logDeletionAction('user_permanently_deleted', {
        user_id: user.id,
        user_email,
        tenant_id: tenant.id,
        reason
      });

      return res.json({
        success: true,
        message: 'User permanently deleted',
        data: {
          user_id: user.id,
          email: user_email,
          status: 'permanently_deleted'
        }
      });
    } else {
      // Soft delete
      const deletionDate = new Date();
      const permanentDeletionDate = new Date(deletionDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await db.query(
        `UPDATE users 
         SET status = $1, 
             deleted_at = NOW(),
             deletion_reason = $2,
             permanent_deletion_date = $3
         WHERE id = $4`,
        ['deleted', reason, permanentDeletionDate, user.id]
      );

      await logDeletionAction('user_soft_deleted', {
        user_id: user.id,
        user_email,
        tenant_id: tenant.id,
        reason,
        permanent_deletion_date: permanentDeletionDate
      });

      return res.json({
        success: true,
        message: 'User soft deleted successfully',
        data: {
          user_id: user.id,
          email: user_email,
          status: 'deleted',
          deleted_at: new Date(),
          permanent_deletion_date: permanentDeletionDate,
          restoration_available_until: permanentDeletionDate,
          note: 'User can be restored within 30 days. After that, permanent deletion will be automatic.'
        }
      });
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      details: error.message
    });
  }
});

// ============================================
// 2. SOFT DELETE TENANT
// ============================================
/**
 * POST /api/v1/saas/integration/delete-tenant
 * 
 * Called by: SaaS Application
 * When: Company is deleted in SaaS
 * 
 * Request Body:
 * {
 *   "saas_app_id": "app_123",
 *   "saas_app_secret": "secret_key",
 *   "tenant_slug": "acme-corp",
 *   "reason": "Company closed",
 *   "permanent": false
 * }
 */
router.post('/delete-tenant', async (req, res) => {
  try {
    const { saas_app_id, saas_app_secret, tenant_slug, reason, permanent } = req.body;

    // Validate SaaS credentials
    const saasApp = await db.query(
      'SELECT * FROM saas_applications WHERE id = $1 AND secret_key = $2',
      [saas_app_id, saas_app_secret]
    );

    if (saasApp.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid SaaS credentials'
      });
    }

    // Get tenant
    const tenantResult = await db.query(
      'SELECT * FROM tenant_companies WHERE company_slug = $1',
      [tenant_slug]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    if (permanent) {
      // Permanent deletion - cascade delete all related data
      await db.query('BEGIN');

      try {
        // Delete all users in tenant
        await db.query('DELETE FROM users WHERE tenant_id = $1', [tenant.id]);

        // Delete tenant
        await db.query('DELETE FROM tenant_companies WHERE id = $1', [tenant.id]);

        await db.query('COMMIT');

        await logDeletionAction('tenant_permanently_deleted', {
          tenant_id: tenant.id,
          tenant_slug,
          reason
        });

        return res.json({
          success: true,
          message: 'Tenant permanently deleted',
          data: {
            tenant_id: tenant.id,
            tenant_slug,
            status: 'permanently_deleted'
          }
        });
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } else {
      // Soft delete
      const deletionDate = new Date();
      const permanentDeletionDate = new Date(deletionDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await db.query(
        `UPDATE tenant_companies 
         SET status = $1,
             deleted_at = NOW(),
             deletion_reason = $2,
             permanent_deletion_date = $3
         WHERE id = $4`,
        ['deleted', reason, permanentDeletionDate, tenant.id]
      );

      // Also mark all users as deleted
      await db.query(
        `UPDATE users 
         SET status = $1,
             deleted_at = NOW(),
             deletion_reason = $2
         WHERE tenant_id = $3`,
        ['deleted', reason, tenant.id]
      );

      await logDeletionAction('tenant_soft_deleted', {
        tenant_id: tenant.id,
        tenant_slug,
        reason,
        permanent_deletion_date: permanentDeletionDate
      });

      return res.json({
        success: true,
        message: 'Tenant soft deleted successfully',
        data: {
          tenant_id: tenant.id,
          tenant_slug,
          status: 'deleted',
          deleted_at: new Date(),
          permanent_deletion_date: permanentDeletionDate,
          restoration_available_until: permanentDeletionDate,
          users_affected: 'All users in this tenant marked as deleted',
          note: 'Tenant can be restored within 30 days. After that, permanent deletion will be automatic.'
        }
      });
    }

  } catch (error) {
    console.error('Error deleting tenant:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete tenant',
      details: error.message
    });
  }
});

// ============================================
// 3. RESTORE USER
// ============================================
/**
 * POST /api/v1/saas/integration/restore-user
 * 
 * Called by: Super Admin or SaaS
 * Purpose: Restore a soft-deleted user
 */
router.post('/restore-user', async (req, res) => {
  try {
    const { user_id, reason } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    // Verify admin access
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required'
      });
    }

    // Get user
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1 AND status = $2',
      [user_id, 'deleted']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deleted user not found'
      });
    }

    const user = userResult.rows[0];

    // Check if restoration window is still open
    if (new Date() > new Date(user.permanent_deletion_date)) {
      return res.status(400).json({
        success: false,
        error: 'Restoration window expired. User can only be permanently deleted now.'
      });
    }

    // Restore user
    await db.query(
      `UPDATE users 
       SET status = $1,
           deleted_at = NULL,
           deletion_reason = NULL,
           permanent_deletion_date = NULL
       WHERE id = $2`,
      ['active', user_id]
    );

    await logDeletionAction('user_restored', {
      user_id,
      user_email: user.email,
      reason
    });

    return res.json({
      success: true,
      message: 'User restored successfully',
      data: {
        user_id,
        email: user.email,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Error restoring user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to restore user',
      details: error.message
    });
  }
});

// ============================================
// 4. RESTORE TENANT
// ============================================
/**
 * POST /api/v1/saas/integration/restore-tenant
 * 
 * Called by: Super Admin
 * Purpose: Restore a soft-deleted tenant
 */
router.post('/restore-tenant', async (req, res) => {
  try {
    const { tenant_id, reason } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    // Verify admin access
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required'
      });
    }

    // Get tenant
    const tenantResult = await db.query(
      'SELECT * FROM tenant_companies WHERE id = $1 AND status = $2',
      [tenant_id, 'deleted']
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deleted tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    // Check if restoration window is still open
    if (new Date() > new Date(tenant.permanent_deletion_date)) {
      return res.status(400).json({
        success: false,
        error: 'Restoration window expired. Tenant can only be permanently deleted now.'
      });
    }

    // Restore tenant
    await db.query(
      `UPDATE tenant_companies 
       SET status = $1,
           deleted_at = NULL,
           deletion_reason = NULL,
           permanent_deletion_date = NULL
       WHERE id = $2`,
      ['active', tenant_id]
    );

    // Restore all users in tenant
    await db.query(
      `UPDATE users 
       SET status = $1,
           deleted_at = NULL,
           deletion_reason = NULL
       WHERE tenant_id = $2`,
      ['active', tenant_id]
    );

    await logDeletionAction('tenant_restored', {
      tenant_id,
      tenant_slug: tenant.company_slug,
      reason
    });

    return res.json({
      success: true,
      message: 'Tenant and all users restored successfully',
      data: {
        tenant_id,
        tenant_slug: tenant.company_slug,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Error restoring tenant:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to restore tenant',
      details: error.message
    });
  }
});

// ============================================
// 5. AUTO-DELETE EXPIRED RECORDS (Scheduled Job)
// ============================================
/**
 * This should run daily via cron job
 * Permanently deletes records where 30-day window has expired
 */
async function permanentlyDeleteExpiredRecords() {
  try {
    const now = new Date();

    // Delete expired users
    const deletedUsers = await db.query(
      `SELECT id FROM users 
       WHERE status = $1 AND permanent_deletion_date <= $2`,
      ['deleted', now]
    );

    for (const user of deletedUsers.rows) {
      await db.query('DELETE FROM users WHERE id = $1', [user.id]);
    }

    // Delete expired tenants
    const deletedTenants = await db.query(
      `SELECT id FROM tenant_companies 
       WHERE status = $1 AND permanent_deletion_date <= $2`,
      ['deleted', now]
    );

    for (const tenant of deletedTenants.rows) {
      await db.query('DELETE FROM tenant_companies WHERE id = $1', [tenant.id]);
    }

    console.log(`Auto-deletion job completed: ${deletedUsers.rows.length} users, ${deletedTenants.rows.length} tenants`);

  } catch (error) {
    console.error('Error in auto-deletion job:', error);
  }
}

// ============================================
// 6. HELPER FUNCTIONS
// ============================================

async function logDeletionAction(action, details) {
  try {
    await db.query(
      `INSERT INTO deletion_logs (action, details, created_at)
       VALUES ($1, $2, NOW())`,
      [action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Error logging deletion action:', error);
  }
}

// Export for scheduling
module.exports = {
  router,
  permanentlyDeleteExpiredRecords
};
