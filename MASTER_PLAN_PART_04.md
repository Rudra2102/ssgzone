# SSGzone Communication Platform
# MASTER DEVELOPMENT PLAN — PART 4 OF 10
## Dependency Analysis

---

# SECTION 4 — DEPENDENCY ANALYSIS

---

## 4.1 Principle

Before any module is assigned to a sprint, its dependencies must be confirmed complete.
This section defines which modules block others, which can run in parallel, and what the critical path to commercial launch looks like.

---

## 4.2 Hard Blocking Dependencies

A hard dependency means: Module B **cannot start** until Module A is **fully complete**.

| Module (B) — Cannot Start | Depends On (A) — Must Complete First |
|---------------------------|--------------------------------------|
| Any new feature development | Phase 0 security fixes complete |
| Chat (secure operation) | WebSocket JWT auth fix |
| Mail (production use) | STARTTLS enabled + DB pool centralized |
| Any route development | CSRF protection enabled |
| RLS implementation | DB migration framework in place |
| Calendar (connected) | Auth hardening complete + RLS in place |
| Contacts (full) | Auth hardening complete + RLS in place |
| Shared Drive | Auth hardening + storage service stable + RLS in place |
| Video (self-hosted) | Technology decision finalized + infrastructure ready |
| Presence (scalable) | Redis centralized + chat WebSocket secured |
| Notifications (push) | All core modules stable + presence working |
| Unified Search | All modules stable + Elasticsearch integrated |
| Billing | All core modules functional and stable |
| Developer Portal | SDK fixed + API versioned + billing exists |
| K8s Deployment | All services containerized and individually stable |
| Monitoring | Stable deployment environment exists |
| Commercial Launch | All P0 and P1 items complete + billing working |
| Messaging Infrastructure | Platform commercially stable (Phase 6 complete) |
| Mobile Apps | Web platform stable + API fully documented |
| WhatsApp Connector | Messaging Infrastructure built (Phase 5 complete) |

---

## 4.3 Parallel Development Opportunities

Once Phase 0 is complete, the following tracks can run simultaneously without blocking each other.

---

### After Phase 0 — Three Parallel Tracks

**Track A — Backend Hardening**
- DB Migration Framework adoption
- Row-Level Security implementation
- Auth system: refresh tokens + blacklist
- SSO token: Base64 → signed JWT
- Integration routes: fix broken column names
- WhatsApp code deprecation and removal

**Track B — Frontend Stabilization**
- Nginx domain fix (`ssghub.com` → `ssgzone.in`)
- Tenant Admin Portal completion
- WebmailDashboard refactoring (break 1500-line monolith)
- XSS fix (DOMPurify)
- JWT storage: localStorage → httpOnly cookie
- Hardcoded API URL → environment variable

**Track C — DevOps Foundation**
- CI/CD pipeline setup
- Docker Compose cleanup (remove hardcoded passwords)
- Environment variable management strategy
- Node.js SDK endpoint alignment

---

### After Phase 1 — Four Parallel Tracks

**Track D — Mail System Completion**
- DKIM automation per tenant
- DMARC policy automation
- Email aliases, rules, autoresponder
- Spam filtering tuning
- IP warmup automation

**Track E — Communication Modules**
- Calendar: CalDAV connected to main auth + full features
- Contacts: CardDAV + import/export + groups
- Chat: Redis presence + scalability

**Track F — New Module Development**
- Shared Drive: build from scratch (schema → API → UI)
- Self-hosted Video Server: evaluate + integrate + UI
- Notifications system: in-app + email digest + push

**Track G — Integration & Platform**
- Python SDK completion
- Webhooks reliability
- OAuth2 production-grade
- White-label custom domain support

---

### After Phase 2 — Two Parallel Tracks

**Track H — Infrastructure**
- Kubernetes manifests for all services
- Prometheus + Grafana monitoring
- Log aggregation (ELK or Loki)
- Alerting rules

**Track I — Enterprise Features**
- Unified Search (Elasticsearch integration)
- Directory module
- SAML 2.0 support
- Billing system + payment gateway
- Developer Portal

---

## 4.4 Modules That Must NEVER Start Before Another

This is a strict sequencing rule. Violating these will cause rework.

