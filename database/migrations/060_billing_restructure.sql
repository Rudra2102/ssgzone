-- Migration 060: Correct billing architecture
-- SSGzone → SaaS subscription, SaaS → Tenant plans (independent)

-- 1. SaaS subscribes to an SSGzone plan
CREATE TABLE IF NOT EXISTS saas_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saas_app_id INTEGER NOT NULL REFERENCES saas_applications(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES saas_billing_plans(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'trial', 'past_due', 'cancelled', 'suspended')),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
    custom_price NUMERIC(10,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP,
    next_billing_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(saas_app_id)  -- one active subscription per SaaS
);

-- 2. SaaS creates its own tenant-facing plans (within its subscription quota)
CREATE TABLE IF NOT EXISTS tenant_billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saas_app_id INTEGER NOT NULL REFERENCES saas_applications(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    max_users INTEGER NOT NULL DEFAULT 10,
    max_storage_gb INTEGER NOT NULL DEFAULT 5,
    max_emails_per_month INTEGER NOT NULL DEFAULT 1000,
    features JSONB NOT NULL DEFAULT '{}',   -- subset of saas subscription features
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(saas_app_id, slug)
);

-- 3. Tenant subscribes to a SaaS tenant plan
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE UNIQUE,
    tenant_plan_id UUID REFERENCES tenant_billing_plans(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'trial', 'past_due', 'cancelled', 'suspended')),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
    custom_price NUMERIC(10,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP,
    next_billing_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_saas ON saas_subscriptions(saas_app_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_plan ON saas_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_status ON saas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_plans_saas ON tenant_billing_plans(saas_app_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON tenant_subscriptions(tenant_plan_id);

-- Triggers
CREATE TRIGGER update_saas_subscriptions_updated_at
    BEFORE UPDATE ON saas_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_billing_plans_updated_at
    BEFORE UPDATE ON tenant_billing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
    BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
