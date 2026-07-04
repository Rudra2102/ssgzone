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

// POST /auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'username and password required' });

    const result = await db.query(`
      SELECT tu.*, tc.company_name, tc.company_slug, tc.domain, tc.custom_domain, tc.domain_verified
      FROM tenant_users tu
      JOIN tenant_companies tc ON tu.tenant_id = tc.id
      WHERE (tu.username=$1 OR tu.email=$1) AND tu.status='active'
    `, [username]);

    if (!result.rows.length) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    await db.query('UPDATE tenant_users SET last_login=NOW() WHERE id=$1', [user.id]);

    const token = jwt.sign(
      { type: 'user', userId: user.id, tenantId: user.tenant_id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'super-admin-secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id, username: user.username, email: user.email,
          first_name: user.first_name, last_name: user.last_name,
          role: user.role, company_name: user.company_name,
          domain: user.domain, type: 'user'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Auth middleware
const userAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'Token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-admin-secret');
    if (decoded.type !== 'user') return res.status(403).json({ success: false, error: 'User access required' });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// GET /profile
router.get('/profile', userAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT tu.id, tu.username, tu.email, tu.first_name, tu.last_name, tu.phone,
             tu.role, tu.status, tu.created_at, tu.last_login,
             tc.company_name, tc.domain, tc.custom_domain, tc.domain_verified,
             d.name as department_name
      FROM tenant_users tu
      JOIN tenant_companies tc ON tu.tenant_id = tc.id
      LEFT JOIN departments d ON tu.department_id = d.id
      WHERE tu.id=$1
    `, [req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /profile - Update own profile
router.put('/profile', userAuth, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const result = await db.query(
      `UPDATE tenant_users SET first_name=$1, last_name=$2, phone=$3, updated_at=NOW()
       WHERE id=$4 RETURNING id, username, email, first_name, last_name, phone`,
      [first_name, last_name, phone, req.user.userId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /change-password
router.patch('/change-password', userAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, error: 'current_password and new_password required' });

    const result = await db.query('SELECT password_hash FROM tenant_users WHERE id=$1', [req.user.userId]);
    const isValid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!isValid) return res.status(400).json({ success: false, error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE tenant_users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hashedPassword, req.user.userId]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /mailbox - Own mailbox info
router.get('/mailbox', userAuth, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT tu.email, tc.domain, tc.custom_domain, tc.domain_verified FROM tenant_users tu JOIN tenant_companies tc ON tu.tenant_id=tc.id WHERE tu.id=$1',
      [req.user.userId]
    );
    if (!userResult.rows.length) return res.status(404).json({ success: false, error: 'User not found' });

    const { email, domain, custom_domain, domain_verified } = userResult.rows[0];
    const username = email.split('@')[0];

    // Check mailboxes on both domains
    const domains = [domain];
    if (custom_domain && domain_verified) domains.push(custom_domain);
    const placeholders = domains.map((_, i) => `$${i + 1}`).join(',');

    const mailboxes = await vmailDb.query(
      `SELECT username, name, domain, quota, active, created FROM mailbox WHERE username LIKE $${domains.length + 1} AND domain IN (${placeholders})`,
      [...domains, `${username}@%`]
    );

    res.json({ success: true, data: mailboxes.rows, primary_email: email });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /mailbox/change-password - Change own mailbox password
router.patch('/mailbox/change-password', userAuth, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password) return res.status(400).json({ success: false, error: 'new_password required' });

    const userResult = await db.query('SELECT email FROM tenant_users WHERE id=$1', [req.user.userId]);
    const email = userResult.rows[0]?.email;
    if (!email) return res.status(404).json({ success: false, error: 'User not found' });

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

// GET /dashboard - User dashboard summary
router.get('/dashboard', userAuth, async (req, res) => {
  try {
    const userResult = await db.query(`
      SELECT tu.first_name, tu.last_name, tu.email, tu.role, tu.last_login,
             tc.company_name, tc.domain
      FROM tenant_users tu JOIN tenant_companies tc ON tu.tenant_id=tc.id
      WHERE tu.id=$1
    `, [req.user.userId]);

    const user = userResult.rows[0];
    res.json({
      success: true,
      data: {
        welcome: `Welcome, ${user.first_name}!`,
        email: user.email,
        company: user.company_name,
        role: user.role,
        last_login: user.last_login,
        domain: user.domain
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
