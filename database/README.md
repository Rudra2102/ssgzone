# SSGzone Database — Migration Guide

## Tool: node-pg-migrate

**Why node-pg-migrate**: Node.js native, no JVM dependency, supports up/down migrations,
integrates directly with the existing `pg` stack, and has a simple file-based workflow.

---

## Directory Structure

```
database/
├── migrations/
│   ├── versioned/          ← All new migrations go here (node-pg-migrate)
│   │   ├── 001_baseline.js ← Baseline: represents all 53 legacy SQL files
│   │   └── 002_*.js        ← Future migrations
│   └── *.sql               ← Legacy files (read-only, do not modify)
├── scripts/
│   └── seed-migration-history.js  ← Run once on existing DB
├── seeds/                  ← Reference seed data
├── package.json
└── .node-pg-migrate.json   ← Tool config
```

---

## Setup (First Time on a New Environment)

### 1. Install dependencies
```bash
cd database
npm install
```

### 2. Set DATABASE_URL in root .env
```
DATABASE_URL=postgres://postgres:PASSWORD@localhost:5432/ssgzone_mail
```
Or the tool will build it from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

### 3. On an existing database (already has legacy schema)
Run the seed script ONCE to mark the baseline as applied:
```bash
npm run migrate:seed-history
```

### 4. On a fresh database
Apply all migrations from scratch:
```bash
npm run migrate:up
```

---

## Daily Workflow

### Check migration status
```bash
npm run migrate:status
```

### Apply all pending migrations
```bash
npm run migrate:up
```

### Roll back the last migration
```bash
npm run migrate:down
```

### Create a new migration
```bash
npm run migrate:create -- --name describe_what_you_are_changing
```
This creates `migrations/versioned/NNN_describe_what_you_are_changing.js`

---

## Naming Convention

| Pattern | Example |
|---------|---------|
| Sequential 3-digit prefix | `002_`, `003_`, `010_` |
| Lowercase snake_case description | `add_rls_policies` |
| Full example | `002_add_rls_policies.js` |

**Rules:**
- Never reuse a number
- Never modify an already-applied migration
- Always implement both `up` and `down` functions
- Keep each migration focused on one logical change

---

## Migration File Template

```js
exports.up = (pgm) => {
  pgm.createTable('example', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    tenant_id: { type: 'uuid', notNull: true, references: 'tenants' },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('example');
};
```

---

## RLS Policy Convention

Every tenant-scoped table must have RLS enabled. Add to the migration:

```js
exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE example ENABLE ROW LEVEL SECURITY`);
  pgm.sql(`
    CREATE POLICY tenant_isolation ON example
      USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP POLICY IF EXISTS tenant_isolation ON example`);
  pgm.sql(`ALTER TABLE example DISABLE ROW LEVEL SECURITY`);
};
```

---

## Legacy Files (migrations/*.sql)

The 53 `.sql` files in `migrations/` are the original schema files applied before
the migration framework was introduced. They are **read-only reference files**.

- Do NOT modify them
- Do NOT re-run them on the live database
- They are covered by `001_baseline.js`

**Deprecated (WhatsApp — removed in Phase 1):**
- `44_whatsapp.sql`
- `48_fix_whatsapp_tenant_id.sql`

---

## Production Deployment

```bash
# On the server, after git pull:
cd /opt/ssgzone/database
npm install
npm run migrate:up
```

Migrations run automatically as part of the deployment workflow.
Always take a database backup before running migrations in production.
