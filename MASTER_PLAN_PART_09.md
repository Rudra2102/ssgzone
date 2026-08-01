# SSGzone Communication Platform
# MASTER DEVELOPMENT PLAN — PART 9 OF 10
## Master Feature Tracker

---

# SECTION 13 — MASTER FEATURE TRACKER

---

## Status Legend

| Status | Meaning |
|--------|---------|
| Complete | Feature is fully built and working |
| Partial | Feature exists but is incomplete or has issues |
| Broken | Feature exists but does not work correctly |
| Missing | Feature does not exist anywhere in the codebase |
| Deprecated | Feature is being removed from the platform |
| Deferred | Feature is intentionally postponed to a future phase |
| Future | Feature is on the long-term roadmap but not yet planned |

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Emergency — fix immediately |
| P1 | Critical — required for any deployment |
| P2 | High — required for commercial launch |
| P3 | Medium — enterprise feature |
| P4 | Future — long-term roadmap |

---

---

## 13.1 Security Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| AWS credential rotation | CRITICAL BREACH | Phase 0 | P0 | Key `AKIAT5ZX2F2NFGUTFQQA` must be rotated immediately |
| Secrets out of codebase | Broken | Phase 0 | P0 | Real secrets in `.env` committed to repo |
| CSRF protection | Broken | Phase 0 | P0 | Explicitly disabled with TODO comment |
| WebSocket JWT authentication | Missing | Phase 0 | P0 | Any user can join any chat room |
| Centralized DB connection pool | Broken | Phase 0 | P0 | New Pool() per route — connection exhaustion |
| STARTTLS on SMTP | Broken | Phase 0 | P0 | All mail traffic unencrypted |
| JWT refresh tokens | Missing | Phase 0 | P0 | No session invalidation on logout |
| Token blacklist on logout | Missing | Phase 0 | P0 | Stolen tokens valid forever |
| Nginx domain fix | Broken | Phase 0 | P0 | References `ssghub.com` — wrong domain |
| Signed SSO token | Broken | Phase 1 | P1 | Base64 — forgeable by anyone |
| Row-Level Security (RLS) | Missing | Phase 1 | P1 | Tenant isolation is app-layer only |
| DDL removed from GET route | Broken | Phase 1 | P1 | `CREATE TABLE IF NOT EXISTS` on every branding GET |
| XSS protection (DOMPurify) | Missing | Phase 1 | P1 | `dangerouslySetInnerHTML` without sanitization |
| JWT secret strength | Broken | Phase 1 | P1 | Human-readable string — not cryptographically random |
| DB password strength | Broken | Phase 1 | P1 | `academy` — trivially guessable |
| JWT stored in httpOnly cookie | Broken | Phase 1 | P1 | Currently in localStorage — XSS accessible |
| External security audit | Missing | Phase 6 | P2 | Required before commercial launch |
| OWASP Top 10 compliance | Partial | Phase 6 | P2 | Several items still open |

---

## 13.2 Authentication & Authorization Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Super Admin login | Complete | — | P1 | Working |
| SaaS Admin login | Complete | — | P1 | Working |
| Tenant Admin login | Complete | — | P1 | Working |
| End User login | Complete | — | P1 | Working |
| Unified login flow | Broken | Phase 1 | P1 | Tries 5 endpoints sequentially — poor UX |
| JWT access tokens | Complete | — | P1 | Working |
| JWT refresh tokens | Missing | Phase 0 | P0 | Not implemented |
| Token blacklist | Missing | Phase 0 | P0 | Not implemented |
| Cascading permissions | Complete | — | P1 | SaaS→Tenant→User — working with Redis cache |
| 2FA (TOTP) | Partial | Phase 1 | P1 | Tables exist, implementation needs review |
| OAuth2 | Partial | Phase 2 | P2 | Basic implementation — needs production hardening |
| SAML 2.0 | Missing | Phase 4 | P3 | Enterprise SSO requirement |
| Role-based access control | Partial | Phase 1 | P1 | Exists but needs audit |

