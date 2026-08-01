# D11 — Architecture Decision Records | Part 01: Database, Cache, Auth & Core Patterns

## ADR Format

Each record follows this structure:
- **Status**: Accepted | Proposed | Deprecated | Superseded
- **Context**: Why a decision was needed
- **Decision**: What was chosen
- **Alternatives Considered**: What else was evaluated
- **Rationale**: Why this option won
- **Consequences**: Trade-offs accepted
- **Review Trigger**: What would cause this decision to be revisited

---

## ADR-001: Primary Database — PostgreSQL

**Status**: Accepted

**Context**:
SSGzone requires a database that supports multi-tenant data isolation, complex relational queries (mail threads, calendar attendees, chat participants), row-level security, and a mature ecosystem for a small founding team.

**Decision**: PostgreSQL (managed, e.g. AWS RDS or Supabase)

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| MySQL | No native RLS, weaker JSON support, less expressive query planner |
| MongoDB | Schema flexibility not needed; joins are core to our data model; RLS not native |
| PlanetScale (MySQL) | No RLS, branching useful but not critical at this stage |
| CockroachDB | Distributed complexity not justified at Phase 1 scale |
| Supabase (Postgres) | Viable managed option; Postgres underneath, acceptable |

**Rationale**:
- Row-Level Security (RLS) is the foundation of tenant data isolation — PostgreSQL is the only mainstream DB with native RLS
- UUID v4 primary keys, JSONB columns, full-text search (GIN indexes), and partitioning are all native
- 47-table relational schema with foreign keys, cascades, and complex joins maps naturally to relational model
- Team has existing PostgreSQL expertise
- Managed options (RDS, Supabase) reduce ops burden at Phase 1

**Consequences**:
- Vertical scaling limit: mitigated by read replicas and PgBouncer connection pooling
- Single-region in Phase 1: multi-region Postgres (Citus or Aurora Global) deferred to Phase 4
- Schema migrations require care: use versioned migrations (e.g. Flyway or node-pg-migrate)

**Review Trigger**: If concurrent connections exceed 10,000 sustained or cross-region latency becomes a product blocker.

---

## ADR-002: Cache, Queue & Pub/Sub — Redis

**Status**: Accepted

**Context**:
SSGzone needs: (1) a fast cache for sessions, presence, unread counts; (2) a job queue for mail delivery, provisioning, notifications; (3) a pub/sub bus for WebSocket event fan-out across multiple server instances.

**Decision**: Redis (managed, e.g. AWS ElastiCache or Upstash) + BullMQ for queues

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Memcached | No pub/sub, no persistence, no sorted sets |
| RabbitMQ | Excellent for queues but adds a second system; Redis covers both cache + queue |
| Apache Kafka | Overkill for Phase 1–2 scale; operational complexity too high for small team |
| SQS + SNS | AWS-only lock-in; no local dev parity; no sorted sets for rate limiting |
| Valkey | Drop-in Redis fork; viable alternative if Redis licensing changes |

**Rationale**:
- Single system covers three needs: cache, queue (BullMQ), pub/sub (Socket.io adapter)
- BullMQ provides: priority queues, retries, rate limiting, job progress — all needed for mail and provisioning workers
- Redis Streams used for WebSocket event replay (missed events on reconnect)
- Redis sorted sets used for sliding window rate limiting
- Widely understood, excellent Node.js client (ioredis)

**Consequences**:
- Redis is in-memory: data loss on crash without persistence (AOF/RDB enabled for queues)
- Single Redis instance is a SPOF in Phase 1: mitigated by managed Redis with automatic failover
- BullMQ requires Redis 6.2+: enforced in infrastructure setup

**Review Trigger**: If queue throughput exceeds 50,000 jobs/min sustained, evaluate Kafka for the queue layer while keeping Redis for cache/pub/sub.

---

## ADR-003: Authentication — JWT with Redis Session Store

**Status**: Accepted

**Context**:
SSGzone needs stateless authentication that works across multiple API server instances, supports session revocation (for admin-forced logout and tenant suspension), and integrates with MFA and SSO.

**Decision**: JWT (RS256, asymmetric) for access tokens + Redis for session blacklist + refresh token rotation

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Session cookies (server-side) | Stateful; requires sticky sessions or shared session store; doesn't work well for API-first |
| JWT (HS256, symmetric) | Single shared secret is a security risk across services |
| Opaque tokens (database lookup) | Every request hits DB; latency and scaling concern |
| Paseto | Technically superior to JWT but ecosystem/tooling much smaller |
| Auth0 / Clerk | External dependency for core auth; data leaves platform; cost at scale |

**Rationale**:
- RS256 JWT: API server verifies with public key only — private key never leaves auth service
- Stateless verification: no DB hit on every request
- Session revocation: JWT is stateless by nature, so revocation uses Redis blacklist (sessionId stored in JWT claim, checked on each request)
- Refresh token rotation: short-lived access tokens (15 min) + long-lived refresh tokens (30 days) stored in httpOnly cookies
- MFA: TOTP (RFC 6238) verified before issuing JWT
- SSO: SAML 2.0 / OIDC support in Phase 3 — JWT remains the internal token format

**Consequences**:
- Redis blacklist adds one cache lookup per request: acceptable latency (~1ms)
- Token size: RS256 JWTs are larger than HS256; mitigated by keeping claims minimal
- Key rotation: RS256 key pair rotation requires JWKS endpoint and rolling update

**Review Trigger**: If SSO requirements demand a dedicated identity provider (e.g. Keycloak), JWT remains the downstream token format.

---

