ALTER TABLE whatsapp_messages ALTER COLUMN tenant_id TYPE VARCHAR(100) USING tenant_id::VARCHAR;
ALTER TABLE whatsapp_contacts ALTER COLUMN tenant_id TYPE VARCHAR(100) USING tenant_id::VARCHAR;
