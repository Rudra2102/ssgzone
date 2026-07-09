-- PostgreSQL Full-Text Search Schema Migration
-- Purpose: Add email search index with full-text search capabilities
-- Date: 2026-07-09

-- Full-text search index table
CREATE TABLE IF NOT EXISTS email_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
  subject_text VARCHAR(500),
  body_text TEXT,
  sender_email VARCHAR(255),
  recipient_emails TEXT,
  search_vector tsvector,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_email_search_tenant FOREIGN KEY (tenant_id) REFERENCES tenant_companies(id) ON DELETE CASCADE
);

-- GIN index for full-text search (fast search)
CREATE INDEX IF NOT EXISTS idx_email_search_vector ON email_search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_email_search_tenant ON email_search_index(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_search_created ON email_search_index(created_at);
CREATE INDEX IF NOT EXISTS idx_email_search_email_id ON email_search_index(email_id);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_email_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.subject_text, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.body_text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sender_email, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.recipient_emails, '')), 'C');
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on insert/update
DROP TRIGGER IF EXISTS email_search_vector_trigger ON email_search_index;
CREATE TRIGGER email_search_vector_trigger
BEFORE INSERT OR UPDATE ON email_search_index
FOR EACH ROW EXECUTE FUNCTION update_email_search_vector();

-- Search function with ranking
CREATE OR REPLACE FUNCTION search_emails(
  p_tenant_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  email_id UUID,
  subject VARCHAR,
  sender VARCHAR,
  rank FLOAT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    esi.email_id,
    esi.subject_text,
    esi.sender_email,
    ts_rank(esi.search_vector, plainto_tsquery('english', p_query))::FLOAT,
    esi.created_at
  FROM email_search_index esi
  WHERE esi.tenant_id = p_tenant_id
    AND esi.search_vector @@ plainto_tsquery('english', p_query)
  ORDER BY ts_rank(esi.search_vector, plainto_tsquery('english', p_query)) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Advanced search function with date range
CREATE OR REPLACE FUNCTION search_emails_advanced(
  p_tenant_id UUID,
  p_query TEXT,
  p_from_date TIMESTAMP DEFAULT NULL,
  p_to_date TIMESTAMP DEFAULT NULL,
  p_sender VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  email_id UUID,
  subject VARCHAR,
  sender VARCHAR,
  rank FLOAT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    esi.email_id,
    esi.subject_text,
    esi.sender_email,
    ts_rank(esi.search_vector, plainto_tsquery('english', p_query))::FLOAT,
    esi.created_at
  FROM email_search_index esi
  WHERE esi.tenant_id = p_tenant_id
    AND esi.search_vector @@ plainto_tsquery('english', p_query)
    AND (p_from_date IS NULL OR esi.created_at >= p_from_date)
    AND (p_to_date IS NULL OR esi.created_at <= p_to_date)
    AND (p_sender IS NULL OR esi.sender_email ILIKE p_sender)
  ORDER BY ts_rank(esi.search_vector, plainto_tsquery('english', p_query)) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- View for search statistics
CREATE OR REPLACE VIEW email_search_stats AS
SELECT 
  tenant_id,
  COUNT(*) as indexed_emails,
  COUNT(DISTINCT sender_email) as unique_senders,
  MIN(created_at) as oldest_email,
  MAX(created_at) as newest_email
FROM email_search_index
GROUP BY tenant_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_search_index TO postgres;
GRANT EXECUTE ON FUNCTION search_emails TO postgres;
GRANT EXECUTE ON FUNCTION search_emails_advanced TO postgres;
GRANT SELECT ON email_search_stats TO postgres;
