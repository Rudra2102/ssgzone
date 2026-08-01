# D11 — Architecture Decision Records | Part 02: Video, Storage, Search, Provisioning & Messaging

## ADR-007: Video Meeting Stack — Self-hosted WebRTC SFU (Technology TBD)

**Status**: Proposed (final selection deferred to Phase 2)

**Context**:
SSGzone requires self-hosted video meetings. The public Jitsi iframe was rejected early (no auth, data leaves platform). A self-hosted WebRTC SFU is required. Three strong candidates exist and the final choice will be made during Phase 2 based on load testing and SDK evaluation.

**Decision**: Self-hosted WebRTC SFU. Technology to be finalized in Phase 2. Candidates: LiveKit, mediasoup, Janus.

**Candidates Under Evaluation**:

| Candidate | Language | License | SDK Quality | Ops Complexity | Notes |
|-----------|----------|---------|-------------|----------------|-------|
| LiveKit | Go | Apache 2.0 | Excellent (JS, React, mobile) | Low | Room API, egress recording, TURN built-in |
| mediasoup | C++ / Node.js | ISC | Good (JS native) | Medium | Lower-level, more control, no built-in room concept |
| Janus | C | GPL / MIT | Moderate | High | Mature, battle-tested, complex configuration |

**Rejected Options**:
| Option | Reason Rejected |
|--------|----------------|
| Jitsi public iframe | No auth, data leaves platform, no tenant isolation |
| Jitsi self-hosted (Jicofo/JVB) | Java stack, high memory, complex ops for small team |
| Daily.co / Whereby embed | External dependency, data leaves platform, per-minute cost |
| Amazon Chime SDK | AWS lock-in, cost at scale |
| Twilio Video | External dependency, cost at scale, data leaves platform |

**Evaluation Criteria for Phase 2 Decision**:
1. Load test: 100 concurrent participants in a single room
2. SDK: React/JS client SDK quality and bundle size
3. Recording: composite recording to S3 without additional infrastructure
4. TURN server: built-in or requires separate coturn deployment
5. Horizontal scaling: multiple SFU instances behind a load balancer
6. Community & maintenance: active development, security patches

**API Contract (technology-agnostic)**:
All video API endpoints (D4 API Part 04) and database tables (D3 DB Part 03) are designed to be SFU-agnostic. The SFU is an internal implementation detail. The public API surface does not expose SFU-specific concepts.

**Consequences**:
- Phase 1 ships without video (video is Phase 2)
- Phase 2 begins with a 2-week spike to evaluate LiveKit vs mediasoup
- All video code is isolated in a `video-service` module — SFU can be swapped without touching other modules
- Environment variable `VIDEO_SFU_PROVIDER` controls which adapter is loaded

**Review Trigger**: This ADR is resolved when Phase 2 spike completes. The chosen technology replaces "TBD" in all documents.

---

## ADR-008: Object Storage — S3-compatible

**Status**: Accepted

**Context**:
SSGzone stores: mail attachments, drive files, chat file attachments, video recordings, data exports, archive files. A scalable, durable object storage solution is required.

**Decision**: S3-compatible object storage. AWS S3 in production; MinIO for local development.

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Local filesystem | Not scalable, not HA, not suitable for multi-instance deployment |
| Google Cloud Storage | Viable but adds multi-cloud complexity; S3 API is the de facto standard |
| Cloudflare R2 | S3-compatible, zero egress cost — strong candidate for Phase 3 cost optimization |
| Azure Blob Storage | Not S3-compatible natively; adds SDK complexity |
| Self-hosted Ceph | Operational complexity too high for Phase 1 |

**Rationale**:
- S3 API is the industry standard: all libraries, tools, and CDNs support it
- MinIO is S3-compatible: local dev environment is identical to production
- Presigned URLs: clients upload/download directly to S3 without proxying through API server — reduces bandwidth cost and latency
- Lifecycle policies: automatic transition to Glacier for archived chat/mail data
- SSE-AES256: server-side encryption at rest, enabled by default
- Bucket-per-concern: `ssgzone-mail`, `ssgzone-drive`, `ssgzone-chat`, `ssgzone-exports`, `ssgzone-archives`

**Consequences**:
- AWS S3 egress cost: mitigated by CloudFront CDN for frequently accessed files (drive previews, avatars)
- Cloudflare R2 migration path: R2 is S3-compatible — migration is a config change, not a code change
- All S3 keys follow a consistent pattern: `{tenantId}/{module}/{year}/{month}/{uuid}.{ext}`

**Review Trigger**: If monthly S3 egress cost exceeds ₹50,000, evaluate Cloudflare R2 as primary storage.

---

## ADR-009: Job Queue System — BullMQ

**Status**: Accepted

