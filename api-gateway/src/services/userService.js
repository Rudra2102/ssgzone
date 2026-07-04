const db = require('../utils/database');

class UserService {
  static async create(userData) {
    const { tenant_id, username, email, password_hash, first_name, last_name } = userData;
    
    const query = `
      INSERT INTO users (tenant_id, username, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, first_name, last_name, status, storage_quota, created_at
    `;
    
    const result = await db.query(query, [
      tenant_id, username, email, password_hash, first_name, last_name
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findByEmailWithTenant(email) {
    const query = `
      SELECT u.*, t.company_name, t.tenant_slug, t.domain
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = $1
    `;
    
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findByTenantId(tenant_id) {
    const query = `
      SELECT id, username, email, first_name, last_name, status, 
             storage_quota, storage_used, created_at, last_login
      FROM users 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [tenant_id]);
    return result.rows;
  }

  static async updateStatus(email, status) {
    const query = `
      UPDATE users 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING id, email, status, updated_at
    `;
    
    const result = await db.query(query, [status, email]);
    return result.rows[0];
  }

  static async updatePassword(email, password_hash) {
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING id, email, updated_at
    `;
    
    const result = await db.query(query, [password_hash, email]);
    return result.rows[0];
  }

  static async updateStorageUsed(user_id, storage_used) {
    const query = `
      UPDATE users 
      SET storage_used = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, storage_used, storage_quota
    `;
    
    const result = await db.query(query, [storage_used, user_id]);
    return result.rows[0];
  }

  static async updateLastLogin(email) {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING id, email, last_login
    `;
    
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async deleteByEmail(email) {
    const query = 'DELETE FROM users WHERE email = $1 RETURNING id, email';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async authenticate(email, password) {
    const bcrypt = require('bcryptjs');
    console.log(`[AUTH] Attempting login for: ${email}`);
    
    const user = await this.findByEmail(email);
    console.log(`[AUTH] User found: ${user ? 'YES' : 'NO'}`);
    
    if (!user || user.status !== 'active') {
      console.log(`[AUTH] User invalid - exists: ${!!user}, status: ${user?.status}`);
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log(`[AUTH] Password valid: ${isValid}`);
    
    if (!isValid) {
      return null;
    }

    // Update last login
    await this.updateLastLogin(email);
    
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant_id: user.tenant_id
    };
  }
}

module.exports = UserService;