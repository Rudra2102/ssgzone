# SSGzone Communication Platform
# MASTER DEVELOPMENT PLAN — PART 5 OF 10
## Phase 0 & Phase 1 Roadmap

---

# SECTION 5 — PHASE 0: SECURITY EMERGENCY

---

## Phase Overview

| Field | Value |
|-------|-------|
| Phase Name | Security Emergency |
| Phase Number | 0 |
| Objective | Eliminate all active security vulnerabilities before any other work begins |
| Priority | P0 — Highest |
| Estimated Duration | 1 – 2 Weeks |
| Complexity | Medium (fixes, not new features) |
| Business Value | Prevents data breach, platform compromise, and legal liability |
| Risk Level | CRITICAL — delay increases exposure |
| Prerequisites | None — this is the starting point |
| Blocks | Everything else. No Phase 1 work begins until Phase 0 is complete |

---

## Phase 0 — Modules Covered

- API Gateway (security middleware)
- Mail Server (TLS)
- Chat / WebSocket (authentication)
- Database (connection pool)
- Nginx (domain configuration)
- Environment / Secrets management

---

## Phase 0 — Features & Tasks

### 0.1 Credential Rotation (Day 1 — Immediate)

| Task | Detail |
|------|--------|
| Rotate AWS credentials | The key `AKIAT5ZX2F2NFGUTFQQA` is committed to `.env` — rotate immediately in AWS IAM |
| Remove credentials from codebase | Delete from `.env`, `.env.server.backup`, and any other committed files |
| Audit all committed files | Search entire repository for any other secrets, tokens, or passwords |
| Update `.gitignore` | Ensure `.env` and all secret files are permanently excluded |
| Change DB password | Replace `academy` with a strong random password in all environments |
| Regenerate JWT secret | Replace human-readable string with cryptographically random 256-bit value |

### 0.2 CSRF Protection

| Task | Detail |
|------|--------|
| Enable CSRF middleware | Remove the TODO comment and enable CSRF on all state-changing routes (POST, PUT, PATCH, DELETE) |
| Verify CSRF tokens | Confirm CSRF token is validated on every non-GET request |

### 0.3 WebSocket Authentication

| Task | Detail |
|------|--------|
| Add JWT verification to WebSocket join | Every `socket.on('join')` event must verify the JWT before allowing connection |
| Reject unauthenticated connections | Disconnect any WebSocket client that does not present a valid token |
| Verify tenant isolation in chat | Confirm users can only join rooms belonging to their own tenant |

### 0.4 Database Connection Pool Centralization

| Task | Detail |
|------|--------|
| Identify all `new Pool()` instances | Audit every route file and service file for independent pool creation |
| Route all DB access through DatabaseService | All database calls must use the single centralized `DatabaseService` |
| Remove all individual `new Pool()` calls | Delete from every route file |
| Verify connection count | Confirm PostgreSQL connection count drops to expected level after fix |

### 0.5 Mail Server TLS

| Task | Detail |
|------|--------|
| Enable STARTTLS on SMTP server | Remove the disabled flag and enable STARTTLS |
| Test TLS handshake | Verify TLS works with a test mail client |
| Confirm certificate is valid | Ensure SSL certificate is present and not expired |

### 0.6 JWT Session Security

| Task | Detail |
|------|--------|
| Implement refresh token endpoint | Add `/auth/refresh` endpoint that issues new access token |
| Implement token blacklist | On logout, add token to Redis blacklist with TTL matching token expiry |
| Check blacklist on every request | Auth middleware must check Redis blacklist before accepting any token |
| Implement logout endpoint | `/auth/logout` must blacklist the current token |

### 0.7 Nginx Domain Fix

| Task | Detail |
|------|--------|
| Replace all `ssghub.com` references | Update `config/nginx.conf` and `ssgzone-nginx.conf` to use `ssgzone.in` |
| Verify all service proxy rules | Confirm all upstream service URLs are correct |
| Test routing | Verify all services are reachable through Nginx after update |

---

## Phase 0 — Expected Deliverables

1. AWS credentials rotated and removed from all files
2. CSRF protection active on all state-changing routes
3. WebSocket connections require valid JWT
4. Single centralized DB connection pool in use
5. STARTTLS enabled on mail server
6. JWT refresh + blacklist implemented
7. Nginx config updated to `ssgzone.in`
8. All secrets removed from committed files