## ADR-004: Multi-tenancy Pattern — Shared Database, Row-Level Security

**Status**: Accepted

**Context**:
SSGzone serves thousands of tenants on a single platform. Three multi-tenancy patterns exist: separate databases per tenant, separate schemas per tenant, or shared schema with tenant_id column + RLS.

**Decision**: Shared database, shared schema, `tenant_id` column on every tenant-scoped table, enforced via PostgreSQL Row-Level Security (RLS)

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Separate database per tenant | Operationally infeasible at 10,000+ tenants; connection pool explosion; migration complexity |
| Separate schema per tenant | Schema proliferation; migration complexity; no meaningful security benefit over RLS |
| Application-level filtering only | Relies on developer discipline; one missing WHERE clause leaks data; not auditable |

**Rationale**:
- RLS is enforced at the database engine level — even a buggy query cannot return another tenant's data
- Single schema: one migration applies to all tenants simultaneously
- `SET app.current_tenant_id = ?` at connection level; RLS policy uses `current_setting('app.current_tenant_id')`
- Scales to 50,000+ tenants without operational overhead
- Audit: RLS policies are inspectable and testable independently of application code

**Consequences**:
- All tenant-scoped tables must have `tenant_id UUID NOT NULL` — enforced by code review and migration linting
- RLS adds a small query planning overhead: negligible at our scale
- Super Admin queries (cross-tenant) must use a privileged DB role that bypasses RLS — strictly controlled
- Connection pooling (PgBouncer) must use transaction mode to correctly scope `SET` commands

**Review Trigger**: If a single tenant's data volume exceeds 500GB, evaluate tenant-specific tablespaces or partitioning by tenant_id.

---

## ADR-005: Primary Key Strategy — UUID v4

**Status**: Accepted

**Context**:
All tables need primary keys. The choice between auto-increment integers and UUIDs has implications for security, distributed systems, and API design.

**Decision**: UUID v4 for all primary keys across all tables

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Auto-increment integer | Sequential IDs are enumerable (security risk in APIs); not safe for distributed inserts |
| UUID v1 (time-based) | Leaks MAC address and timestamp; partially predictable |
| UUID v7 (time-ordered) | Better index locality than v4; viable upgrade path in Phase 3 |
| ULID | Lexicographically sortable, URL-safe; good alternative but less universal tooling |
| Snowflake ID | Requires coordination service; overkill for Phase 1 |

**Rationale**:
- Non-enumerable: IDs in API URLs cannot be guessed or iterated
- Safe for client-side generation: clients can generate tempIds before server confirmation (chat messages, draft emails)
- No coordination required: any service can generate a valid PK without a central counter
- PostgreSQL `gen_random_uuid()` is built-in and cryptographically random
- Universal tooling support across all languages and ORMs

**Consequences**:
- Index fragmentation: UUID v4 causes random B-tree inserts; mitigated by `FILLFACTOR` tuning and periodic `VACUUM`
- Larger storage: 16 bytes vs 4 bytes for integer; acceptable trade-off
- UUID v7 migration path: if index performance becomes a concern in Phase 3, migrate high-volume tables (chat_messages, mail_messages) to UUID v7

**Review Trigger**: If write throughput on chat_messages or mail_messages exceeds 10,000 inserts/sec sustained, evaluate UUID v7 for those tables.

---

## ADR-006: Event-driven Architecture — Redis Pub/Sub + BullMQ

**Status**: Accepted

**Context**:
SSGzone has multiple services that need to react to events: mail delivery triggers notifications, provisioning triggers DNS setup, chat messages trigger push notifications. A decision is needed on how services communicate asynchronously.

**Decision**: Redis Pub/Sub for real-time fan-out (WebSocket events) + BullMQ job queues for reliable async processing

**Alternatives Considered**:
| Option | Reason Rejected |
|--------|----------------|
| Apache Kafka | Correct choice at large scale; operational complexity too high for Phase 1 small team |
| AWS EventBridge | Cloud lock-in; local dev complexity; cost at high event volume |
| RabbitMQ | Good for queues; adds a second system when Redis already covers this |
| Direct HTTP calls between services | Tight coupling; no retry; no backpressure |
| PostgreSQL LISTEN/NOTIFY | Limited throughput; not suitable for high-frequency events |

**Rationale**:
- Two-tier approach matches two different needs:
  - **Redis Pub/Sub**: fire-and-forget, low latency, for WebSocket fan-out (presence, chat, notifications)
  - **BullMQ**: durable, retryable, prioritized jobs for mail delivery, provisioning, push notifications
- Both run on the same Redis instance in Phase 1 — no additional infrastructure
- BullMQ provides: job priorities, delayed jobs, rate limiting, concurrency control, dead letter queue
- Redis Streams used as event log for WebSocket replay (missed events on reconnect)
- Migration path to Kafka is clean: BullMQ producers/consumers can be replaced with Kafka producers/consumers without changing business logic

**Consequences**:
- Redis Pub/Sub has no persistence: if a WS server crashes, it misses pub/sub messages. Mitigated by Redis Streams replay
- BullMQ jobs are lost if Redis crashes without persistence: AOF persistence enabled for the queue Redis instance
- All async operations must be idempotent: enforced by design (tempId pattern, idempotency keys)

**Review Trigger**: If BullMQ queue depth exceeds 500,000 jobs sustained or if cross-service event ordering guarantees are required, evaluate Kafka.

---

*Part 01 of 02 — Next: Video Stack, Object Storage, Queue System, Search Engine, Provisioning Strategy & Messaging Infrastructure*
