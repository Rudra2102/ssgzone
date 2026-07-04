const express = require('express');
const router = express.Router();
const db = require('../services/DatabaseService');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Set tenant signature
router.post('/tenant/signature', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { html_signature, is_mandatory } = req.body;
    const tenantId = req.user.tenant_id;

    const query = `
      INSERT INTO tenant_signatures (tenant_id, html_signature, is_mandatory, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (tenant_id)
      DO UPDATE SET 
        html_signature = $2,
        is_mandatory = $3,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [tenantId, html_signature, is_mandatory]);
    res.json({ success: true, signature: result.rows[0] });
  } catch (error) {
    console.error('Error setting signature:', error);
    res.status(500).json({ error: 'Failed to set signature' });
  }
});

// Get tenant signature
router.get('/tenant/signature', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const query = 'SELECT * FROM tenant_signatures WHERE tenant_id = $1';
    const result = await db.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return res.json({ signature: null });
    }

    res.json({ signature: result.rows[0] });
  } catch (error) {
    console.error('Error fetching signature:', error);
    res.status(500).json({ error: 'Failed to fetch signature' });
  }
});

// Apply signature to email
async function applyTenantSignature(tenantId, emailBody, isHtml = false) {
  const query = 'SELECT html_signature, is_mandatory FROM tenant_signatures WHERE tenant_id = $1';
  const result = await db.query(query, [tenantId]);

  if (result.rows.length === 0 || !result.rows[0].is_mandatory) {
    return emailBody;
  }

  const signature = result.rows[0].html_signature;
  
  if (isHtml) {
    return `${emailBody}<br><br>${signature}`;
  } else {
    // Convert HTML signature to plain text for plain text emails
    const plainSignature = signature.replace(/<[^>]*>/g, '');
    return `${emailBody}\n\n${plainSignature}`;
  }
}

module.exports = { router, applyTenantSignature };