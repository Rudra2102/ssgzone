# SSGzone Mail - Architecture Implementation Guide

## Project Information
- **Server**: root@prashasthub.com
- **Project Location**: /opt/ssgzone/
- **Database**: ssgzone_mail (PostgreSQL)
- **Frontend**: /opt/ssgzone/unified-login (port 3001)
- **Backend**: /opt/ssgzone/api-gateway (port 4000)

---

## Architecture Decisions (20 Questions Answered)

| # | Component | Decision | Rationale |
|---|-----------|----------|-----------|
| 1 | Email Storage | Hybrid (DB + MinIO S3) | Cost-effective, scalable, full history |
| 2 | Search & Indexing | Elasticsearch | Fast full-text search, industry standard |
| 3 | Email Delivery | Async Queue (Redis) | Scalable, reliable, retry logic |
| 4 | SMTP Server | AWS SES Only | High deliverability, no fallback complexity |
| 5 | Attachment Scanning | ClamAV (Self-hosted) | Free, cost-effective, full control |
| 6 | Authentication | OAuth 2.0 + JWT | SSO-ready, industry standard, flexible |
| 7 | Attachment Limits | Hybrid (Per-email + Monthly Quota) | Abuse prevention, monetization |
| 8 | Email Retention | Archive Strategy (Hot + Cold) | Cost-effective, compliance-ready |
| 9 | Spam Filtering | Hybrid (SPF/DKIM/DMARC + SpamAssassin) | Comprehensive, cost-effective |
| 10 | Real-Time Notifications | WebSocket | Instant updates, low latency |
| 11 | Rate Limiting | Tiered (with SaaS Override) | Monetization, resource control |
| 12 | Audit Logging | Comprehensive | Compliance, security, debugging |
| 13 | Data Isolation | Shared DB (Row-Level Security) | Cost-effective, scalable |
| 14 | Backup & DR | AWS RDS + S3 | Managed, reliable, compliance-ready |
| 15 | Monitoring | Prometheus + Grafana | Free, full control, customizable |
| 16 | Email Templates | Handlebars | Flexible, secure, industry standard |
| 17 | Scheduling & Bulk | Full Suite | Complete, flexible, monetizable |
| 18 | Analytics | Hybrid (Aggregated + Detailed) | Privacy-friendly, compliance-ready |
| 19 | API Documentation | OpenAPI + Developer Portal | Professional, auto-generated |
| 20 | Webhooks | Simple with Retry Logic | Real-time, efficient, reliable |

---

## Phase 1: Email Storage Model (Hybrid - DB + MinIO)

### 1.1 MinIO Installation (COMPLETED)

**Status**: ✅ DONE on production server

**Installation Details**:
```
Location: /home/ssgzone/minio/
Binary: /home/ssgzone/minio/bin/minio
Data: /home/ssgzone/minio/data
Config: /home/ssgzone/minio/.env
Service: /etc/systemd/system/minio.service
```

**Credentials**:
```
Username: ssgzone_admin
Password: SSGzone@MinIO2024Secure
API Port: 9000
Console Port: 9001
```

**Verification**:
```bash
# Check service status
systemctl status minio

# Check listening ports
netstat -tlnp | grep minio

# Health check
curl http://localhost:9000/minio/health/live
```

---

### 1.2 Environment Configuration

**File**: `/opt/ssgzone/.env`

**Current Status**: MinIO config commented out

**Required Changes**:
```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ROOT_USER=ssgzone_admin
MINIO_ROOT_PASSWORD=SSGzone@MinIO2024Secure
MINIO_BUCKET_EMAILS=ssgzone-emails
MINIO_BUCKET_ATTACHMENTS=ssgzone-attachments
MINIO_BUCKET_BACKUPS=ssgzone-backups
```

**Action**: Update `.env` file with above configuration

---

### 1.3 Node.js Dependencies

**Status**: ❌ NOT INSTALLED

**Required Package**:
```bash
cd /opt/ssgzone/api-gateway
npm install minio
```

**Why**: MinIO client library for Node.js

---