---

## 13.3 Mail System Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| SMTP send | Complete | — | P1 | Working |
| SMTP receive | Complete | — | P1 | Working |
| IMAP server | Partial | Phase 1 | P1 | Custom implementation — risky, needs review |
| POP3 | Missing | Phase 3 | P3 | Lower priority than IMAP |
| STARTTLS | Broken | Phase 0 | P0 | Disabled — must enable |
| DKIM per tenant | Partial | Phase 1 | P1 | Service exists — automation incomplete |
| DMARC per tenant | Partial | Phase 1 | P1 | Service exists — automation incomplete |
| SPF verification | Partial | Phase 1 | P1 | Needs verification |
| Email folders | Complete | — | P1 | Working |
| Email search | Partial | Phase 3 | P2 | PostgreSQL ILIKE — needs Elasticsearch |
| Email rules | Partial | Phase 2 | P2 | Tables exist — implementation needs completion |
| Email aliases | Partial | Phase 2 | P2 | Tables exist — implementation needs completion |
| Autoresponder | Partial | Phase 2 | P2 | Tables exist — implementation needs completion |
| Email templates | Partial | Phase 2 | P2 | Tables exist — implementation needs completion |
| Spam filtering | Partial | Phase 2 | P2 | ClamAV exists — needs tuning |
| IP warmup | Partial | Phase 2 | P2 | Service exists — automation incomplete |
| Email scheduling | Partial | Phase 2 | P2 | Scheduler exists — needs review |
| Email signatures | Complete | — | P2 | Working |
| Email attachments | Partial | Phase 1 | P1 | Exists — needs security review |
| Email export (MBOX) | Partial | Phase 4 | P3 | Migration service exists |
| Email import (MBOX) | Partial | Phase 4 | P3 | Migration service exists |
| DMARC reporting | Partial | Phase 2 | P2 | Tables and service exist |

---

## 13.4 Calendar Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Basic event CRUD | Partial | Phase 1 | P1 | Works but disconnected from main auth |
| CalDAV protocol | Partial | Phase 2 | P2 | Service exists — not connected to main auth |
| Recurring events | Missing | Phase 2 | P2 | Not implemented |
| Event invitations | Missing | Phase 2 | P2 | Not implemented |
| Shared calendars | Missing | Phase 2 | P2 | Not implemented |
| External client sync | Missing | Phase 2 | P2 | Requires CalDAV compliance |
| Calendar UI | Partial | Phase 1 | P1 | Basic UI in WebmailDashboard |
| Timezone support | Unknown | Phase 2 | P2 | Needs verification |

---

## 13.5 Contacts Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Basic contact CRUD | Partial | Phase 1 | P1 | Works but needs auth review |
| CardDAV protocol | Partial | Phase 2 | P2 | Service exists — not connected to main auth |
| Contact groups | Missing | Phase 2 | P2 | Not implemented |
| CSV import | Missing | Phase 2 | P2 | Not implemented |
| vCard import | Missing | Phase 2 | P2 | Not implemented |
| CSV export | Missing | Phase 2 | P2 | Not implemented |
| vCard export | Missing | Phase 2 | P2 | Not implemented |
| Org directory | Missing | Phase 3 | P3 | Separate directory module needed |
| External client sync | Missing | Phase 2 | P2 | Requires CardDAV compliance |
| Contacts UI | Partial | Phase 1 | P1 | Basic UI in WebmailDashboard |

---

## 13.6 Internal Chat Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Text messaging | Complete | — | P1 | Working |
| Message reactions | Complete | — | P1 | Working |
| Read receipts | Complete | — | P1 | Working |
| Typing indicators | Complete | — | P1 | Working |
| Message pinning | Complete | — | P1 | Working |
| WebSocket authentication | Missing | Phase 0 | P0 | CRITICAL — no auth on join |
| Presence (scalable) | Broken | Phase 1 | P1 | In-memory Map — not scalable |
| Channel management | Partial | Phase 2 | P2 | Basic channels exist |
| Direct messages | Partial | Phase 2 | P2 | Needs review |
| File sharing in chat | Missing | Phase 2 | P2 | Not implemented |
| Chat search | Missing | Phase 3 | P2 | Requires Elasticsearch integration |
| Thread replies | Missing | Phase 2 | P2 | Not implemented |
| Mentions (@user) | Missing | Phase 2 | P2 | Not implemented |
| Chat notifications | Missing | Phase 2 | P2 | Not implemented |

