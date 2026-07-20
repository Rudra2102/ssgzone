const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD)
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-admin-secret';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};

// GET /api/v1/rules
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM email_rules WHERE user_id=$1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/rules
router.post('/', auth, async (req, res) => {
  const { name, condition_field, condition_operator, condition_value, action_type, action_value } = req.body;
  if (!name || !condition_field || !condition_operator || !condition_value || !action_type)
    return res.status(400).json({ success: false, error: 'name, condition_field, condition_operator, condition_value, action_type required' });
  try {
    const result = await pool.query(
      `INSERT INTO email_rules (user_id, tenant_id, name, condition_field, condition_operator, condition_value, action_type, action_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, req.user.tenant_id, name, condition_field, condition_operator, condition_value, action_type, action_value || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/v1/rules/:id/toggle
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE email_rules SET is_active = NOT is_active WHERE id=$1 AND user_id=$2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/v1/rules/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM email_rules WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/v1/rules/apply
router.post('/apply', auth, async (req, res) => {
  try {
    const rules = await pool.query(
      'SELECT * FROM email_rules WHERE user_id=$1 AND is_active=true',
      [req.user.id]
    );
    if (!rules.rows.length) return res.json({ success: true, affected: 0 });

    const emails = await pool.query(
      `SELECT id, from_email, subject, text_content FROM emails
       WHERE to_email=$1 AND tenant_id=$2 AND archived=false`,
      [req.user.email, String(req.user.tenant_id)]
    );

    let affected = 0;
    for (const email of emails.rows) {
      for (const rule of rules.rows) {
        const field = rule.condition_field === 'from' ? email.from_email
          : rule.condition_field === 'subject' ? email.subject
          : (email.text_content || '');
        const val = (field || '').toLowerCase();
        const cond = rule.condition_value.toLowerCase();
        const match = rule.condition_operator === 'contains' ? val.includes(cond)
          : rule.condition_operator === 'equals' ? val === cond
          : val.startsWith(cond);
        if (!match) continue;

        if (rule.action_type === 'move' && rule.action_value) {
          await pool.query('UPDATE emails SET folder=$1 WHERE id=$2', [rule.action_value, email.id]);
        } else if (rule.action_type === 'star') {
          await pool.query('UPDATE emails SET starred=true WHERE id=$1', [email.id]);
        } else if (rule.action_type === 'mark_read') {
          await pool.query('UPDATE emails SET read_status=true WHERE id=$1', [email.id]);
        } else if (rule.action_type === 'mark_unread') {
          await pool.query('UPDATE emails SET read_status=false WHERE id=$1', [email.id]);
        }
        affected++;
        break;
      }
    }
    res.json({ success: true, affected });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

async function applyRulesToEmail(emailId, toEmail, tenantId, fromEmail, subject, textContent, pool) {
  try {
    const rules = await pool.query(
      `SELECT er.* FROM email_rules er
       JOIN tenant_users tu ON tu.id = er.user_id
       WHERE tu.email=$1 AND er.tenant_id=$2 AND er.is_active=true`,
      [toEmail, tenantId]
    );
    for (const rule of rules.rows) {
      const field = rule.condition_field === 'from' ? fromEmail
        : rule.condition_field === 'subject' ? subject
        : (textContent || '');
      const val = (field || '').toLowerCase();
      const cond = rule.condition_value.toLowerCase();
      const match = rule.condition_operator === 'contains' ? val.includes(cond)
        : rule.condition_operator === 'equals' ? val === cond
        : val.startsWith(cond);
      if (!match) continue;

      if (rule.action_type === 'move' && rule.action_value) {
        await pool.query('UPDATE emails SET folder=$1 WHERE id=$2', [rule.action_value, emailId]);
      } else if (rule.action_type === 'star') {
        await pool.query('UPDATE emails SET starred=true WHERE id=$1', [emailId]);
      } else if (rule.action_type === 'mark_read') {
        await pool.query('UPDATE emails SET read_status=true WHERE id=$1', [emailId]);
      } else if (rule.action_type === 'mark_unread') {
        await pool.query('UPDATE emails SET read_status=false WHERE id=$1', [emailId]);
      }
      break;
    }
  } catch (err) {
    console.error('applyRulesToEmail error:', err.message);
  }
}

module.exports = { router, applyRulesToEmail };