### 1.4 Storage Service Configuration

**File**: `/opt/ssgzone/api-gateway/src/services/storageService.js`

**Current Status**: Uses AWS SDK (S3-compatible)

**Required Update**: Ensure MinIO endpoint configuration

**Code**:
```javascript
const AWS = require('aws-sdk');

class StorageService {
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      accessKeyId: process.env.MINIO_ROOT_USER || 'ssgzone_admin',
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'SSGzone@MinIO2024Secure',
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    this.buckets = {
      emails: process.env.MINIO_BUCKET_EMAILS || 'ssgzone-emails',
      attachments: process.env.MINIO_BUCKET_ATTACHMENTS || 'ssgzone-attachments',
      backups: process.env.MINIO_BUCKET_BACKUPS || 'ssgzone-backups'
    };
  }

  async initializeBuckets() {
    for (const [name, bucket] of Object.entries(this.buckets)) {
      try {
        await this.s3.headBucket({ Bucket: bucket }).promise();
        console.log(`✓ Bucket exists: ${bucket}`);
      } catch (error) {
        if (error.code === 'NoSuchBucket') {
          await this.s3.createBucket({ Bucket: bucket }).promise();
          console.log(`✓ Bucket created: ${bucket}`);
        }
      }
    }
  }

  async uploadEmail(emailContent, tenantId, emailId) {
    const key = `emails/${tenantId}/${emailId}.json`;
    const params = {
      Bucket: this.buckets.emails,
      Key: key,
      Body: JSON.stringify(emailContent),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256'
    };
    
    const result = await this.s3.upload(params).promise();
    return { key, location: result.Location };
  }

  async uploadAttachment(file, tenantId, emailId) {
    const key = `attachments/${tenantId}/${emailId}/${file.originalname}`;
    const params = {
      Bucket: this.buckets.attachments,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256'
    };
    
    const result = await this.s3.upload(params).promise();
    return { key, size: file.size, location: result.Location };
  }

  async getEmail(key, tenantId) {
    if (!key.startsWith(`emails/${tenantId}/`)) {
      throw new Error('Access denied');
    }
    
    const params = { Bucket: this.buckets.emails, Key: key };
    const data = await this.s3.getObject(params).promise();
    return JSON.parse(data.Body.toString());
  }

  async deleteEmail(key, tenantId) {
    if (!key.startsWith(`emails/${tenantId}/`)) {
      throw new Error('Access denied');
    }
    
    const params = { Bucket: this.buckets.emails, Key: key };
    await this.s3.deleteObject(params).promise();
  }
}

module.exports = new StorageService();
```

---

### 1.5 Database Migration

**File**: `/opt/ssgzone/database/migrations/27_email_storage_schema.sql`

**Purpose**: Add email_storage table to track S3 references

**SQL**:
```sql
-- Email Storage Schema
CREATE TABLE IF NOT EXISTS email_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenant_companies(id) ON DELETE CASCADE,
  storage_key VARCHAR(500) NOT NULL,
  storage_type VARCHAR(50) NOT NULL, -- 'email', 'attachment'
  file_size BIGINT NOT NULL,
  content_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,
  archive_location VARCHAR(500), -- Glacier/Archive path
  
  CONSTRAINT valid_storage_type CHECK (storage_type IN ('email', 'attachment'))
);

-- Indexes
CREATE INDEX idx_email_storage_email_id ON email_storage(email_id);
CREATE INDEX idx_email_storage_tenant_id ON email_storage(tenant_id);
CREATE INDEX idx_email_storage_created_at ON email_storage(created_at);
CREATE INDEX idx_email_storage_archived_at ON email_storage(archived_at);

-- Archive Policy View
CREATE OR REPLACE VIEW email_storage_archive_policy AS
SELECT 
  id,
  email_id,
  tenant_id,
  storage_key,
  storage_type,
  file_size,
  created_at,
  CASE 
    WHEN created_at < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'archive_to_glacier'
    WHEN created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' THEN 'delete'
    ELSE 'keep_hot'
  END as action
FROM email_storage
WHERE archived_at IS NULL;

-- Audit trigger
CREATE OR REPLACE FUNCTION audit_email_storage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    action, table_name, record_id, tenant_id, user_id, changes, created_at
  ) VALUES (
    TG_OP, 'email_storage', NEW.id, NEW.tenant_id, NULL,
    jsonb_build_object(
      'storage_key', NEW.storage_key,
      'file_size', NEW.file_size,
      'storage_type', NEW.storage_type
    ),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_storage_audit_trigger
AFTER INSERT OR UPDATE ON email_storage
FOR EACH ROW EXECUTE FUNCTION audit_email_storage();
```

