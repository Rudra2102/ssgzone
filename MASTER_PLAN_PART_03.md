# SSGzone Communication Platform
# MASTER DEVELOPMENT PLAN — PART 3 OF 10
## Module Status Registry

---

# SECTION 3 — MODULE STATUS REGISTRY

---

## Priority Legend

| Priority | Label | Meaning |
|----------|-------|---------|
| P0 | Emergency | Active security breach or platform-breaking issue — fix immediately |
| P1 | Critical | Required for any production deployment — must complete in Phase 1 |
| P2 | High | Required for commercial launch — must complete by Phase 3 |
| P3 | Medium | Important enterprise feature — complete by Phase 4 |
| P4 | Low / Future | Long-term roadmap item — Phase 5 and beyond |

---

## Phase Legend

| Phase | Name |
|-------|------|
| Phase 0 | Security Emergency |
| Phase 1 | Foundation & Stabilization |
| Phase 2 | Core Communication Completion |
| Phase 3 | Infrastructure & Observability |
| Phase 4 | Enterprise Features |
| Phase 5 | Messaging Infrastructure |
| Phase 6 | Commercial Readiness |
| Phase 7 | Market Launch Preparation |

---

---

## 3.1 Security Modules

| Module | Current Status | Target Status | Priority | Phase | Reason |
|--------|---------------|---------------|----------|-------|--------|
| Rotate AWS Credentials | ACTIVE BREACH — real key in `.env` | Credentials rotated, removed from codebase | P0 | Phase 0 | Active security breach — must act before anything else |
| Secrets Management | Plaintext `.env` with real secrets | Secrets in environment variables only, never in code | P0 | Phase 0 | Fundamental security hygiene |
| CSRF Protection | Explicitly disabled | Enabled on all state-changing routes | P0 | Phase 0 | Basic web security requirement |
| WebSocket JWT Auth | No auth on chat join | JWT verified on every WebSocket connection | P0 | Phase 0 | Any user can join any chat room |
| DB Connection Pool | New `Pool()` per route file | Single centralized pool via DatabaseService | P0 | Phase 0 | Will exhaust PostgreSQL connections under any load |
| STARTTLS on Mail Server | Disabled | TLS required for all SMTP connections | P0 | Phase 0 | All mail traffic is currently unencrypted |
| JWT Refresh Tokens | Missing | Refresh + access token pair implemented | P0 | Phase 0 | No way to invalidate sessions on logout |
| Token Blacklist | Missing | Redis-backed blacklist checked on every request | P0 | Phase 0 | Stolen tokens remain valid forever |
| Nginx Domain Config | References `ssghub.com` | Updated to `ssgzone.in` throughout | P0 | Phase 0 | Platform will not route correctly to any service |
| Base64 SSO Token | Forgeable — no signature | Signed JWT-based SSO token | P1 | Phase 1 | Any user can forge an SSO token |
| Row-Level Security | Missing | PostgreSQL RLS on all tenant tables | P1 | Phase 1 | Missing `tenant_id` filter exposes all tenant data |
| DDL on GET Request | `CREATE TABLE IF NOT EXISTS` on every branding GET | DDL moved to migration, removed from route | P1 | Phase 1 | Schema changes must never run in request handlers |
| dangerouslySetInnerHTML | Used without sanitization | Sanitized with DOMPurify before render | P1 | Phase 1 | XSS vulnerability in webmail |
| JWT Secret Strength | Human-readable string | Cryptographically random 256-bit secret | P1 | Phase 1 | Weak secret makes JWT forgeable |
| DB Password Strength | `academy` — trivially guessable | Strong random password in all environments | P1 | Phase 1 | Trivial to brute-force |

---

## 3.2 Database & Schema Modules

| Module | Current Status | Target Status | Priority | Phase | Reason |
|--------|---------------|---------------|----------|-------|--------|
| DB Migration Framework | 53 raw SQL files, no tool | Flyway or Liquibase managing all migrations | P1 | Phase 1 | No safe way to evolve schema across environments |
| Primary Key Consistency | Mixed SERIAL and UUID | Consistent UUID across all tables | P1 | Phase 1 | Mixed PKs require `::text` casts that prevent index usage |
| Row-Level Security Policies | Missing | RLS policies on all tenant-scoped tables | P1 | Phase 1 | Tenant isolation depends entirely on application code |
| Schema Cleanup | 53 migrations including destructive ones | Clean, versioned, documented schema | P1 | Phase 1 | Migration 16 drops and recreates core tables |
| WhatsApp Tables | `44_whatsapp.sql`, `48_fix_whatsapp_tenant_id.sql` | Deprecated and removed | P1 | Phase 1 | WhatsApp removed from roadmap |
| Index Optimization | Basic indexes only | Indexes on all foreign keys and query patterns | P2 | Phase 2 | Required for performance at scale |
| Audit Log Schema | Exists | Reviewed and confirmed complete | P2 | Phase 2 | Required for enterprise compliance |
| Shared Drive Schema | Missing | New tables for files, folders, permissions, versions | P2 | Phase 2 | Entire module needs schema design |
| Video Server Schema | Room records only | Schema aligned with chosen video server | P2 | Phase 2 | Depends on video server technology decision |