---

## 13.7 Video Meeting Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Room creation (DB record) | Complete | — | P2 | DB record only — no real video |
| Actual video server | Missing | Phase 2 | P2 | Jitsi public iframe — not self-hosted |
| Self-hosted video | Missing | Phase 2 | P2 | Must replace Jitsi iframe |
| Screen sharing | Missing | Phase 2 | P2 | Depends on video server choice |
| Meeting recording | Missing | Phase 3 | P3 | Deferred to Phase 3 |
| Meeting chat | Missing | Phase 2 | P2 | In-meeting chat |
| Participant management | Missing | Phase 2 | P2 | Mute, remove participant |
| Meeting scheduling | Missing | Phase 2 | P2 | Schedule via calendar |
| Video UI | Broken | Phase 2 | P2 | Currently Jitsi iframe |
| Remove Jitsi iframe | Broken | Phase 2 | P2 | Must be removed |

---

## 13.8 Shared Drive Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| File upload | Missing | Phase 2 | P2 | Entire module missing |
| File download | Missing | Phase 2 | P2 | Entire module missing |
| Folder management | Missing | Phase 2 | P2 | Entire module missing |
| File sharing | Missing | Phase 2 | P2 | Entire module missing |
| File versioning | Missing | Phase 2 | P2 | Entire module missing |
| Permission model | Missing | Phase 2 | P2 | Entire module missing |
| File preview | Missing | Phase 2 | P2 | Entire module missing |
| Storage quota | Missing | Phase 2 | P2 | Entire module missing |
| Drive UI | Missing | Phase 2 | P2 | Entire module missing |
| Drive-to-Chat integration | Missing | Phase 2 | P2 | Share files from Drive into chat |
| Drive-to-Mail integration | Missing | Phase 2 | P2 | Attach Drive files to email |

---

## 13.9 Notifications Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Notification DB tables | Complete | — | P2 | Tables exist |
| In-app notification center | Missing | Phase 2 | P2 | No UI or delivery mechanism |
| Email digest | Missing | Phase 2 | P2 | Not implemented |
| Push notifications (web) | Missing | Phase 2 | P2 | Not implemented |
| Notification preferences | Missing | Phase 2 | P2 | Not implemented |
| Notification UI | Missing | Phase 2 | P2 | Not implemented |

---

## 13.10 Admin Portal Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Super Admin — SaaS management | Complete | — | P1 | Working |
| Super Admin — tenant management | Complete | — | P1 | Working |
| Super Admin — user management | Complete | — | P1 | Working |
| Super Admin — branding | Broken | Phase 1 | P1 | DDL on every GET request |
| Super Admin — audit logs | Partial | Phase 4 | P3 | Tables exist — WORM storage needed |
| Super Admin — system health | Missing | Phase 4 | P3 | Not implemented |
| SaaS Admin — tenant management | Complete | — | P1 | Working |
| SaaS Admin — analytics | Partial | Phase 4 | P3 | Basic — needs enhancement |
| SaaS Admin — billing | Missing | Phase 4 | P3 | Not implemented |
| SaaS Admin — developer hub | Partial | Phase 4 | P3 | Tables exist — portal not built |
| Tenant Admin — user management | Partial | Phase 1 | P1 | Skeleton only |
| Tenant Admin — departments | Partial | Phase 1 | P1 | Tables exist — UI skeleton |
| Tenant Admin — settings | Partial | Phase 1 | P1 | Skeleton only |
| Tenant Admin — 2FA management | Partial | Phase 1 | P1 | Tables exist |

