# SSGzone Communication Platform
# MASTER DEVELOPMENT PLAN — PART 6 OF 10
## Phase 2 & Phase 3 Roadmap

---

# SECTION 7 — PHASE 2: CORE COMMUNICATION COMPLETION

---

## Phase Overview

| Field | Value |
|-------|-------|
| Phase Name | Core Communication Completion |
| Phase Number | 2 |
| Objective | Complete every core communication module so the platform delivers its full value proposition |
| Priority | P2 — High |
| Estimated Duration | 8 – 12 Weeks |
| Complexity | Very High (new modules + existing module completion) |
| Business Value | Transforms the platform from a mail tool into a complete communication suite |
| Risk Level | High — Shared Drive and Video are built from scratch |
| Prerequisites | Phase 1 fully complete |
| Blocks | Phase 3 infrastructure work and Phase 4 enterprise features |

---

## Phase 2 — Modules Covered

- Calendar (full features + CalDAV connected)
- Contacts (full features + CardDAV)
- Internal Chat (scalable presence + Redis)
- Video Meetings (self-hosted server)
- Shared Drive (built from scratch)
- Notifications (in-app + email digest + push)
- Presence System (Redis-backed, cross-module)
- Mail System (aliases, rules, autoresponder, spam)
- Python SDK
- Webhooks
- OAuth2
- White-label / Custom Domain

---

## Phase 2 — Features & Tasks

### 2.1 Calendar — Full Implementation

| Task | Detail |
|------|--------|
| Connect CalDAV service to main auth | Calendar service must validate the same JWT as the API gateway |
| Event creation and editing | Full CRUD with timezone support |
| Recurring events | Daily, weekly, monthly, yearly recurrence rules |
| Event invitations | Invite other users, accept/decline flow |
| Shared calendars | Share calendar with team or department |
| CalDAV protocol compliance | Standard CalDAV so external clients (Thunderbird, Apple Calendar) can connect |
| Calendar UI completion | Full calendar view in webmail dashboard |

### 2.2 Contacts — Full Implementation

| Task | Detail |
|------|--------|
| Connect CardDAV service to main auth | Contacts service must validate the same JWT |
| Contact groups | Organize contacts into groups |
| Import contacts | CSV and vCard import |
| Export contacts | CSV and vCard export |
| CardDAV protocol compliance | Standard CardDAV so external clients can sync |
| Org directory integration | Contacts module shows org-wide directory |
| Contacts UI completion | Full contacts view in webmail dashboard |

### 2.3 Internal Chat — Scalability

| Task | Detail |
|------|--------|
| Replace in-memory presence Map | Move presence tracking to Redis |
| Multi-server presence | Presence must work correctly when API gateway runs on multiple instances |
| Channel management | Create, archive, delete channels |
| Direct messages | One-to-one private messaging |
| File sharing in chat | Send files through chat (stored in MinIO) |
| Search within chat | Search message history |
| Chat notification integration | New message triggers notification |

### 2.4 Video Meetings — Self-Hosted

| Task | Detail |
|------|--------|
| Technology decision | Confirm Janus Gateway or mediasoup or LiveKit — document the decision |
| Server deployment | Deploy chosen video server as a Docker container |
| Room creation API | API to create, list, and delete video rooms — connected to real video server |
| Meeting join flow | User clicks join → connects to self-hosted video server |
| Screen sharing | Screen share support |
| Recording (optional Phase 3) | Recording can be deferred to Phase 3 |
| Video UI | Replace Jitsi iframe with self-hosted video UI |
| Remove Jitsi iframe | Delete all references to `meet.jit.si` |

### 2.5 Shared Drive — Build From Scratch

This is the largest new module. It has no existing implementation.

| Task | Detail |
|------|--------|
| Schema design | Tables for files, folders, permissions, versions, shares |
| File upload API | Upload files to MinIO with tenant isolation |
| Folder management API | Create, rename, move, delete folders |
| File versioning | Keep previous versions of files |
| File sharing | Share file or folder with specific users or groups |
| Permission model | Owner, Editor, Viewer permissions per file/folder |
| File preview | Preview common file types (PDF, images, documents) |
| File download | Secure download with access check |
| Storage quota | Per-tenant and per-user storage limits |
| Shared Drive UI | Full file manager interface in webmail dashboard |
| Integration with Chat | Share files from Drive into chat |
| Integration with Mail | Attach files from Drive to email |

### 2.6 Notifications System

| Task | Detail |
|------|--------|
| In-app notification center | Bell icon with unread count, notification list |
| Notification types | New mail, new chat message, calendar invite, file shared, mention |
| Email digest | Daily or weekly summary email of activity |
| Push notifications | Web push (browser) notifications |
| Notification preferences | User can configure which notifications they receive |
| Notification UI | Notification panel in webmail dashboard |

### 2.7 Presence System

| Task | Detail |
|------|--------|
| Redis-backed presence | Store online/offline/busy status in Redis |
| Presence across modules | Status visible in chat, directory, contacts |
| Status options | Online, Away, Busy, Do Not Disturb, Offline |
| Custom status message | User can set a custom status message |
| Automatic away | Set to Away after configurable idle time |
| Presence API | API endpoint for other modules to query presence |

