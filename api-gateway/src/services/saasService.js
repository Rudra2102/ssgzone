const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ssgzone_mail',
  user: process.env.DB_USER || 'ssgzone',
  password: process.env.DB_PASSWORD || 'academy'
});

// Debug logging
console.log('SaasService DB Config:', {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ssghub_mail',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? '***SET***' : '***NOT SET***'
});

class SaasService {
  static async create(saasData) {
    const { saas_name, saas_slug, api_key } = saasData;
    
    const query = `
      INSERT INTO saas_applications (saas_name, saas_slug, api_key)
      VALUES ($1, $2, $3)
      RETURNING id, saas_name, saas_slug, status, created_at
    `;
    
    const result = await pool.query(query, [saas_name, saas_slug, api_key]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM saas_applications WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findBySlug(saas_slug) {
    const query = 'SELECT * FROM saas_applications WHERE saas_slug = $1';
    const result = await pool.query(query, [saas_slug]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM saas_applications WHERE status = $1';
    const result = await pool.query(query, ['active']);
    return result.rows;
  }

  static async updateApiKey(id, newApiKey) {
    const query = `
      UPDATE saas_applications 
      SET api_key = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, saas_name, saas_slug
    `;
    
    const result = await pool.query(query, [newApiKey, id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE saas_applications 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = SaasService;