const express = require('express');
const bcrypt = require('bcryptjs');
const UserService = require('../services/userService');
const TenantService = require('../services/tenantService');
const db = require('../services/DatabaseService');
const { validateUserCreation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Create new user mailbox
router.post('/create', authenticate, validateUserCreation, auditLogger('user_create', 'user'), async (req, res) => {
  try {
    const { tenant_slug, saas_slug, first_name, last_name, password } = req.body;
    const saas_id = req.saas.id;
    
    // Verify saas_slug matches authenticated SaaS
    if (saas_slug !== req.saas.saas_slug) {
      return res.status(400).json({
        success: false,
        error: 'saas_slug does not match authenticated SaaS application'
      });
    }
    
    // Find tenant
    const tenant = await TenantService.findBySlugAndSaas(tenant_slug, saas_id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Generate username and email
    const username = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`;
    const email = `${username}@${tenant.domain}`;
    
    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    const user = await UserService.create({
      tenant_id: tenant.id,
      username,
      email,
      password_hash: await bcrypt.hash(password, 12),
      first_name,
      last_name
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status,
        storage_quota: user.storage_quota,
        created_at: user.created_at
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Suspend user
router.post('/suspend', authenticate, auditLogger('user_suspend', 'user'), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await UserService.updateStatus(email, 'suspended');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete user
router.delete('/delete', authenticate, auditLogger('user_delete', 'user'), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const deleted = await UserService.deleteByEmail(email);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset password
router.post('/password/reset', authenticate, auditLogger('user_password_reset', 'user'), async (req, res) => {
  try {
    const { email, new_password } = req.body;
    
    if (!email || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Email and new_password are required'
      });
    }

    const user = await UserService.updatePassword(
      email, 
      await bcrypt.hash(new_password, 12)
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user details
router.get('/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await UserService.findByEmailWithTenant(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status,
        storage_quota: user.storage_quota,
        storage_used: user.storage_used,
        tenant: {
          company_name: user.company_name,
          tenant_slug: user.tenant_slug,
          domain: user.domain
        },
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GDPR Right to Be Forgotten (Task 1.3)
router.delete('/gdpr/delete', authenticate, auditLogger('gdpr_deletion_request', 'user'), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user
    const user = await UserService.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if deletion already requested
    const existingRequest = await db.query(
      'SELECT id FROM gdpr_deletion_queue WHERE user_email = $1 AND status IN ($2, $3)',
      [email, 'pending', 'processing']
    );
    
    if (existingRequest.rows.length > 0) {
      return res.status(409).json({ error: 'Deletion already requested for this user' });
    }
    
    // Queue deletion (72-hour delay for compliance)
    const deletionQuery = `
      INSERT INTO gdpr_deletion_queue (user_id, user_email, tenant_id, requested_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, scheduled_for
    `;
    
    const result = await db.query(deletionQuery, [
      user.id, email, user.tenant_id, req.user?.id || null
    ]);
    
    res.json({
      success: true,
      deletionId: result.rows[0].id,
      scheduledFor: result.rows[0].scheduled_for,
      message: 'GDPR deletion request queued. Data will be permanently deleted in 72 hours.'
    });
  } catch (error) {
    console.error('Error processing GDPR deletion:', error);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

// Get GDPR deletion status
router.get('/gdpr/status/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    
    const query = `
      SELECT id, status, requested_at, scheduled_for, started_at, completed_at, error_message
      FROM gdpr_deletion_queue 
      WHERE user_email = $1 
      ORDER BY requested_at DESC 
      LIMIT 1
    `;
    
    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.json({ success: true, status: 'no_request' });
    }
    
    res.json({ success: true, deletion: result.rows[0] });
  } catch (error) {
    console.error('Error fetching GDPR status:', error);
    res.status(500).json({ error: 'Failed to fetch deletion status' });
  }
});

// Update user (including auto-responder configuration as per requirements)
router.put('/update', authenticate, async (req, res) => {
  try {
    const { 
      email, 
      first_name, 
      last_name, 
      auto_responder 
    } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Update user basic info
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (first_name) {
      updateFields.push(`first_name = $${paramCount++}`);
      updateValues.push(first_name);
    }
    if (last_name) {
      updateFields.push(`last_name = $${paramCount++}`);
      updateValues.push(last_name);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(email);
      
      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE email = $${paramCount}
        RETURNING *
      `;
      
      await db.query(updateQuery, updateValues);
    }

    // Handle auto-responder configuration
    if (auto_responder) {
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const autoResponderQuery = `
        INSERT INTO auto_responders (user_id, subject, message, start_date, end_date, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          subject = $2,
          message = $3,
          start_date = $4,
          end_date = $5,
          is_active = $6,
          updated_at = NOW()
      `;

      await db.query(autoResponderQuery, [
        user.id,
        auto_responder.subject,
        auto_responder.message,
        auto_responder.start_date,
        auto_responder.end_date,
        auto_responder.is_active
      ]);
    }

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;