### 2.8 Mail System Completion

| Task | Detail |
|------|--------|
| Email aliases | Users can have multiple email aliases |
| Server-side rules | Filter, forward, label rules applied on delivery |
| Autoresponder | Out-of-office and custom autoresponder |
| Spam filtering tuning | ClamAV + spam scoring tuned for production |
| IP warmup automation | Automated warmup schedule for new sending IPs |
| Email templates | System email templates (welcome, password reset, etc.) |

### 2.9 Python SDK

| Task | Detail |
|------|--------|
| Implement all core operations | Tenant provisioning, user creation, mail operations |
| Align with actual API endpoints | Same endpoint audit as Node.js SDK |
| Publish to PyPI | Make installable via `pip install ssgzone` |
| Write documentation | README with examples |

### 2.10 Webhooks Reliability

| Task | Detail |
|------|--------|
| Retry logic | Failed webhook delivery retried with exponential backoff |
| Delivery log | Every webhook attempt logged with status |
| Webhook signature | HMAC signature on every webhook payload |
| Webhook management UI | SaaS Admin can view delivery logs and retry failed webhooks |

### 2.11 OAuth2 Production-Grade

| Task | Detail |
|------|--------|
| Authorization code flow | Standard OAuth2 authorization code flow |
| Token endpoint | `/oauth/token` endpoint |
| Scope management | Define and enforce OAuth scopes |
| Client management | SaaS Admin can register OAuth clients |

### 2.12 White-label & Custom Domain

| Task | Detail |
|------|--------|
| Custom domain support | Tenant can use their own domain (e.g., `mail.company.com`) |
| DNS automation | Automatically create DNS records for custom domain |
| Branding per tenant | Logo, colors, custom name applied throughout UI |
| White-label email | System emails sent from tenant's own domain |

---

## Phase 2 — Expected Deliverables

1. Calendar fully functional with CalDAV, recurring events, invites, sharing
2. Contacts fully functional with CardDAV, import/export, groups
3. Chat running on Redis presence — scalable across multiple servers
4. Self-hosted video server deployed and integrated — Jitsi iframe removed
5. Shared Drive fully functional — upload, share, version, quota
6. Notifications working — in-app, email digest, push
7. Presence system working across all modules
8. Mail aliases, rules, autoresponder, spam filtering complete
9. Python SDK functional and published
10. Webhooks reliable with retry and signature
11. OAuth2 production-grade
12. White-label with custom domain support

---

## Phase 2 — Success Criteria

- A user can create a calendar event and invite another user who can accept or decline
- A user can sync contacts with an external CardDAV client
- Chat presence shows correct status when user is on multiple browser tabs
- A video meeting can be created and joined without any reference to `jit.si`
- A user can upload a file to Shared Drive, share it with a colleague, and the colleague can download it
- A user receives an in-app notification when they receive a new email
- A SaaS Admin can configure a custom domain and the platform routes correctly
- Webhook delivery is retried automatically on failure

---

## Phase 2 — Completion Checklist

- [ ] CalDAV connected to main auth
- [ ] Calendar recurring events working
- [ ] Calendar invite flow working
- [ ] CardDAV connected to main auth
- [ ] Contacts import/export working
- [ ] Chat presence moved to Redis
- [ ] Video server technology decision documented
- [ ] Self-hosted video server deployed
- [ ] Jitsi iframe removed from all code
- [ ] Shared Drive schema designed and migrated
- [ ] Shared Drive upload/download/share working
- [ ] Shared Drive UI complete
- [ ] Notifications in-app working
- [ ] Notifications push working
- [ ] Email digest working
- [ ] Presence system Redis-backed
- [ ] Mail aliases working
- [ ] Mail rules working
- [ ] Autoresponder working
- [ ] Python SDK functional
- [ ] Webhooks have retry + signature
- [ ] OAuth2 authorization code flow working
- [ ] Custom domain support working
- [ ] Phase 2 review sign-off by engineering lead

---

---

# SECTION 8 — PHASE 3: INFRASTRUCTURE & OBSERVABILITY

---

## Phase Overview

| Field | Value |
|-------|-------|
| Phase Name | Infrastructure & Observability |
| Phase Number | 3 |
| Objective | Make the platform production-deployable, observable, and operationally reliable |
| Priority | P2 — High |
| Estimated Duration | 4 – 6 Weeks |
| Complexity | High (infrastructure work requires DevOps expertise) |
| Business Value | Without this phase, the platform cannot be operated in production |
| Risk Level | Medium — infrastructure changes are well-understood |
| Prerequisites | Phase 2 fully complete (all services stable before containerizing) |
| Blocks | Phase 4 enterprise features require stable infrastructure |

---

## Phase 3 — Modules Covered

- Kubernetes deployment
- Monitoring & alerting (Prometheus + Grafana)
- Log aggregation
- CI/CD pipeline completion
- Unified Search (Elasticsearch integration)
- Directory module
- Video recording (deferred from Phase 2)
- POP3 (if required)

