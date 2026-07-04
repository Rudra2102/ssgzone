const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const crypto = require('crypto');

const router = express.Router();

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'academy'
});

const vmailDb = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'vmail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'academy'
});

const hashMailPassword = (password) => {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto.createHash('sha512').update(password + salt).digest('hex');
  return `{SSHA512}${Buffer.from(hash + salt).toString('base64')}`;
};

// Tenant Admin Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Query database for tenant admin
    const userQuery = await db.query(`
      SELECT 
        tu.id, tu.username, tu.email, tu.first_name, tu.last_name, 
        tu.password_hash, tu.role, tu.tenant_id,
        tc.company_name, tc.company_slug
      FROM tenant_users tu
      JOIN tenant_companies tc ON tu.tenant_id = tc.id
      WHERE tu.username = $1 AND tu.role IN ('admin', 'manager') AND tu.status = 'active'
    `, [username]);
    
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const user = userQuery.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Update last login
    await db.query('UPDATE tenant_users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    const token = jwt.sign(
      { 
        type: 'tenant_admin', 
        adminId: user.id, 
        tenantId: user.tenant_id, 
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'tenant-admin-secret',
      { expiresIn: '8h' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: `${user.first_name} ${user.last_name}`,
          tenantId: user.tenant_id,
          company_name: user.company_name,
          company_slug: user.company_slug,
          role: user.role,
          type: 'tenant_admin'
        }
      }
    });
  } catch (error) {
    console.error('Tenant admin login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tenant Admin Auth Middleware
const tenantAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tenant-admin-secret');
    if (decoded.type !== 'tenant_admin') {
      return res.status(403).json({ success: false, error: 'Tenant admin access required' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Dashboard Stats
router.get('/dashboard/stats', tenantAdminAuth, async (req, res) => {
  try {
    const tenantId = req.admin.tenantId;
    
    // Get user counts
    const userCountQuery = await db.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as active FROM tenant_users WHERE tenant_id = $2',
      ['active', tenantId]
    );
    
    // Get email stats - use email_logs instead of email_queue
    const emailStatsQuery = await db.query(
      `SELECT COUNT(*) as sent FROM email_logs WHERE tenant_id = $1 AND DATE(sent_at) = CURRENT_DATE AND status = 'sent'`,
      [tenantId]
    ).catch(() => ({ rows: [{ sent: 0 }] }));

    // Get chat message count
    const chatStatsQuery = await db.query(
      'SELECT COUNT(*) as messages FROM chat_messages cm JOIN chat_rooms cr ON cm.room_id = cr.id WHERE cr.tenant_id = $1 AND cm.created_at >= CURRENT_DATE',
      [tenantId]
    ).catch(() => ({ rows: [{ messages: 0 }] }));

    // Get mailbox count
    const tenantInfo = await db.query('SELECT domain FROM tenant_companies WHERE id = $1', [tenantId]);
    const domain = tenantInfo.rows[0]?.domain;
    const mailboxCount = domain ? await vmailDb.query(
      'SELECT COUNT(*) as count FROM mailbox WHERE domain = $1 AND active = 1', [domain]
    ).catch(() => ({ rows: [{ count: 0 }] })) : { rows: [{ count: 0 }] };

    const stats = {
      totalUsers: parseInt(userCountQuery.rows[0]?.total || 0),
      activeUsers: parseInt(userCountQuery.rows[0]?.active || 0),
      emailsSent: parseInt(emailStatsQuery.rows[0]?.sent || 0),
      chatMessages: parseInt(chatStatsQuery.rows[0]?.messages || 0),
      totalMailboxes: parseInt(mailboxCount.rows[0]?.count || 0),
      domain: domain || null
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Users
router.get('/users', tenantAdminAuth, async (req, res) => {
  try {
    const tenantId = req.admin.tenantId;
    
    const usersQuery = await db.query(`
      SELECT 
        tu.id, tu.username, tu.email, tu.first_name, tu.last_name, 
        tu.phone, tu.role, tu.status, tu.created_at,
        d.name as department_name
      FROM tenant_users tu
      LEFT JOIN departments d ON tu.department_id = d.id
      WHERE tu.tenant_id = $1
      ORDER BY tu.created_at DESC
    `, [tenantId]);
    
    res.json({ success: true, data: usersQuery.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create User
router.post('/users', tenantAdminAuth, async (req, res) => {
  try {
    const { username, email, first_name, last_name, department_id, role, phone } = req.body;
    const tenantId = req.admin.tenantId;
    
    // Validate required fields
    if (!username || !email || !first_name || !last_name) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Check if username or email already exists
    const existingUser = await db.query(
      'SELECT id FROM tenant_users WHERE (username = $1 OR email = $2) AND tenant_id = $3',
      [username, email, tenantId]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }
    
    // Generate default password
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const insertQuery = await db.query(`
      INSERT INTO tenant_users (tenant_id, username, email, first_name, last_name, phone, role, department_id, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, username, email, first_name, last_name, phone, role, status, created_at
    `, [tenantId, username, email, first_name, last_name, phone, role || 'user', department_id || null, hashedPassword, 'active']);
    
    const newUser = insertQuery.rows[0];
    
    // Get department name
    if (department_id) {
      const deptQuery = await db.query('SELECT name FROM departments WHERE id = $1', [department_id]);
      newUser.department_name = deptQuery.rows[0]?.name;
    }
    
    res.json({ success: true, data: newUser, message: 'Employee created successfully' });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update User
router.put('/users/:id', tenantAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, first_name, last_name, department_id, role, phone, status } = req.body;
    const tenantId = req.admin.tenantId;
    
    // Verify user belongs to tenant
    const userCheck = await db.query('SELECT id FROM tenant_users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check for duplicate username/email (excluding current user)
    const duplicateCheck = await db.query(
      'SELECT id FROM tenant_users WHERE (username = $1 OR email = $2) AND tenant_id = $3 AND id != $4',
      [username, email, tenantId, id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }
    
    const updateQuery = await db.query(`
      UPDATE tenant_users 
      SET username = $1, email = $2, first_name = $3, last_name = $4, 
          phone = $5, role = $6, department_id = $7, status = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND tenant_id = $10
      RETURNING id, username, email, first_name, last_name, phone, role, status, created_at
    `, [username, email, first_name, last_name, phone, role, department_id || null, status || 'active', id, tenantId]);
    
    const updatedUser = updateQuery.rows[0];
    
    // Get department name
    if (department_id) {
      const deptQuery = await db.query('SELECT name FROM departments WHERE id = $1', [department_id]);
      updatedUser.department_name = deptQuery.rows[0]?.name;
    }
    
    res.json({ success: true, data: updatedUser, message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete User
router.delete('/users/:id', tenantAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.admin.tenantId;
    
    // Verify user belongs to tenant and is not the current admin
    const userCheck = await db.query(
      'SELECT id FROM tenant_users WHERE id = $1 AND tenant_id = $2 AND id != $3',
      [id, tenantId, req.admin.adminId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found or cannot delete yourself' });
    }
    
    await db.query('DELETE FROM tenant_users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Departments
router.get('/departments', tenantAdminAuth, async (req, res) => {
  try {
    const tenantId = req.admin.tenantId;
    
    const deptsQuery = await db.query(`
      SELECT 
        d.id, d.name, d.description, d.created_at,
        tu.first_name || ' ' || tu.last_name as head_name
      FROM departments d
      LEFT JOIN tenant_users tu ON d.head_user_id = tu.id
      WHERE d.tenant_id = $1
      ORDER BY d.name
    `, [tenantId]);
    
    res.json({ success: true, data: deptsQuery.rows });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Department
router.post('/departments', tenantAdminAuth, async (req, res) => {
  try {
    const { name, description, head_user_id } = req.body;
    const tenantId = req.admin.tenantId;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, error: 'Department name is required' });
    }
    
    // Check if department name already exists
    const existingDept = await db.query(
      'SELECT id FROM departments WHERE name = $1 AND tenant_id = $2',
      [name, tenantId]
    );
    
    if (existingDept.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Department name already exists' });
    }
    
    const insertQuery = await db.query(`
      INSERT INTO departments (tenant_id, name, description, head_user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, created_at
    `, [tenantId, name, description, head_user_id || null]);
    
    const newDept = insertQuery.rows[0];
    
    // Get head name if assigned
    if (head_user_id) {
      const headQuery = await db.query(
        'SELECT first_name || \' \' || last_name as head_name FROM tenant_users WHERE id = $1',
        [head_user_id]
      );
      newDept.head_name = headQuery.rows[0]?.head_name;
    }
    
    res.json({ success: true, data: newDept, message: 'Department created successfully' });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Department
router.put('/departments/:id', tenantAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, head_user_id } = req.body;
    const tenantId = req.admin.tenantId;
    
    // Verify department belongs to tenant
    const deptCheck = await db.query('SELECT id FROM departments WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    // Check for duplicate name (excluding current department)
    const duplicateCheck = await db.query(
      'SELECT id FROM departments WHERE name = $1 AND tenant_id = $2 AND id != $3',
      [name, tenantId, id]
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Department name already exists' });
    }
    
    const updateQuery = await db.query(`
      UPDATE departments 
      SET name = $1, description = $2, head_user_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND tenant_id = $5
      RETURNING id, name, description, created_at
    `, [name, description, head_user_id || null, id, tenantId]);
    
    const updatedDept = updateQuery.rows[0];
    
    // Get head name if assigned
    if (head_user_id) {
      const headQuery = await db.query(
        'SELECT first_name || \' \' || last_name as head_name FROM tenant_users WHERE id = $1',
        [head_user_id]
      );
      updatedDept.head_name = headQuery.rows[0]?.head_name;
    }
    
    res.json({ success: true, data: updatedDept, message: 'Department updated successfully' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete Department
router.delete('/departments/:id', tenantAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.admin.tenantId;
    
    // Verify department belongs to tenant
    const deptCheck = await db.query('SELECT id FROM departments WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    // Check if department has users
    const usersCheck = await db.query(
      'SELECT COUNT(*) as count FROM tenant_users WHERE department_id = $1',
      [id]
    );
    
    if (parseInt(usersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete department with assigned employees. Please reassign employees first.' 
      });
    }
    
    await db.query('DELETE FROM departments WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Communication Settings
router.get('/communication/settings', tenantAdminAuth, async (req, res) => {
  try {
    const tenantId = req.admin.tenantId;
    
    const settingsQuery = await db.query(
      'SELECT settings FROM tenant_communication_settings WHERE tenant_id = $1',
      [tenantId]
    );
    
    const defaultSettings = {
      email_enabled: true,
      chat_enabled: true,
      whatsapp_enabled: false,
      notifications_enabled: true
    };
    
    const settings = settingsQuery.rows[0]?.settings || defaultSettings;
    
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get communication settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Communication Settings
router.put('/communication/settings', tenantAdminAuth, async (req, res) => {
  try {
    const tenantId = req.admin.tenantId;
    const settings = req.body;
    
    await db.query(`
      INSERT INTO tenant_communication_settings (tenant_id, settings)
      VALUES ($1, $2)
      ON CONFLICT (tenant_id)
      DO UPDATE SET settings = $2, updated_at = CURRENT_TIMESTAMP
    `, [tenantId, JSON.stringify(settings)]);
    
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update communication settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PASSWORD RESET ====================

// PATCH /users/:id/reset-password
router.patch('/users/:id/reset-password', tenantAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const tenantId = req.admin.tenantId;
    if (!new_password) return res.status(400).json({ success: false, error: 'new_password required' });
    const userCheck = await db.query('SELECT id FROM tenant_users WHERE id=$1 AND tenant_id=$2', [id, tenantId]);
    if (!userCheck.rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE tenant_users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hashedPassword, id]);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== MAILBOX MANAGEMENT ====================

// GET /mailboxes - List tenant mailboxes
router.get('/mailboxes', tenantAdminAuth, async (req, res) => {
  try {
    const tenantId = req.admin.tenantId;
    const tenantInfo = await db.query('SELECT domain, custom_domain, domain_verified FROM tenant_companies WHERE id=$1', [tenantId]);
    if (!tenantInfo.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    const { domain, custom_domain, domain_verified } = tenantInfo.rows[0];
    const domains = [domain];
    if (custom_domain && domain_verified) domains.push(custom_domain);
    const placeholders = domains.map((_, i) => `$${i + 1}`).join(',');
    const result = await vmailDb.query(
      `SELECT username, name, first_name, last_name, domain, quota, active, created FROM mailbox WHERE domain IN (${placeholders}) ORDER BY created DESC`,
      domains
    );
    res.json({ success: true, data: result.rows, domains });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /mailboxes - Create mailbox for tenant user
router.post('/mailboxes', tenantAdminAuth, async (req, res) => {
  try {
    const { username, password, first_name, last_name, use_custom_domain = false, quota = 1024 } = req.body;
    const tenantId = req.admin.tenantId;
    if (!username || !password) return res.status(400).json({ success: false, error: 'username and password required' });
    const tenantInfo = await db.query('SELECT domain, custom_domain, domain_verified FROM tenant_companies WHERE id=$1', [tenantId]);
    const { domain, custom_domain, domain_verified } = tenantInfo.rows[0];
    const mailDomain = (use_custom_domain && custom_domain && domain_verified) ? custom_domain : domain;
    const email = `${username}@${mailDomain}`;
    const existing = await vmailDb.query('SELECT username FROM mailbox WHERE username=$1', [email]);
    if (existing.rows.length) return res.status(400).json({ success: false, error: 'Mailbox already exists' });
    const hashedPwd = hashMailPassword(password);
    await vmailDb.query(`
      INSERT INTO mailbox (username, password, name, first_name, last_name, domain, storagebasedirectory, storagenode, maildir, quota, active)
      VALUES ($1, $2, $3, $4, $5, $6, '/var/vmail', $7, $8, $9, 1)
    `, [email, hashedPwd, `${first_name || username} ${last_name || ''}`.trim(), first_name || username, last_name || '', mailDomain, mailDomain, `${mailDomain}/${username}/`, quota * 1048576]);
    await vmailDb.query(
      `INSERT INTO forwardings (address, forwarding, domain, dest_domain, is_forwarding, active) VALUES ($1, $1, $2, $2, 0, 1) ON CONFLICT DO NOTHING`,
      [email, mailDomain]
    );
    res.json({ success: true, data: { email, domain: mailDomain, quota } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /mailboxes/:email - Deactivate mailbox
router.delete('/mailboxes/:email', tenantAdminAuth, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const tenantId = req.admin.tenantId;
    const tenantInfo = await db.query('SELECT domain, custom_domain FROM tenant_companies WHERE id=$1', [tenantId]);
    const { domain, custom_domain } = tenantInfo.rows[0];
    const emailDomain = email.split('@')[1];
    if (emailDomain !== domain && emailDomain !== custom_domain)
      return res.status(403).json({ success: false, error: 'Not authorized to delete this mailbox' });
    const result = await vmailDb.query('UPDATE mailbox SET active=0 WHERE username=$1 RETURNING username', [email]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, message: `Mailbox ${email} deactivated` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /mailboxes/reset-password
router.post('/mailboxes/reset-password', tenantAdminAuth, async (req, res) => {
  try {
    const { email, new_password } = req.body;
    const tenantId = req.admin.tenantId;
    if (!email || !new_password) return res.status(400).json({ success: false, error: 'email and new_password required' });
    const tenantInfo = await db.query('SELECT domain, custom_domain FROM tenant_companies WHERE id=$1', [tenantId]);
    const { domain, custom_domain } = tenantInfo.rows[0];
    const emailDomain = email.split('@')[1];
    if (emailDomain !== domain && emailDomain !== custom_domain)
      return res.status(403).json({ success: false, error: 'Not authorized' });
    const hashedPwd = hashMailPassword(new_password);
    const result = await vmailDb.query(
      'UPDATE mailbox SET password=$1, passwordlastchange=NOW() WHERE username=$2 RETURNING username',
      [hashedPwd, email]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Mailbox not found' });
    res.json({ success: true, message: 'Mailbox password updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DOMAIN STATUS ====================

// GET /domain/status
router.get('/domain/status', tenantAdminAuth, async (req, res) => {
  try {
    const tenantId = req.admin.tenantId;
    const result = await db.query(
      'SELECT domain, custom_domain, domain_verified, domain_verify_token, domain_status FROM tenant_companies WHERE id=$1',
      [tenantId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;