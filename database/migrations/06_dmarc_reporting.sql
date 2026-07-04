-- DMARC Reporting Tables
CREATE TABLE dmarc_reports (
    id SERIAL PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    report_id VARCHAR(255) NOT NULL,
    date_begin TIMESTAMP NOT NULL,
    date_end TIMESTAMP NOT NULL,
    domain VARCHAR(255) NOT NULL,
    policy_p VARCHAR(20) NOT NULL,
    policy_sp VARCHAR(20),
    policy_pct INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dmarc_record_data (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES dmarc_reports(id),
    source_ip INET NOT NULL,
    count INTEGER NOT NULL,
    disposition VARCHAR(20) NOT NULL,
    dkim_result VARCHAR(20) NOT NULL,
    spf_result VARCHAR(20) NOT NULL,
    header_from VARCHAR(255) NOT NULL,
    dkim_auth JSONB,
    spf_auth JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dmarc_reports_domain ON dmarc_reports(domain);
CREATE INDEX idx_dmarc_record_failures ON dmarc_record_data(dkim_result, spf_result, created_at);
CREATE INDEX idx_dmarc_record_report ON dmarc_record_data(report_id);