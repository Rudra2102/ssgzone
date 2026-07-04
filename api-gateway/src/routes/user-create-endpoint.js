// Add to SSGzone API Gateway - routes/user.js

// PEMS Integration - Create user for employee
router.post('/create', async (req, res) => {
  try {
    const { tenant_slug, saas_slug, first_name, last_name, password } = req.body;
    
    // Validate API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }
    
    // Find SaaS application
    const saasApp = await db.query('SELECT * FROM saas_applications WHERE api_key = $1 AND saas_slug = $2', 
      [apiKey, saas_slug]);
    
    if (saasApp.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid API key or SaaS application' });
    }
    
    // Find tenant
    const tenant = await db.query('SELECT * FROM tenants WHERE saas_id = $1 AND tenant_slug = $2', 
      [saasApp.rows[0].id, tenant_slug]);
    
    if (tenant.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    
    // Generate username and email
    const username = (first_name + '.' + last_name).toLowerCase().replace(/[^a-z.]/g, '');
    const email = `${username}@${tenant_slug}.${saas_slug}.ssgzone.in`;
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const password_hash = bcrypt.hashSync(password, 12);
    
    // Create user
    const result = await db.query(`
      INSERT INTO users (tenant_id, username, email, password_hash, first_name, last_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING id, email
    `, [tenant.rows[0].id, username, email, password_hash, first_name, last_name]);
    
    res.json({
      success: true,
      data: {
        email: result.rows[0].email,
        user_id: result.rows[0].id
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});