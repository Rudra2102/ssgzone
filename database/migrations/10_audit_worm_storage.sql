-- Migration: Audit Logs WORM (Write Once, Read Many) Storage
-- Task 1.1: SOC 2 Compliance Enhancement

-- Add immutable flag and archive status to audit logs
ALTER TABLE audit_logs 
ADD COLUMN is_immutable BOOLEAN DEFAULT FALSE,
ADD COLUMN archived_at TIMESTAMP NULL,
ADD COLUMN archive_hash VARCHAR(64) NULL;

-- Create immutable audit logs table for archived logs (90+ days)
CREATE TABLE audit_logs_immutable (
    id BIGINT PRIMARY KEY,
    saas_id INTEGER,
    tenant_id INTEGER,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL,
    archived_at TIMESTAMP NOT NULL,
    archive_hash VARCHAR(64) NOT NULL
);

-- Create index for immutable logs
CREATE INDEX idx_audit_logs_immutable_created ON audit_logs_immutable(created_at);
CREATE INDEX idx_audit_logs_immutable_hash ON audit_logs_immutable(archive_hash);

-- Function to archive logs older than 90 days
CREATE OR REPLACE FUNCTION archive_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER := 0;
    log_record RECORD;
    hash_input TEXT;
    computed_hash VARCHAR(64);
BEGIN
    -- Archive logs older than 90 days
    FOR log_record IN 
        SELECT * FROM audit_logs 
        WHERE created_at < NOW() - INTERVAL '90 days' 
        AND is_immutable = FALSE
    LOOP
        -- Generate hash for immutability verification
        hash_input := log_record.id || log_record.action || log_record.created_at || COALESCE(log_record.details::text, '');
        computed_hash := encode(digest(hash_input, 'sha256'), 'hex');
        
        -- Insert into immutable table
        INSERT INTO audit_logs_immutable (
            id, saas_id, tenant_id, user_id, action, resource, 
            details, ip_address, user_agent, created_at, archived_at, archive_hash
        ) VALUES (
            log_record.id, log_record.saas_id, log_record.tenant_id, log_record.user_id,
            log_record.action, log_record.resource, log_record.details, log_record.ip_address,
            log_record.user_agent, log_record.created_at, NOW(), computed_hash
        );
        
        -- Mark original as immutable
        UPDATE audit_logs 
        SET is_immutable = TRUE, archived_at = NOW(), archive_hash = computed_hash
        WHERE id = log_record.id;
        
        archived_count := archived_count + 1;
    END LOOP;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;