---

## Phase 0 — Success Criteria

- No real credentials exist anywhere in the codebase
- CSRF token is required and validated on all POST/PUT/PATCH/DELETE routes
- Unauthenticated WebSocket connections are rejected
- PostgreSQL connection count is within expected limits under load
- All SMTP connections use TLS
- Logout invalidates the session token
- Nginx routes all traffic correctly to `ssgzone.in` services

---

## Phase 0 — Completion Checklist

- [x] AWS key `AKIAT5ZX2F2NFGUTFQQA` rotated in AWS IAM
- [x] `.env` file contains no real credentials
- [x] `.gitignore` excludes all `.env` files
- [x] DB password changed from `academy`
- [x] JWT secret is cryptographically random
- [x] CSRF middleware enabled and tested
- [x] WebSocket join requires valid JWT
- [x] All `new Pool()` calls removed from route files
- [ ] STARTTLS enabled on mail server
- [x] `/auth/refresh` endpoint implemented
- [x] `/auth/logout` blacklists token in Redis
- [x] Auth middleware checks Redis blacklist
- [x] Nginx config references `ssgzone.in` only
- [ ] Full team review confirms no remaining P0 items

---

---

# SECTION 6 — PHASE 1: FOUNDATION & STABILIZATION

---

## Phase Overview

| Field | Value |
|-------|-------|
| Phase Name | Foundation & Stabilization |
| Phase Number | 1 |
| Objective | Build a stable, secure, maintainable foundation that all future modules can be built on top of |
| Priority | P1 — Critical |
| Estimated Duration | 4 – 6 Weeks |
| Complexity | High (structural changes across backend, frontend, and database) |
| Business Value | Makes the platform deployable, maintainable, and trustworthy |
| Risk Level | High — structural changes require careful testing |
| Prerequisites | Phase 0 fully complete |
| Blocks | Phase 2 cannot begin until Phase 1 is complete |

---

## Phase 1 — Modules Covered

- Database (migration framework, RLS, schema cleanup)
- API Gateway (auth hardening, route fixes, cleanup)
- Mail Server (stability, DKIM, DMARC)
- Frontend (Tenant Admin Portal, WebmailDashboard refactor, security fixes)
- SDK (Node.js fix)
- DevOps (CI/CD, Docker cleanup)

---

## Phase 1 — Features & Tasks

### 1.1 Database Migration Framework

| Task | Detail |
|------|--------|
| Select migration tool | Confirm Flyway, Liquibase, or node-pg-migrate |
| Consolidate 53 raw SQL files | Convert all existing migrations into the chosen tool's format |
| Establish migration naming convention | Sequential versioned files with descriptive names |
| Document migration process | How to create, run, and rollback migrations |
| Remove WhatsApp migration files | Deprecate `44_whatsapp.sql` and `48_fix_whatsapp_tenant_id.sql` |

### 1.2 Row-Level Security

| Task | Detail |
|------|--------|
| Identify all tenant-scoped tables | Every table that contains a `tenant_id` column |
| Write RLS policies | `CREATE POLICY` for SELECT, INSERT, UPDATE, DELETE on each table |
| Test RLS with multiple tenants | Verify tenant A cannot see tenant B's data even with a direct query |
| Document RLS policies | Maintain a reference of all policies |

### 1.3 Auth System Hardening

| Task | Detail |
|------|--------|
| Fix SSO token | Replace Base64 encoding with signed JWT |
| Strengthen JWT secret | Confirm cryptographically random secret from Phase 0 is in use |
| Fix DB password | Confirm strong password from Phase 0 is in use |
| Audit all auth flows | Super Admin, SaaS Admin, Tenant Admin, End User — all 4 flows reviewed |
| Fix unified login | Replace sequential 5-endpoint attempt with clean role-based login |

### 1.4 API Gateway Cleanup

| Task | Detail |
|------|--------|
| Fix integration routes | Correct column names: `secret_key` → `api_secret`, `name` → `company_name` |
| Remove WhatsApp routes | Deprecate and remove `whatsapp.js` route |
| Confirm API versioning | All routes under `/api/v1` prefix |
| Confirm input validation | `inputValidation.js` applied to all routes |
| Confirm rate limiting | `rateLimit.js` applied and tuned |
| Fix DDL in branding route | Move `CREATE TABLE IF NOT EXISTS` to migration, remove from GET handler |
| Move scheduled jobs | Jobs must run in dedicated process, not inside API server |