---

## 3.3 API Gateway Modules

| Module | Current Status | Target Status | Priority | Phase | Reason |
|--------|---------------|---------------|----------|-------|--------|
| Centralized DB Pool | New Pool() per route | Single pool in DatabaseService, imported everywhere | P0 | Phase 0 | Critical resource leak |
| CSRF Middleware | Disabled | Enabled | P0 | Phase 0 | Security requirement |
| Auth Middleware | Single secret, no blacklist | Refresh tokens, blacklist, strong secret | P0 | Phase 0 | Session security |
| Integration Routes | Broken — wrong column names | Fixed and tested | P1 | Phase 1 | SaaS customers cannot integrate |
| WhatsApp Routes | `whatsapp.js` route exists | Deprecated and removed | P1 | Phase 1 | Removed from roadmap |
| API Versioning | `/api/v1` prefix exists | Confirmed and enforced across all routes | P1 | Phase 1 | Required for SDK and integration stability |
| Input Validation | `inputValidation.js` exists | Confirmed applied to all routes | P1 | Phase 1 | Prevents injection attacks |
| Rate Limiting | `rateLimit.js` exists | Confirmed applied and tuned | P1 | Phase 1 | Prevents abuse |
| Error Handling | `errorHandler.js` exists | Confirmed consistent across all routes | P1 | Phase 1 | Inconsistent errors leak internal details |
| OpenAPI / Swagger | `openapi.yaml` exists | Aligned with actual routes, kept up to date | P2 | Phase 2 | Required for developer portal and SDK |
| Scheduled Jobs | Started on server listen | Moved to dedicated job runner | P2 | Phase 2 | Jobs should not run inside API process |

---

## 3.4 Mail System Modules

| Module | Current Status | Target Status | Priority | Phase | Reason |
|--------|---------------|---------------|----------|-------|--------|
| STARTTLS | Disabled | Enabled — TLS required | P0 | Phase 0 | All SMTP traffic is unencrypted |
| SMTP Server | Functional | Stable, TLS-enabled, production-ready | P1 | Phase 1 | Core product feature |
| IMAP Server | Custom implementation — risky | Stable, tested, or replaced with proven library | P1 | Phase 1 | Custom IMAP is high-risk |
| Mail DB Pool | New pool per auth request | Uses centralized pool | P0 | Phase 0 | Performance issue |
| DKIM | Service exists | Automated per-tenant DKIM key management | P1 | Phase 1 | Required for mail deliverability |
| DMARC | Service and tables exist | Automated DMARC policy management | P1 | Phase 1 | Required for mail deliverability |
| SPF | Assumed configured | Verified and documented | P1 | Phase 1 | Required for mail deliverability |
| Spam Filtering | Basic | Tuned spam filtering with ClamAV | P2 | Phase 2 | Required for production mail |
| Email Aliases | Tables exist (`50_email_aliases.sql`) | Functional alias management | P2 | Phase 2 | Common enterprise requirement |
| Email Rules | Tables exist (`42_email_rules.sql`) | Functional server-side rules | P2 | Phase 2 | Common enterprise requirement |
| Autoresponder | Tables exist (`41_autoresponder.sql`) | Functional autoresponder | P2 | Phase 2 | Common enterprise requirement |
| Email Templates | Tables exist (`37_email_templates.sql`) | Functional template management | P2 | Phase 2 | Required for system emails |
| IP Warmup | Service exists | Automated IP warmup schedule | P2 | Phase 2 | Required for new IP deliverability |
| POP3 | Not confirmed | Evaluate need — implement if required | P3 | Phase 3 | Lower priority than IMAP |

---

## 3.5 Frontend Modules