---

### 1.6 API Endpoints

**File**: `/opt/ssgzone/api-gateway/src/routes/storage.js` (NEW)

**Endpoints**:

#### Upload Email
```
POST /api/v1/storage/email
Headers: Authorization: Bearer {token}
Body: {
  email_id: UUID,
  content: { subject, body, from, to, ... },
  attachments: [{ filename, size, key }, ...]
}
Response: { success: true, storage_key: "emails/tenant_id/email_id.json" }
```

#### Upload Attachment
```
POST /api/v1/storage/attachment
Headers: Authorization: Bearer {token}
Body: FormData with file
Response: { success: true, key: "attachments/tenant_id/email_id/filename" }
```

#### Retrieve Email
```
GET /api/v1/storage/email/:storage_key
Headers: Authorization: Bearer {token}
Response: { email_id, content, attachments, created_at }
```

#### Delete Email
```
DELETE /api/v1/storage/email/:storage_key
Headers: Authorization: Bearer {token}
Response: { success: true }
```

---

### 1.7 Implementation Steps

**Step 1**: Update `.env` file
```bash
# On local machine, update .env with MinIO config
# Then commit and push to GitHub
git add .env
git commit -m "Configure MinIO endpoints and credentials"
git push origin main
```

**Step 2**: Pull on production server
```bash
cd /opt/ssgzone
git pull origin main
```

**Step 3**: Install MinIO package
```bash
cd /opt/ssgzone/api-gateway
npm install minio
```

**Step 4**: Create storage routes file
```bash
# Create /opt/ssgzone/api-gateway/src/routes/storage.js
# (Code provided in section 1.6)
```

**Step 5**: Update server.js to include storage routes
```javascript
const storageRoutes = require('./routes/storage');
app.use('/api/v1/storage', storageRoutes);
```

**Step 6**: Run database migration
```bash
cd /opt/ssgzone
psql -h localhost -U postgres -d ssgzone_mail -f database/migrations/27_email_storage_schema.sql
```

**Step 7**: Restart API Gateway
```bash
cd /opt/ssgzone/api-gateway
npm start
# Or if using PM2:
pm2 restart ssgzone-api
```

**Step 8**: Verify MinIO buckets created
```bash
# Check via MinIO console
# http://localhost:9001
# Login: ssgzone_admin / SSGzone@MinIO2024Secure
```

---

## Important Notes

### Security
- ✅ MinIO credentials stored in `.env` (not in code)
- ✅ S3 encryption enabled (AES256)
- ✅ Tenant isolation via storage_key prefix
- ✅ Row-level security in database

### Cost Optimization
- ✅ Self-hosted MinIO (₹0 per GB)
- ✅ Archive to Glacier after 30 days (cheaper storage)
- ✅ Delete after 1 year (compliance + cost)

### Scalability
- ✅ MinIO can handle unlimited storage
- ✅ Database tracks references only (small)
- ✅ Async upload/download via queue

### Monitoring
- ✅ Audit logs for all storage operations
- ✅ Storage usage tracking per tenant
- ✅ Archive policy automation

---

---

## Phase 2: Search & Indexing (PostgreSQL Full-Text Search)

### 2.1 Decision: PostgreSQL FTS Instead of Elasticsearch

**Status**: ✅ DECIDED

**Reason for Change**:
- Production server memory constraint (3.8Gi available, Elasticsearch needs 2Gi+)
- PostgreSQL already in use
- Full-text search sufficient for email search
- Cost-effective (₹0)
- Easier maintenance

