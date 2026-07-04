const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'ssgzone_mail',
    user: 'postgres',
    password: 'academy'
  });

  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT email, first_name, last_name FROM users WHERE email = $1', 
      ['namrata.singh@prashastacademy.pems.ssgzone.in']);
    
    console.log('User found:', result.rows[0]);
    client.release();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();