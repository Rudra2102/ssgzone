-- Migration: Usage-Based Rate Limiting
-- Task 2.1: Advanced Rate Limiting Engine

-- Create tenant usage limits table
CREATE TABLE tenant_usage_limits (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    emails_per_month INTEGER DEFAULT 50000,
    api_calls_per_minute INTEGER DEFAULT 100,
    storage_limit_gb INTEGER DEFAULT 100,
    users_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id)
);

-- Create usage tracking table
CREATE TABLE tenant_usage_tracking (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 2024-01
    emails_sent INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    storage_used_gb DECIMAL(10,2) DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, month_year)
);

-- Create API rate limiting table
CREATE TABLE api_rate_limits (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_duration_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, endpoint, window_start)
);

-- Create indexes
CREATE INDEX idx_tenant_usage_limits_tenant ON tenant_usage_limits(tenant_id);
CREATE INDEX idx_tenant_usage_tracking_month ON tenant_usage_tracking(tenant_id, month_year);
CREATE INDEX idx_api_rate_limits_window ON api_rate_limits(tenant_id, window_start);

-- Create trigger for updated_at
CREATE TRIGGER update_tenant_usage_limits_updated_at 
BEFORE UPDATE ON tenant_usage_limits 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();