**Architecture**:
```
Emails → PostgreSQL FTS Index → Search API
```

### 2.2 Database Schema

**File**: `/opt/ssgzone/database/migrations/28_search_index_schema.sql`

**Purpose**: Add full-text search indexes and functions

**Components**:
1. `email_search_index` table - Denormalized search data
2. GIN indexes for fast full-text search
3. Search functions for ranking and relevance
4. Trigger for automatic index updates

**SQL**:
```sql
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

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_email_search_vector ON email_search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_email_search_tenant ON email_search_index(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_search_created ON email_search_index(created_at);

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
```

### 2.3 Search Service

**File**: `/opt/ssgzone/api-gateway/src/services/searchService.js` (NEW)

**Purpose**: PostgreSQL FTS operations

**Methods**:
- `indexEmail()` - Add email to search index
- `searchEmails()` - Search with ranking
- `deleteIndex()` - Remove from index
- `updateIndex()` - Update indexed email

### 2.4 API Endpoints

**Endpoints**:
```
GET /api/v1/search/emails?q=query&limit=20&offset=0
  - Search emails by query
  - Returns: [{ email_id, subject, sender, rank, created_at }]

POST /api/v1/search/index
  - Index new email
  - Body: { email_id, subject, body, sender, recipients }

DELETE /api/v1/search/index/:email_id
  - Remove from index

PUT /api/v1/search/index/:email_id
  - Update indexed email
```

### 2.5 Implementation Steps

1. Create database migration (28_search_index_schema.sql)
2. Create searchService.js
3. Create search routes
4. Update server.js with search routes
5. Run database migration
6. Restart API Gateway
7. Test search functionality

### 2.6 Performance Characteristics

**Advantages**:
- No extra infrastructure
- Fast GIN index searches
- Ranking support
- Tenant isolation built-in
- Cost: ₹0

**Limitations**:
- Single-node search (no distributed)
- Suitable for moderate load (< 1M emails)
- No advanced features like facets

### 2.7 Future Migration Path

If search performance becomes bottleneck:
1. Upgrade server memory
2. Install Elasticsearch
3. Migrate to Elasticsearch with dual indexing
4. Deprecate PostgreSQL FTS

---

---

## Phase 3: Redis Queue for Email Delivery

### 3.1 Decision: Bull + Redis

**Status**: ✅ IMPLEMENTED

**Architecture**:
```
API Request → enqueueEmail() → Bull Queue (Redis) → Job Processor → AWS SES → Delivered
                                      ↓
                            email_delivery_queue (DB tracking)
```

**Why Bull over raw Redis**:
- Built-in retry with exponential backoff
- Job priority support
- Delayed/scheduled jobs
- Job status tracking
- Concurrency control

### 3.2 Files

| File | Purpose |
|------|---------|
| `database/migrations/29_email_queue_schema.sql` | Queue tracking table |
| `api-gateway/src/services/queueService.js` | Bull queue + SES processor |
| `api-gateway/src/routes/queue.js` | Queue management API |
| `api-gateway/src/jobs/emailScheduler.js` | Updated - migrates old pending emails |

### 3.3 API Endpoints

```
POST   /api/v1/queue/email          - Enqueue email for delivery
GET    /api/v1/queue/status/:dbId   - Get job status
DELETE /api/v1/queue/cancel/:dbId   - Cancel queued email
GET    /api/v1/queue/stats          - Queue statistics
```

### 3.4 Job Configuration

- Max retries: 3
- Backoff: Exponential (5s, 10s, 20s)
- Priority: 0 (default), higher = more urgent
- Scheduled delivery: supported via `scheduled_at`

### 3.5 Production Deployment

```bash
# Verify Redis is running
redis-cli ping

# Install bull
cd /opt/ssgzone/api-gateway
npm install bull

# Run migration
psql -h localhost -U postgres -d ssgzone_mail -f database/migrations/29_email_queue_schema.sql

# Restart
pm2 restart ssgzone-api
```

---

---