### 1.5 Mail Server Stabilization

| Task | Detail |
|------|--------|
| Stabilize SMTP server | Confirm reliable send/receive after TLS fix from Phase 0 |
| Review custom IMAP | Assess risk of custom IMAP implementation — replace with proven library if needed |
| Automate DKIM per tenant | Each tenant gets its own DKIM key on provisioning |
| Automate DMARC policies | DMARC policy created automatically for each tenant domain |
| Verify SPF records | Confirm SPF is correctly configured for all tenant subdomains |

### 1.6 Frontend Stabilization

| Task | Detail |
|------|--------|
| Complete Tenant Admin Portal | User management, department management, communication settings, 2FA |
| Refactor WebmailDashboard | Break 1500-line monolith into focused components (Mail, Chat, Calendar, Contacts, Video, Drive) |
| Apply DOMPurify | Sanitize all HTML content before rendering |
| Move JWT to httpOnly cookie | Remove from localStorage |
| Replace hardcoded API URL | Use environment variable throughout |
| Fix Super Admin branding route | Remove DDL from GET handler |

### 1.7 Node.js SDK Fix

| Task | Detail |
|------|--------|
| Audit all SDK endpoint calls | Map every SDK method to the actual API route |
| Fix all broken endpoints | Update `/api/v1/tenant/provision` and `/api/v1/user/create` to correct paths |
| Add `node-fetch` to package.json | Or replace with `axios` which is already a common dependency |
| Write SDK usage documentation | Basic README with examples for all core operations |

### 1.8 DevOps Foundation

| Task | Detail |
|------|--------|
| Set up CI/CD pipeline | Automated build and test on every commit |
| Clean Docker Compose | Remove hardcoded passwords, add health checks, add resource limits |
| Environment variable strategy | Document which variables are required for dev, staging, and production |
| Confirm backup automation | Verify `scripts/backup.sh` works and schedule it |

---

## Phase 1 — Expected Deliverables

1. All 53 SQL migrations consolidated into migration framework
2. RLS policies active on all tenant-scoped tables
3. SSO token is signed JWT — not forgeable
4. Integration routes working with correct column names
5. WhatsApp code fully removed from codebase
6. Tenant Admin Portal fully functional
7. WebmailDashboard refactored into components
8. Node.js SDK calls correct endpoints
9. CI/CD pipeline running on every commit
10. Docker Compose cleaned up for all environments

---

## Phase 1 — Success Criteria

- A new migration can be created, applied, and rolled back using the migration tool
- Tenant A cannot access Tenant B's data — verified by direct DB query test
- SSO token cannot be forged by Base64 decoding and re-encoding
- SaaS integration routes return correct data
- No WhatsApp-related code, routes, or tables remain in the codebase
- Tenant Admin can log in, manage users, departments, and settings
- WebmailDashboard has no component exceeding 300 lines
- Node.js SDK all methods return expected responses
- CI/CD pipeline passes on a clean commit
- Docker Compose starts all services without hardcoded credentials

---

## Phase 1 — Completion Checklist

- [ ] Migration framework selected and documented
- [ ] All 53 SQL files converted to migration framework format
- [ ] RLS policies written and tested for all tenant tables
- [ ] SSO token uses signed JWT
- [ ] Integration routes fixed and tested
- [ ] WhatsApp routes removed
- [ ] WhatsApp DB tables deprecated
- [ ] DDL removed from branding GET route
- [ ] Scheduled jobs moved out of API server process
- [ ] Tenant Admin Portal complete
- [ ] WebmailDashboard refactored
- [ ] DOMPurify applied to all HTML rendering
- [ ] JWT stored in httpOnly cookie
- [ ] API URL driven by environment variable
- [ ] Node.js SDK fixed and documented
- [ ] CI/CD pipeline active
- [ ] Docker Compose cleaned
- [ ] DKIM automated per tenant
- [ ] DMARC automated per tenant
- [ ] Phase 1 review sign-off by engineering lead

---

*End of Part 5 of 10*
*Next: MASTER_PLAN_PART_06.md — Phase 2 & Phase 3 Roadmap*