---

## 13.11 Integration & Platform Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Node.js SDK | Broken | Phase 1 | P1 | Calls non-existent endpoints |
| Python SDK | Partial | Phase 2 | P2 | Skeleton only |
| Integration routes | Broken | Phase 1 | P1 | Wrong column names |
| Webhooks | Partial | Phase 2 | P2 | Service exists — reliability not confirmed |
| Webhook signatures | Missing | Phase 2 | P2 | No HMAC signature |
| Webhook retry | Missing | Phase 2 | P2 | No retry logic |
| OAuth2 | Partial | Phase 2 | P2 | Basic — needs production hardening |
| SAML 2.0 | Missing | Phase 4 | P3 | Not implemented |
| White-label branding | Partial | Phase 2 | P2 | Upload works — custom domain missing |
| Custom domain support | Missing | Phase 2 | P2 | Not implemented |
| Developer Portal | Partial | Phase 4 | P3 | Tables exist — portal not built |
| API versioning | Partial | Phase 1 | P1 | `/api/v1` prefix exists — needs enforcement |
| OpenAPI / Swagger | Partial | Phase 2 | P2 | `openapi.yaml` exists — may not match routes |

---

## 13.12 Infrastructure Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| Docker Compose (dev) | Partial | Phase 1 | P1 | Hardcoded passwords, no health checks |
| Docker Compose (prod) | Partial | Phase 1 | P1 | Incomplete |
| Kubernetes manifests | Missing | Phase 3 | P2 | Not implemented |
| CI/CD pipeline | Missing | Phase 1 | P1 | Not implemented |
| Prometheus monitoring | Missing | Phase 3 | P2 | Not implemented |
| Grafana dashboards | Missing | Phase 3 | P2 | Not implemented |
| Alerting rules | Missing | Phase 3 | P2 | Not implemented |
| Log aggregation | Missing | Phase 3 | P2 | Not implemented |
| Automated backups | Partial | Phase 1 | P1 | Script exists — not automated |
| Horizontal scaling | Missing | Phase 3 | P2 | Requires K8s |
| Health checks | Missing | Phase 1 | P1 | Not in Docker Compose |

---

## 13.13 Compliance & Enterprise Features

| Feature | Current Status | Target Phase | Priority | Remarks |
|---------|---------------|--------------|----------|---------|
| GDPR data export | Partial | Phase 4 | P3 | Tables exist — export not implemented |
| GDPR data deletion | Partial | Phase 4 | P3 | Deletion queue exists — needs completion |
| Audit logs (WORM) | Partial | Phase 4 | P3 | Tables exist — WORM storage not implemented |
| Retention policies | Partial | Phase 4 | P3 | Tables exist — enforcement not implemented |
| Legal hold | Missing | Phase 4 | P3 | Not implemented |
| Billing system | Partial | Phase 4 | P3 | Tables exist — no plan enforcement |
| Support tickets | Partial | Phase 4 | P3 | Tables exist — portal not built |
| SLA monitoring | Missing | Phase 6 | P3 | Not implemented |
| Status page | Missing | Phase 6 | P3 | Not implemented |

---

## 13.14 Deprecated / Removed Features

| Feature | Current Status | Action | Phase |
|---------|---------------|--------|-------|
| WhatsApp integration | Partial — routes and tables exist | Remove all code, routes, and tables | Phase 1 |
| `ssghub.com` domain references | Present in Nginx config | Replace with `ssgzone.in` | Phase 0 |
| Jitsi public iframe | Active | Remove and replace with self-hosted video | Phase 2 |
| `server-backup.js` | Exists in api-gateway | Review and remove if redundant | Phase 1 |
| Multiple patch scripts (root level) | `patch_*.js`, `patch_*.ps1` | Review and remove after Phase 1 cleanup | Phase 1 |

---

*End of Part 9 of 10*
*Next: MASTER_PLAN_PART_10.md — Risk Register, Milestones, Out of Scope, Final Verdict*
