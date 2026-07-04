-- Apply new schema
CREATE TABLE super_admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert super admin
INSERT INTO super_admins (username, email, password_hash, full_name) VALUES 
('superadmin', 'admin@ssgzone.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..e', 'SSGzone Administrator');

-- Verify
SELECT * FROM super_admins;