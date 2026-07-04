const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function syncPassword() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'ssgzone_mail',
    user: 'postgres',
    password: 'academy'
  });

  try {
    const email = 'namrata.singh@prashastacademy.pems.ssgzone.in';
    const newPassword = 'Academy@03';
    
    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password in SSGzone database
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id, email, first_name, last_name',
      [hashedPassword, email]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password synced successfully for:', result.rows[0]);
    } else {
      console.log('❌ User not found:', email);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

syncPassword();