**Context**:
Multiple background processing needs: outbound mail delivery, tenant provisioning, push notifications, AI jobs, bulk user import, retention enforcement, webhook delivery. A reliable, observable job queue is required.

**Decision**: BullMQ (Redis-backed, Node.js)

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Bull (v3) | BullMQ is the maintained successor; Bull is in maintenance mode |
| Agenda (MongoDB) | Requires MongoDB; we use PostgreSQL + Redis; adds a third data store |
| pg-boss (PostgreSQL) | Interesting option; PostgreSQL-native; viable if Redis is removed; lower throughput than BullMQ |
| Bee-Queue | Simpler but fewer features (no priorities, no rate limiting) |
| Sidekiq (Ruby) | Wrong language stack |
| Temporal | Excellent for complex workflows; operational overhead too high for Phase 1 |

**Rationale**:
- Runs on existing Redis instance — no additional infrastructure
- Priority queues: `transactional` (priority 10) vs `bulk` (priority 1) for mail
- Rate limiting: built-in per-queue rate limiter for outbound mail and messaging
- Delayed jobs: calendar reminders, scheduled emails, retry backoff
- Concurrency control: per-worker concurrency setting
- Dead letter queue: failed jobs after max attempts moved to failed set, inspectable via Bull Board UI
- Bull Board: open-source UI for queue monitoring, deployable as internal admin tool

**Consequences**:
- BullMQ requires Redis 6.2+: enforced in infrastructure
- Job data stored in Redis: large payloads (e.g. bulk import CSV) should store S3 key in job, not raw data
- All jobs must be idempotent: a job re-run after failure must not cause duplicate side effects

**Review Trigger**: If total queue throughput exceeds 100,000 jobs/min or if cross-service workflow orchestration is needed, evaluate Temporal.

---

## ADR-010: Search Engine — PostgreSQL FTS + Elasticsearch

**Status**: Accepted

**Context**:
SSGzone needs search across: chat messages, contacts, calendar events (moderate volume, structured), and mail bodies, drive file content (high volume, large text). A single search solution may not serve both needs optimally.

**Decision**: Two-tier search — PostgreSQL Full-Text Search for structured/moderate-volume data + Elasticsearch for high-volume text (mail bodies, drive content)

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| PostgreSQL FTS only | Sufficient for chat/contacts/calendar; insufficient for mail body search at scale (large text, high volume) |
| Elasticsearch only | Adds operational complexity for data that PostgreSQL FTS handles well; duplication of source of truth |
| Typesense | Excellent for structured search; less mature for large document full-text; smaller ecosystem |
| Meilisearch | Fast, easy to operate; limited scalability for very large corpora |
| Algolia | SaaS, data leaves platform, cost at scale |
| OpenSearch | Elasticsearch fork; viable drop-in replacement if Elasticsearch licensing changes |

**Rationale**:
- PostgreSQL FTS: zero additional infrastructure, GIN indexes, `ts_rank` scoring — sufficient for chat (short messages), contacts (structured fields), calendar (short text)
- Elasticsearch: purpose-built for large document search, relevance scoring, faceted search, highlighting — needed for mail bodies (up to 10MB) and drive file content
- Hybrid approach: search API fans out to both backends in parallel, merges results
- OpenSearch is a drop-in replacement for Elasticsearch: migration path exists if needed

**Consequences**:
- Two systems to operate: mitigated by managed Elasticsearch (AWS OpenSearch Service)
- Data duplication: mail bodies indexed in both PostgreSQL (source of truth) and Elasticsearch (search index)
- Index lag: Elasticsearch index is async (eventual consistency); acceptable for search (not real-time)
- Phase 1: PostgreSQL FTS only (no Elasticsearch). Elasticsearch added in Phase 2 when mail volume justifies it.

**Review Trigger**: If PostgreSQL FTS mail search latency p95 exceeds 2 seconds with > 1M messages per tenant, add Elasticsearch.

---

## ADR-011: Provisioning Strategy — Synchronous Pipeline with Async DNS

**Status**: Accepted

**Context**:
When a SaaS platform provisions a new tenant, multiple steps must complete: DB record creation, DNS record creation, DKIM key generation, mail server configuration, admin user creation. These steps have different latency profiles and failure modes.

**Decision**: Synchronous pipeline for DB + mail server steps (< 5s), async job for DNS verification. BullMQ provisioning worker with per-step rollback.

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Fully synchronous (all steps in HTTP request) | DNS propagation can take minutes; HTTP timeout risk; poor UX |
| Fully asynchronous (all steps in background job) | API returns immediately but tenant not usable for minutes; confusing for SaaS integrators |
| Saga pattern (distributed transactions) | Correct for microservices; overkill for Phase 1 monolith |
| Step Functions (AWS) | Cloud lock-in; operational complexity |

