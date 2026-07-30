-- Phase 6: Performance indexes for emails table
CREATE INDEX IF NOT EXISTS idx_emails_tenant_folder ON emails(tenant_id, folder, archived);
CREATE INDEX IF NOT EXISTS idx_emails_to_tenant ON emails(to_email, tenant_id, archived);
CREATE INDEX IF NOT EXISTS idx_emails_from_tenant ON emails(from_email, tenant_id, folder, archived);
CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_read_status ON emails(to_email, tenant_id, read_status) WHERE archived = false;
