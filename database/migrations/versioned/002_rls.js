/**
 * Migration: 002_rls
 *
 * Implements Row Level Security (RLS) for all tenant-scoped tables.
 *
 * Strategy:
 *   - Creates a restricted `app_user` Postgres role (no superuser privileges)
 *   - API sets `app.current_tenant_id` via SET LOCAL before each query
 *   - RLS policies enforce tenant isolation at the DB layer
 *   - `super_admins`, `saas_applications`, `tenant_companies`, `audit_logs`,
 *     `system_settings` are platform-level — RLS not applied
 *   - `chat_participants` and `chat_messages` are scoped via room_id → chat_rooms
 *     which has tenant_id, so direct RLS is not applied to them
 */

const TENANT_TABLES = [
  'tenant_users',
  'departments',
  'tenant_communication_settings',
  'emails',
  'email_queue',
  'email_templates',
  'chat_rooms',
  'notifications',
  'communication_settings',
  'communication_files',
  'communication_analytics',
];

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  // 1. Create restricted app role (idempotent)
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'CHANGE_ME_APP_USER_PASSWORD';
      END IF;
    END
    $$;
  `);

  // 2. Grant schema usage and table permissions to app_user
  pgm.sql(`GRANT USAGE ON SCHEMA public TO app_user;`);
  pgm.sql(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;`);
  pgm.sql(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;`);

  // 3. Enable RLS and create tenant isolation policy on each table
  for (const table of TENANT_TABLES) {
    pgm.sql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    pgm.sql(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);

    // Allow app_user to see/modify only rows matching current tenant context
    pgm.sql(`
      CREATE POLICY tenant_isolation ON ${table}
        TO app_user
        USING (tenant_id::text = current_setting('app.current_tenant_id', true))
        WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
    `);

    // Allow postgres superuser to bypass (for migrations, admin scripts)
    pgm.sql(`
      CREATE POLICY superuser_bypass ON ${table}
        TO postgres
        USING (true)
        WITH CHECK (true);
    `);
  }
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  for (const table of TENANT_TABLES) {
    pgm.sql(`DROP POLICY IF EXISTS tenant_isolation ON ${table};`);
    pgm.sql(`DROP POLICY IF EXISTS superuser_bypass ON ${table};`);
    pgm.sql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
  }

  pgm.sql(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_user;`);
  pgm.sql(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_user;`);
  pgm.sql(`REVOKE USAGE ON SCHEMA public FROM app_user;`);
  pgm.sql(`DROP ROLE IF EXISTS app_user;`);
};
