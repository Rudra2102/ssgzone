-- SSGzone Mail — Phase 4: Billing System
-- Migration 058

-- Billing plans created by SuperAdmin per SaaS application
CREATE TABLE IF NOT EXISTS saas_billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saas_app_id INTEGER NOT NULL REFERENCES saas_applications(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,                        -- e.g. "Starter", "Pro", "Enterprise"
    slug VARCHAR(50) NOT NULL,                         -- e.g. "starter", "pro", "enterprise"
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    max_users INTEGER NOT NULL DEFAULT 10,
    max_storage_gb INTEGER NOT NULL DEFAULT 5,
    max_emails_per_month INTEGER NOT NULL DEFAULT 1000,
    features JSONB NOT NULL DEFAULT '{}',              -- { "chat": true, "whatsapp": false, ... }
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,          -- custom plan for a specific tenant
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES super_admins(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(saas_app_id, slug)
);

-- Tenant billing assignments — which plan a tenant is on
CREATE TABLE IF NOT EXISTS tenant_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID REFERENCES saas_billing_plans(id) ON DELETE SET NULL,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
    custom_price NUMERIC(10,2),                        -- override price set by SaaS admin
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'past_due', 'cancelled', 'suspended')),
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP,
    next_billing_date TIMESTAMP,
    notes TEXT,                                        -- SaaS admin notes
    assigned_by_saas_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing invoice history
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES saas_billing_plans(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'waived')),
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saas_billing_plans_saas ON saas_billing_plans(saas_app_id);
CREATE INDEX IF NOT EXISTS idx_saas_billing_plans_active ON saas_billing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_tenant ON tenant_billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_plan ON tenant_billing(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_status ON tenant_billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant ON billing_invoices(tenant_id);

-- Triggers
CREATE TRIGGER update_saas_billing_plans_updated_at
    BEFORE UPDATE ON saas_billing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_billing_updated_at
    BEFORE UPDATE ON tenant_billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
