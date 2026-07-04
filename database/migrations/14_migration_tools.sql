-- Migration: Email Migration Tools
-- Task 2.2: MBOX/PST Import System

-- Create migration jobs table
CREATE TABLE migration_jobs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_email VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('mbox', 'pst')),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress_percentage INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    processed_messages INTEGER DEFAULT 0,
    imported_messages INTEGER DEFAULT 0,
    failed_messages INTEGER DEFAULT 0,
    error_log TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL
);

-- Create migration progress tracking
CREATE TABLE migration_progress (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES migration_jobs(id) ON DELETE CASCADE,
    step VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_migration_jobs_status ON migration_jobs(status);
CREATE INDEX idx_migration_jobs_tenant ON migration_jobs(tenant_id);
CREATE INDEX idx_migration_progress_job ON migration_progress(job_id);