---

## Phase 3 — Features & Tasks

### 3.1 Kubernetes Deployment

| Task | Detail |
|------|--------|
| Write K8s manifests for all services | API Gateway, Mail Server, Calendar Service, DNS Manager, IP Warmup, Video Server |
| Write K8s manifests for all frontends | Unified Login, Super Admin Portal, SaaS Admin Portal, Tenant Admin Portal |
| Write K8s manifests for infrastructure | PostgreSQL, Redis, MinIO, Elasticsearch |
| ConfigMaps and Secrets | All environment variables managed via K8s ConfigMaps and Secrets |
| Ingress configuration | Nginx Ingress for all services |
| Horizontal Pod Autoscaler | Auto-scale API Gateway and Mail Server based on load |
| Persistent Volume Claims | For PostgreSQL, MinIO, and Elasticsearch data |
| Health checks | Liveness and readiness probes for all services |
| Resource limits | CPU and memory limits for all pods |

### 3.2 Monitoring & Alerting

| Task | Detail |
|------|--------|
| Deploy Prometheus | Metrics collection from all services |
| Deploy Grafana | Dashboards for all key metrics |
| Instrument API Gateway | Request rate, error rate, latency, DB pool usage |
| Instrument Mail Server | Send rate, delivery rate, queue depth, bounce rate |
| Instrument Chat | WebSocket connections, message rate |
| Instrument Video Server | Active rooms, participant count, bandwidth |
| Alerting rules | Alert on: high error rate, DB pool exhaustion, mail queue backup, disk usage |
| On-call notification | Alerts delivered to Slack, PagerDuty, or email |

### 3.3 Log Aggregation

| Task | Detail |
|------|--------|
| Deploy log aggregation stack | ELK (Elasticsearch + Logstash + Kibana) or Grafana Loki |
| Structured logging | All services emit JSON-structured logs |
| Log retention policy | Define how long logs are kept |
| Audit log integration | Security audit logs searchable in log system |
| Error tracking | Errors surfaced and searchable |

### 3.4 CI/CD Pipeline Completion

| Task | Detail |
|------|--------|
| Automated testing stage | Run all tests on every commit (once tests exist from Phase 4) |
| Build stage | Build Docker images for all services |
| Push to registry | Push images to container registry |
| Deploy to staging | Automatic deploy to staging environment |
| Deploy to production | Manual approval gate before production deploy |
| Rollback capability | One-command rollback to previous version |

### 3.5 Unified Search

| Task | Detail |
|------|--------|
| Elasticsearch integration | Connect existing Elasticsearch service to all modules |
| Mail search | Index all emails for full-text search |
| Chat search | Index all chat messages |
| Contacts search | Index contacts |
| File search | Index file names and metadata from Shared Drive |
| Unified search API | Single `/search` endpoint that queries all modules |
| Search UI | Search bar in webmail dashboard that searches across all modules |

### 3.6 Directory Module

| Task | Detail |
|------|--------|
| User directory API | List all users in an organization with profiles |
| Profile pages | Each user has a profile with name, role, department, contact info, presence status |
| Department directory | Browse users by department |
| Directory search | Search users by name, email, department |
| Directory UI | Directory view in webmail dashboard |

---

## Phase 3 — Expected Deliverables

1. All services running on Kubernetes with health checks and resource limits
2. Prometheus + Grafana dashboards showing all key metrics
3. Alerting rules configured and tested
4. Centralized log aggregation with search
5. CI/CD pipeline with staging and production deploy stages
6. Unified search working across mail, chat, contacts, and files
7. Directory module with user profiles and department browsing

---

## Phase 3 — Success Criteria

- All services start successfully on a fresh Kubernetes cluster
- Grafana dashboard shows real-time request rate, error rate, and latency
- An alert fires when the API Gateway error rate exceeds 5%
- A log search finds a specific error message from any service
- A CI/CD pipeline run completes successfully from commit to staging deploy
- A search query returns results from mail, chat, and contacts simultaneously
- A user can browse the org directory and see presence status

---

## Phase 3 — Completion Checklist

- [ ] K8s manifests written for all backend services
- [ ] K8s manifests written for all frontend applications
- [ ] K8s manifests written for all infrastructure components
- [ ] All secrets managed via K8s Secrets
- [ ] Horizontal Pod Autoscaler configured
- [ ] Prometheus deployed and collecting metrics
- [ ] Grafana dashboards created for all services
- [ ] Alerting rules configured
- [ ] Log aggregation stack deployed
- [ ] All services emit structured JSON logs
- [ ] CI/CD pipeline has build, test, staging, and production stages
- [ ] Rollback procedure documented and tested
- [ ] Elasticsearch integrated with mail, chat, contacts, files
- [ ] Unified search API working
- [ ] Directory module API and UI complete
- [ ] Phase 3 review sign-off by engineering lead

---

*End of Part 6 of 10*
*Next: MASTER_PLAN_PART_07.md — Phase 4 & Phase 5 Roadmap*
