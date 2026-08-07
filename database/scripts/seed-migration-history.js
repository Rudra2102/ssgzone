/**
 * seed-migration-history.js
 *
 * Run this ONCE on a database that already has the legacy schema applied.
 * It creates the pgmigrations tracking table and inserts the baseline record
 * so node-pg-migrate does not attempt to re-run the baseline migration.
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host/db node scripts/seed-migration-history.js
 *
 * Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || (() => {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  return `postgres://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
})();

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Create pgmigrations table if it doesn't exist (node-pg-migrate format)
    await client.query(`
      CREATE TABLE IF NOT EXISTS pgmigrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Insert baseline record — marks all 53 legacy migrations as applied
    await client.query(`
      INSERT INTO pgmigrations (name, run_on)
      VALUES ('001_baseline', NOW())
      ON CONFLICT DO NOTHING
    `);

    // Verify
    const result = await client.query('SELECT * FROM pgmigrations ORDER BY run_on');
    console.log('pgmigrations table contents:');
    result.rows.forEach(r => console.log(`  [${r.id}] ${r.name} — ${r.run_on}`));
    console.log('\nBaseline seeded successfully. node-pg-migrate is ready.');
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
