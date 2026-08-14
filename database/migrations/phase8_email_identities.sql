-- Phase 8: Direct Client Email Identities
-- Allows each direct client to have multiple email identities (aliases, send-only addresses)

CREATE TABLE IF NOT EXISTS direct_client_email_identities (
  id              SERIAL PRIMARY KEY,
  direct_client_id INTEGER NOT NULL REFERENCES direct_clients(id) ON DELETE CASCADE,
  email_address   VARCHAR(255) NOT NULL UNIQUE,
  display_name    VARCHAR(255),
  identity_type   VARCHAR(20) NOT NULL DEFAULT 'send-only'
                  CHECK (identity_type IN ('alias', 'send-only')),
  forwards_to     VARCHAR(255),  -- only for alias type
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT alias_requires_forwards_to CHECK (
    identity_type != 'alias' OR forwards_to IS NOT NULL
  )
);

CREATE INDEX idx_email_identities_client ON direct_client_email_identities(direct_client_id);
CREATE INDEX idx_email_identities_email ON direct_client_email_identities(email_address);

CREATE TRIGGER update_email_identities_updated_at
  BEFORE UPDATE ON direct_client_email_identities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