| Module | Must NEVER Start Before |
|--------|------------------------|
| Shared Drive | Phase 1 complete (auth hardened, RLS in place, storage stable) |
| Self-hosted Video | Phase 1 complete + technology decision documented |
| Billing | Phase 2 complete (all core modules functional) |
| Developer Portal | Phase 3 complete (SDK fixed, API versioned, billing exists) |
| Messaging Infrastructure | Phase 6 complete (platform commercially stable) |
| Mobile Apps | Phase 6 complete (web platform stable, API documented) |
| AI Features | Phase 6 complete (all core modules complete) |
| WhatsApp Connector | Phase 5 complete (messaging infrastructure built) |
| SAML 2.0 | Phase 2 complete (OAuth2 working first) |
| Kubernetes | Phase 2 complete (all services individually stable) |

---

## 4.5 Critical Path to Commercial Launch

The critical path is the minimum sequence of work that must complete before the platform can be sold to customers.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  PHASE 0 — Security Emergency                                    │
│  ├── Rotate AWS credentials                                      │
│  ├── Enable CSRF                                                 │
│  ├── Fix WebSocket auth                                          │
│  ├── Centralize DB pool                                          │
│  ├── Enable STARTTLS                                             │
│  ├── Add JWT refresh + blacklist                                 │
│  └── Fix Nginx domain                                            │
│                          │                                       │
│                          ▼                                       │
│  PHASE 1 — Foundation & Stabilization                            │
│  ├── DB migration framework                                      │
│  ├── Row-Level Security                                          │
│  ├── Auth hardening (SSO token, JWT secret)                      │
│  ├── Fix integration routes + SDK                                │
│  ├── Complete Tenant Admin Portal                                │
│  ├── Refactor WebmailDashboard                                   │
│  └── Mail server stability (DKIM, DMARC, IMAP)                   │
│                          │                                       │
│                          ▼                                       │
│  PHASE 2 — Core Communication Completion                         │
│  ├── Calendar (connected + full features)                        │
│  ├── Contacts (CardDAV + import/export)                          │
│  ├── Chat (Redis presence + scalable)                            │
│  ├── Shared Drive (built from scratch)                           │
│  ├── Video (self-hosted server)                                  │
│  └── Notifications (in-app + digest + push)                      │
│                          │                                       │
│                          ▼                                       │
│  PHASE 3 — Infrastructure & Observability                        │
│  ├── Kubernetes deployment                                       │
│  ├── Monitoring + alerting                                       │
│  ├── CI/CD pipeline                                              │
│  └── Log aggregation                                             │
│                          │                                       │
│                          ▼                                       │
│  PHASE 4 — Enterprise Features                                   │
│  ├── Billing + plan enforcement                                  │
│  ├── Developer Portal                                            │
│  ├── Unified Search                                              │
│  └── Directory module                                            │
│                          │                                       │
│                          ▼                                       │
│  PHASE 6 — Commercial Readiness                                  │
│  ├── Security audit (external)                                   │
│  ├── Performance testing                                         │
│  ├── Documentation complete                                      │
│  └── Support system ready                                        │
│                          │                                       │
│                          ▼                                       │
│  PHASE 7 — Market Launch                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Phase 5 (Messaging Infrastructure) is NOT on the critical path.**
It runs as a separate long-term initiative in parallel with Phase 6 and Phase 7.

---

## 4.6 Technology Decisions Required Before Phase 1

These decisions must be made and documented by the engineering leadership before Phase 1 engineering begins. They are not implementation tasks — they are planning decisions.

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Database Migration Tool | Flyway, Liquibase, node-pg-migrate | Decide and commit before Phase 1 |
| Self-hosted Video Server | Janus Gateway, mediasoup, LiveKit | Evaluate and decide in Phase 1 planning |
| Container Orchestration | Kubernetes, Docker Swarm | Kubernetes recommended for scale |
| Monitoring Stack | Prometheus + Grafana, Datadog, New Relic | Prometheus + Grafana (self-hosted) |
| Log Aggregation | ELK Stack, Grafana Loki | Decide based on infrastructure choice |
| CI/CD Platform | GitHub Actions, GitLab CI, Jenkins | Decide based on source control platform |
| Secrets Management | HashiCorp Vault, AWS Secrets Manager, Doppler | Decide before Phase 1 |
| Message Queue | Bull (Redis), RabbitMQ | Bull exists — confirm or migrate |
| Search Engine | Elasticsearch (already installed) | Confirm Elasticsearch |
| Object Storage | MinIO (already installed) | Confirm MinIO for self-hosted |

---

*End of Part 4 of 10*
*Next: MASTER_PLAN_PART_05.md — Phase 0 & Phase 1 Roadmap*