**Rationale**:
- Steps 1–6 (DB, DKIM, mail server, admin user) complete in < 30s: done synchronously in provisioning worker
- DNS propagation (Step 3) is submitted to DNS provider API synchronously but verification is async (cron every 5 min)
- Tenant status machine: `pending → provisioning → active` — SaaS platform polls `/provision-status` endpoint
- Per-step tracking in `provisioning_logs` table: enables rollback to last successful step on retry
- Idempotent steps: each step checks if already completed before executing — safe to retry entire job

**Consequences**:
- Tenant is `active` before DNS fully propagates: first email may fail if sent within first 5 minutes. Mitigated by showing DNS propagation status in SaaS Admin dashboard
- Rollback complexity: each step has a defined rollback action (documented in D7 Provisioning Part 01)
- Worker concurrency: max 5 provisioning jobs in parallel to avoid DNS provider rate limits

**Review Trigger**: If provisioning SLA degrades below 30s p95, profile each step and optimize the slowest.

---

## ADR-012: Messaging Infrastructure Approach — Platform-first, Connectors-second

**Status**: Accepted

**Context**:
SSGzone needs to enable SaaS applications to send messages to their users via external channels (SMS, WhatsApp, etc.). Two approaches exist: build channel-specific integrations, or build a channel-agnostic messaging platform with pluggable connectors.

**Decision**: Build the SSGzone Messaging Infrastructure Platform first — a channel-agnostic, programmable messaging layer. Individual channel connectors (SMS, WhatsApp, RCS) are plugged in progressively.

**Rationale**:
- Comparable platforms: Twilio, MessageBird, Sinch, Infobip — all are channel-agnostic platforms, not channel-specific products
- Single API (`POST /api/v1/messaging/send` with `channel` parameter) means SaaS integrators write one integration that works for all current and future channels
- Adding a new channel connector does not change the public API contract
- Channel providers change (pricing, reliability, compliance) — the platform abstracts this from SaaS integrators
- India-first: DLT compliance for SMS, WhatsApp Business API compliance — handled at the connector level, not exposed to SaaS integrators

**Channel Connector Roadmap**:
| Phase | Connector | Provider |
|-------|-----------|----------|
| 5.0 | SMS | MSG91 (primary), Twilio (fallback) |
| 5.1 | WhatsApp Business | Meta Cloud API |
| 5.2 | RCS | Google RCS Business Messaging |
| 6+ | Voice | TBD |
| 6+ | Mobile Push | FCM / APNs |

**What WhatsApp is NOT**:
- WhatsApp is not a core SSGzone product feature
- WhatsApp is not a standalone module
- WhatsApp is one connector among many in the Messaging Infrastructure Platform
- The platform does not depend on WhatsApp being available — if Meta changes its API, only the WhatsApp connector is affected

**Consequences**:
- Phase 5 requires building the platform infrastructure before any connector is useful
- Platform adds latency vs direct provider integration: acceptable (< 50ms overhead)
- Connector failures are isolated: SMS connector failure does not affect WhatsApp connector

**Review Trigger**: If a single channel (e.g. WhatsApp) accounts for > 80% of messaging volume, evaluate whether a dedicated optimized path is warranted alongside the platform.

---

## ADR Summary Table

| ADR | Decision | Status | Review Trigger |
|-----|----------|--------|----------------|
| ADR-001 | PostgreSQL as primary database | Accepted | > 10K sustained connections |
| ADR-002 | Redis + BullMQ for cache/queue/pub-sub | Accepted | > 500K jobs/min |
| ADR-003 | JWT (RS256) + Redis session blacklist | Accepted | Dedicated IdP requirement |
| ADR-004 | Shared DB + RLS for multi-tenancy | Accepted | Single tenant > 500GB |
| ADR-005 | UUID v4 for all primary keys | Accepted | > 10K inserts/sec on hot tables |
| ADR-006 | Redis Pub/Sub + BullMQ event architecture | Accepted | Ordering guarantees required |
| ADR-007 | Self-hosted WebRTC SFU (TBD: LiveKit / mediasoup / Janus) | Proposed | Phase 2 spike resolves this |
| ADR-008 | S3-compatible object storage | Accepted | Monthly egress > ₹50K |
| ADR-009 | BullMQ job queue | Accepted | > 100K jobs/min or workflow orchestration |
| ADR-010 | PostgreSQL FTS + Elasticsearch (two-tier) | Accepted | Mail search p95 > 2s |
| ADR-011 | Synchronous provisioning pipeline + async DNS verification | Accepted | Provisioning p95 > 30s |
| ADR-012 | Messaging Infrastructure Platform with pluggable connectors | Accepted | Single channel > 80% volume |

---

*Part 02 of 02 — D11 Architecture Decision Records Complete*
