/**
 * SSGzone Mail - SaaS Integration API
 * 
 * This API handles automatic user/tenant creation when:
 * 1. New SaaS Company is created
 * 2. New Employee is added to a SaaS Company
 * 
 * Token-based authentication system for seamless login
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');

// ============================================
// 1. CREATE TENANT (SaaS Company)
// ============================================
/**
 * POST /api/v1/saas/integration/create-tenant
 * 
 * Called by: SaaS Application
 * When: New company/organization is created in SaaS
 * 
 * Request Body:
 * {
 *   "saas_app_id": "app_123",
 *   "saas_app_secret": "secret_key",
 *   "tenant_data": {
 *     "company_name": "Acme Corp",
 *     "company_slug": "acme-corp",
 *     "admin_email": "admin@acmecorp.com",
 *     "admin_name": "John Doe",
 *     "admin_phone": "+1234567890",
 *     "company_website": "https://acmecorp.com",
 *     "industry": "Technology",
 *     "employees_count": 50
 *   }
 * }
 */
router.post('/create-tenant', async (req, res) => {
  try {
    const { saas_app_id, saas_app_secret, tenant_data } = req.body;

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

    // Validate required fields
    const { company_name, company_slug, admin_email, admin_name } = tenant_data;
    if (!company_name || !company_slug || !admin_email || !admin_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: company_name, company_slug, admin_email, admin_name'
      });
    }

    // Check if tenant already exists
    const existingTenant = await db.query(
      'SELECT * FROM tenant_companies WHERE slug = $1',
      [company_slug]
    );

    if (existingTenant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tenant with this slug already exists'
      });
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create tenant in database
    const tenantResult = await db.query(
      `INSERT INTO tenant_companies 
       (name, slug, admin_email, admin_name, status, created_at, saas_app_id)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       RETURNING *`,
      [company_name, company_slug, admin_email, admin_name, 'active', saas_app_id]
    );

    const tenant = tenantResult.rows[0];

    // Create tenant admin user
    const userResult = await db.query(
      `INSERT INTO users 
       (tenant_id, username, email, password_hash, first_name, last_name, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, email, username`,
      [
        tenant.id,
        company_slug + '_admin',
        admin_email,
        passwordHash,
        admin_name.split(' ')[0],
        admin_name.split(' ')[1] || '',
        'tenant_admin',
        'active'
      ]
    );

    const user = userResult.rows[0];

    // Generate JWT token for auto-login
    const token = jwt.sign(
      {
        type: 'tenant',
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        role: 'tenant_admin'
      },
      process.env.JWT_SECRET || 'ssgzone-secret',
      { expiresIn: '7d' }
    );

    // Log this action
    await logIntegrationAction('tenant_created', {
      saas_app_id,
      tenant_id: tenant.id,
      admin_email
    });

    return res.json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug,
        admin_email: user.email,
        admin_username: user.username,
        temporary_password: tempPassword,
        login_token: token,
        login_url: `https://ssgzone.in/login?token=${token}`,
        instructions: {
          step1: 'Use the temporary_password to login for the first time',
          step2: 'Change password immediately after first login',
          step3: 'Or use login_token for direct auto-login (valid for 7 days)',
          step4: 'Share login credentials with tenant admin'
        }
      }
    });

  } catch (error) {
    console.error('Error creating tenant:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create tenant',
      details: error.message
    });
  }
});

// ============================================
// 2. CREATE USER (Employee)
// ============================================
/**
 * POST /api/v1/saas/integration/create-user
 * 
 * Called by: SaaS Application
 * When: New employee is added to a company in SaaS
 * 
 * Request Body:
 * {
 *   "saas_app_id": "app_123",
 *   "saas_app_secret": "secret_key",
 *   "tenant_slug": "acme-corp",
 *   "user_data": {
 *     "email": "john@acmecorp.com",
 *     "first_name": "John",
 *     "last_name": "Smith",
 *     "employee_id": "EMP_001",
 *     "department": "Engineering",
 *     "designation": "Senior Developer"
 *   }
 * }
 */
router.post('/create-user', async (req, res) => {
  try {
    const { saas_app_id, saas_app_secret, tenant_slug, user_data } = req.body;

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
      'SELECT * FROM tenant_companies WHERE slug = $1',
      [tenant_slug]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    // Validate required fields
    const { email, first_name, last_name } = user_data;
    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, first_name, last_name'
      });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenant.id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists in this tenant'
      });
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create username from email
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);

    // Create user
    const userResult = await db.query(
      `INSERT INTO users 
       (tenant_id, username, email, password_hash, first_name, last_name, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, email, username`,
      [
        tenant.id,
        username,
        email,
        passwordHash,
        first_name,
        last_name,
        'user',
        'active'
      ]
    );

    const user = userResult.rows[0];

    // Generate JWT token for auto-login
    const token = jwt.sign(
      {
        type: 'user',
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        role: 'user'
      },
      process.env.JWT_SECRET || 'ssgzone-secret',
      { expiresIn: '7d' }
    );

    // Log this action
    await logIntegrationAction('user_created', {
      saas_app_id,
      tenant_id: tenant.id,
      user_email: email
    });

    return res.json({
      success: true,
      message: 'User created successfully',
      data: {
        user_id: user.id,
        email: user.email,
        username: user.username,
        temporary_password: tempPassword,
        login_token: token,
        login_url: `https://ssgzone.in/login?token=${token}`,
        instructions: {
          step1: 'Use the temporary_password to login for the first time',
          step2: 'Change password immediately after first login',
          step3: 'Or use login_token for direct auto-login (valid for 7 days)',
          step4: 'Share login credentials with employee'
        }
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user',
      details: error.message
    });
  }
});

// ============================================
// 3. TOKEN-BASED LOGIN
// ============================================
/**
 * POST /api/v1/saas/integration/token-login
 * 
 * Called by: Frontend (with token from create-tenant or create-user)
 * Purpose: Auto-login using token
 */
router.post('/token-login', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ssgzone-secret');

    // Get user details
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Generate new session token
    const sessionToken = jwt.sign(
      {
        type: decoded.type,
        userId: user.id,
        tenantId: decoded.tenantId,
        email: user.email,
        role: decoded.role
      },
      process.env.JWT_SECRET || 'ssgzone-secret',
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          role: decoded.role,
          type: decoded.type
        }
      }
    });

  } catch (error) {
    console.error('Error in token login:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

// ============================================
// 4. HELPER FUNCTIONS
// ============================================

function generateTemporaryPassword() {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function logIntegrationAction(action, details) {
  try {
    await db.query(
      `INSERT INTO integration_logs (action, details, created_at)
       VALUES ($1, $2, NOW())`,
      [action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Error logging integration action:', error);
  }
}

module.exports = router;