| Module | Current Status | Target Status | Priority | Phase | Reason |
|--------|---------------|---------------|----------|-------|--------|
| Nginx Domain Fix | References `ssghub.com` | Updated to `ssgzone.in` | P0 | Phase 0 | Platform will not route |
| WebmailDashboard Refactor | 1500+ line monolith, 60+ state variables | Broken into focused components | P1 | Phase 1 | Unmaintainable, untestable |
| Tenant Admin Portal | Skeleton only | Complete user/dept/settings management | P1 | Phase 1 | Required for tenant operations |
| XSS Fix | dangerouslySetInnerHTML without sanitization | DOMPurify sanitization applied | P1 | Phase 1 | Security vulnerability |
| Hardcoded API URL | `https://api.ssgzone.in` hardcoded | Environment variable driven | P1 | Phase 1 | Cannot deploy to different environments |
| JWT Storage | Stored in localStorage | Moved to httpOnly cookie | P1 | Phase 1 | localStorage is XSS-accessible |
| Super Admin Portal | Partially functional | Complete and stable | P1 | Phase 1 | Required for platform operations |
| SaaS Admin Portal | Partially functional | Complete with billing and analytics | P1 | Phase 1 | Required for SaaS customers |
| Unified Login | Tries 5 endpoints sequentially | Clean role-based login flow | P1 | Phase 1 | Poor UX and security |
| White-label Theming | Branding upload works | Complete white-label with custom domain support | P2 | Phase 2 | Core business differentiator |
| Shared Drive UI | Does not exist | Full file manager interface | P2 | Phase 2 | Entire module missing |
| Video Meeting UI | Jitsi iframe | Self-hosted video UI | P2 | Phase 2 | Must be self-hosted |
| Notifications UI | Missing | In-app notification center | P2 | Phase 2 | Required for user engagement |
| Mobile Responsive Design | Unknown | Confirmed responsive across all portals | P3 | Phase 4 | Enterprise users use mobile |

---

## 3.6 Communication Modules

| Module | Current Status | Target Status | Priority | Phase | Reason |
|--------|---------------|---------------|----------|-------|--------|
| Internal Chat — Security | No WebSocket auth | JWT verified on join | P0 | Phase 0 | Critical security gap |
| Internal Chat — Presence | In-memory Map | Redis-backed presence | P1 | Phase 1 | In-memory does not scale beyond one server |
| Internal Chat — Features | Messages, reactions, read receipts, typing, pinning | All features confirmed working securely | P1 | Phase 1 | Features exist but are insecure |
| Calendar — Auth Connection | Disconnected from main auth | Connected to main JWT auth | P1 | Phase 1 | CalDAV service runs independently |
| Calendar — Features | Basic CRUD | Events, invites, recurring, shared calendars, CalDAV | P2 | Phase 2 | Full calendar feature set |
| Contacts — Features | Basic CRUD | CardDAV, import/export, groups, directory | P2 | Phase 2 | Full contacts feature set |
| Video Meetings | Jitsi public iframe | Self-hosted video server (Janus or mediasoup) | P2 | Phase 2 | Not self-hosted, not private |
| Shared Drive | Does not exist | Full file manager — build from scratch | P2 | Phase 2 | Entire module missing |
| Presence System | In-memory, chat only | Redis-backed, cross-module presence | P2 | Phase 2 | Required for directory and chat |
| Notifications | Tables only | In-app + email digest + push | P2 | Phase 2 | Required for user engagement |
| Directory | No module | Org-wide user directory with profiles | P3 | Phase 3 | Enterprise feature |
| Unified Search | Service exists, not integrated | Cross-module search via Elasticsearch | P3 | Phase 3 | Important but not blocking launch |

---

## 3.7 Integration & Platform Modules

| Module | Current Status | Target Status | Priority | Phase | Reason |
|--------|---------------|---------------|----------|-------|--------|
| Node.js SDK | Broken — wrong endpoints | Fixed, tested, published | P1 | Phase 1 | Developers cannot integrate |
| Python SDK | Skeleton | Functional with all core operations | P2 | Phase 2 | Developer experience |
| Integration Routes | Broken — wrong column names | Fixed and tested | P1 | Phase 1 | SaaS integration is broken |
| SSO Token | Base64 — forgeable | Signed JWT | P1 | Phase 1 | Security vulnerability |
| Webhooks | Service exists | Reliable delivery with retry and logging | P2 | Phase 2 | Required for SaaS integration |
| OAuth2 | Basic implementation | Production-grade OAuth2 | P2 | Phase 2 | Enterprise SSO requirement |
| SAML Support | Missing | SAML 2.0 for enterprise SSO | P3 | Phase 4 | Large enterprise requirement |
| Billing | Tables exist | Plan enforcement + payment gateway | P3 | Phase 4 | Required before commercial launch |
| Developer Portal | Tables exist | Self-service portal with API docs and keys | P3 | Phase 4 | Required for ecosystem growth |
| Messaging Infrastructure | Not started | Proprietary SMS/RCS/channel infrastructure | P4 | Phase 5 | Long-term vision |

---

*End of Part 3 of 10*
*Next: MASTER_PLAN_PART_04.md — Dependency Analysis*