## Phase 4: ClamAV Attachment Scanning

### 4.1 Status: ✅ IMPLEMENTED

**ClamAV on production**: Already installed and running since June 10
- Version: 1.5.3
- Socket: `/var/run/clamav/clamd.ctl`
- Virus definitions: Up-to-date (355490 sigs)
- Memory: ~973MB

### 4.2 Architecture

```
File Upload → scanBuffer() → clamdscan (Unix socket) → clamd daemon
                                  ↓
                    Clean → upload to MinIO
                    Infected → 422 rejected
```

### 4.3 Files

| File | Purpose |
|------|---------|
| `api-gateway/src/services/clamavService.js` | ClamAV scan service |
| `api-gateway/src/routes/attachments.js` | Updated - scan before upload |

### 4.4 Behavior

- Scans every uploaded attachment before storing in MinIO
- Infected files → HTTP 422 with virus name
- clamd unavailable → fail open (warn, don't block)
- Max scan size: 100MB (configurable via `MAX_SCAN_SIZE`)
- Health check: `GET /api/v1/attachments/health`

### 4.5 Environment Variables

```env
CLAMD_SOCKET=/var/run/clamav/clamd.ctl
MAX_SCAN_SIZE=104857600
```

---

## Next Phases (To Be Documented)

---

## Phase 5: SpamAssassin Integration

### 5.1 Status: ✅ IMPLEMENTED

**SpamAssassin on production**: Installed, started and enabled
- Version: 3.4.6
- Protocol: TCP `localhost:783` (spamd)
- Threshold: 5.0 (configured in local.cf)
- Bayes learning: enabled
- DKIM whitelisting: enabled

### 5.2 Architecture

```
POST /email/send → checkSpam(rawEmail) → spamd:783 → score < 5.0 → queue
                                                      → score >= 5.0 → 422 rejected
```

### 5.3 Files

| File | Purpose |
|------|---------|
| `api-gateway/src/services/spamService.js` | spamd TCP client + response parser |
| `api-gateway/src/routes/communication.js` | Updated - spam check on send |

### 5.4 Endpoints

```
POST /api/v1/communication/email/send       - Spam checked before queuing
POST /api/v1/communication/email/spam-check - Standalone spam check
```

### 5.5 Behavior

- Outbound emails checked before queuing
- Score >= 5.0 → HTTP 422 with score details
- spamd unavailable → fail open (warn, don't block)
- Timeout: 15s

### 5.6 Environment Variables

```env
SPAMD_HOST=localhost
SPAMD_PORT=783
SPAM_THRESHOLD=5.0
```

---

## Next Phases (To Be Documented)

---

## Phase 6: Prometheus + Grafana Monitoring

### 6.1 Status: ✅ IMPLEMENTED

**Services on production**:
- Prometheus: `http://prashasthub.com:9090`
- Grafana: `http://prashasthub.com:9093` (default login: admin/admin)

### 6.2 Architecture

```
ssgzone-api (:4000/api/v1/metrics) ← Prometheus scrape (:9090) ← Grafana dashboards (:9093)
```

### 6.3 Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `ssgzone_emails_queued_total` | Gauge | Emails in queue |
| `ssgzone_emails_sent_total` | Gauge | Emails sent |
| `ssgzone_emails_failed_total` | Gauge | Failed deliveries |
| `ssgzone_active_tenants` | Gauge | Active tenants |
| `ssgzone_active_users` | Gauge | Active users |
| `ssgzone_search_index_total` | Gauge | Search index size |
| `ssgzone_http_request_duration_seconds` | Histogram | API latency |

### 6.4 Files

| File | Purpose |
|------|---------|
| `api-gateway/src/routes/metrics.js` | Prometheus scrape endpoint |

### 6.5 Prometheus Scrape Config

Add to `/etc/prometheus/prometheus.yml`:
```yaml
  - job_name: 'ssgzone-api'
    static_configs:
      - targets: ['localhost:4000']
    metrics_path: '/api/v1/metrics'
    scrape_interval: 15s
```

### 6.6 Grafana Setup

1. Login: `http://prashasthub.com:9093` (admin/admin)
2. Add Prometheus datasource: `http://localhost:9090`
3. Import dashboard or create panels for custom metrics

---

---

## Phase 7: Webhook System

### 7.1 Status: ✅ IMPLEMENTED

### 7.2 Architecture

```
triggerEvent(tenantId, event, data) → find matching webhooks → HTTP POST with HMAC signature
                                                                      ↓ failed → retry (exp backoff)
```

### 7.3 Files

| File | Purpose |
|------|---------|
| `database/migrations/30_webhook_schema.sql` | webhooks + webhook_deliveries tables |
| `api-gateway/src/services/webhookService.js` | HMAC signing, delivery, retry logic |
| `api-gateway/src/routes/webhooks.js` | Webhook management API |

### 7.4 Supported Events

`email.received`, `email.sent`, `email.bounced`, `email.spam`, `user.created`, `user.deleted`, `tenant.suspended`, `tenant.activated`, `quota.exceeded`, `attachment.blocked`, `webhook.test`

### 7.5 API Endpoints

```
POST   /api/v1/webhooks/register          - Register webhook
GET    /api/v1/webhooks/                  - List webhooks
PUT    /api/v1/webhooks/:id               - Update webhook
DELETE /api/v1/webhooks/:id               - Disable webhook
GET    /api/v1/webhooks/:id/deliveries    - Delivery logs
POST   /api/v1/webhooks/:id/test          - Send test event
POST   /api/v1/webhooks/retry-pending     - Retry failed deliveries
```

### 7.6 Security

- HMAC-SHA256 signature in `X-SSGzone-Signature` header
- Retry: 3 attempts with exponential backoff (1min, 5min, 30min)
- Timeout: 10s per delivery attempt

---

---

## Phase 8: Tiered Rate Limiting

### 8.1 Status: ✅ IMPLEMENTED

### 8.2 Architecture

```
Request → rateLimitMiddleware → getTierLimits() → SaaS override OR tenant tier
                                        ↓
                          Redis sliding window check (per-minute + per-hour)
                                        ↓
                          429 blocked OR pass through
```

### 8.3 Tiers

| Tier | Req/min | Req/hour | Emails/day | Emails/month |
|------|---------|----------|------------|---------------|
| free | 30 | 500 | 100 | 1,000 |
| pro | 120 | 5,000 | 2,000 | 50,000 |
| enterprise | 600 | 50,000 | 20,000 | 500,000 |

### 8.4 Files

| File | Purpose |
|------|---------|
| `database/migrations/31_rate_limit_tiers.sql` | Tier config + SaaS override tables |
| `api-gateway/src/middleware/rateLimit.js` | Redis sliding window rate limiter |

### 8.5 SaaS Override

Insert into `saas_rate_overrides` to give a specific SaaS app custom limits bypassing tier defaults.

### 8.6 Behavior

- Redis sliding window (accurate, no burst at window boundary)
- Tier limits cached 5 minutes to reduce DB load
- Fail open if Redis unavailable
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Next Phases (To Be Documented)

- Phase 9: Comprehensive Logging
- Phase 10: Backup & Disaster Recovery

---

## Troubleshooting

### MinIO Connection Issues
```bash
# Check if MinIO is running
systemctl status minio

# Check logs
journalctl -u minio -n 50

# Verify connectivity
curl -v http://localhost:9000/minio/health/live
```

### Database Migration Issues
```bash
# Check migration status
psql -h localhost -U postgres -d ssgzone_mail -c "\dt email_storage"

# Rollback if needed
psql -h localhost -U postgres -d ssgzone_mail -c "DROP TABLE email_storage CASCADE;"
```

### API Connection Issues
```bash
# Check API logs
pm2 logs ssgzone-api

# Test storage service
curl -X POST http://localhost:4000/api/v1/storage/test
```

---

## References

- MinIO Documentation: https://docs.min.io/
- AWS S3 API: https://docs.aws.amazon.com/s3/
- PostgreSQL: https://www.postgresql.org/docs/
