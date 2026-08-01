# Master Documentation Index (MDI)
# SSGzone Communication Platform

| Field | Value |
|-------|-------|
| Document # | 48 |
| Version | 1.1 |
| Status | ACTIVE |
| Owner | Platform Architect |
| Category | Meta |
| Total Documents Indexed | 47 (+ this document = 48) |
| Total Parts | 36 planning parts + 10 master plan parts |
| Created | Month 1 of project timeline |
| Last Updated | Month 1 — added D11 ADR, updated video and messaging terminology |
| Next Review | End of Phase 1 (Month 6), then quarterly |

---

## 1. Purpose & Usage Guide

This Master Documentation Index (MDI) is the single entry point for all SSGzone platform documentation. Before reading any other document, read this file.

### How to Use This Index

- **New developer**: Read Section 2 (Architecture Overview), then follow the "Start Here" path in Section 4
- **New architect**: Read Section 2, then Section 3 (Document Dependency Map), then the relevant domain documents
- **Product manager**: Read Section 5 (Document Registry) filtered by Category = "Product"
- **DevOps / Infra**: Jump to Section 5, filter by Category = "Infrastructure" or "Operations"
- **Auditor / Compliance**: Read Section 5, filter by Category = "Compliance" or "Security"

### Document Status Legend

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Current, authoritative, in use |
| `DRAFT` | Work in progress, not yet authoritative |
| `SUPERSEDED` | Replaced by a newer document |
| `ARCHIVED` | Historical reference only |
| `PENDING` | Planned but not yet written |

### Version Convention

`MAJOR.MINOR` — Major changes increment MAJOR. Clarifications/additions increment MINOR.

---

## 2. Platform Architecture Overview

### 2.1 What is SSGzone?

SSGzone is an API-first, multi-tenant communication platform built for Indian B2B SaaS companies. It allows SaaS products to embed professional email, chat, calendar, video, contacts, and drive capabilities under their own branded subdomains — without building or operating communication infrastructure themselves.

### 2.2 Email Address Structure

```
username@tenant_slug.saas_slug.ssgzone.in

Example: amit.shah@nabc.lms.ssgzone.in
         │         │    │   └── root domain
         │         │    └────── SaaS platform slug
         │         └─────────── tenant slug
         └───────────────────── user email prefix
```

### 2.3 Entity Hierarchy

```
SSGzone (Super Admin)
  └── SaaS Platform  (e.g. Rupyo, LMS)
        └── Tenant   (e.g. NABC, ABC Developers)
              └── User (e.g. amit.shah@nabc.lms.ssgzone.in)
```

### 2.4 Core Modules

| Module | Description | Phase |
|--------|-------------|-------|
| Mail | SMTP/IMAP/POP3 email with webmail | 1 |
| Calendar | Event scheduling, invites, reminders | 1 |
| Contacts | Address book, directory | 1 |
| Chat | Real-time messaging, channels, DMs | 1 |
| Video | Self-hosted meetings via WebRTC SFU (technology TBD: e.g. LiveKit, mediasoup, Janus) | 2 |
| Drive | File storage and sharing | 2 |
| Notifications | Cross-module push/email/in-app alerts | 1 |
| Search | Unified search across all modules | 1 |
| Auth | JWT, MFA, SSO, session management | 1 |
| Admin Portal | Super Admin, SaaS Admin, Tenant Admin | 1 |
| Billing | Razorpay subscriptions, invoices, overages | 1 |
| AI | Smart compose, summarization, scheduling | 3 |
| Messaging Infrastructure | Programmable messaging platform — SMS, WhatsApp, RCS are future channel connectors | 5 |

### 2.5 Technology Stack

| Layer | Technology |
|-------|------------|
| API Server | Node.js (Express/Fastify) |
| WebSocket | Socket.io / native WS + Redis adapter |
| Database | PostgreSQL (RLS, UUID v4, 47 tables) |
| Cache / Queue | Redis + BullMQ |
| Mail Server | Postfix (SMTP) + Dovecot (IMAP/POP3) |
| Spam Filter | Rspamd + ClamAV |
| Video | Self-hosted WebRTC SFU (technology TBD: e.g. LiveKit, mediasoup, Janus) |
| Object Storage | S3-compatible |
| Search | PostgreSQL FTS + Elasticsearch |
| Frontend | React.js |
| Billing | Razorpay |
| DNS | Cloudflare API (primary) |

### 2.6 Deployment Phases

| Phase | Name | Timeline | Key Deliverable |
|-------|------|----------|-----------------|
| 0 | Foundation | Months 1–2 | Infra, CI/CD, DB, Auth skeleton |
| 1 | Core Mail | Months 3–6 | Mail, Calendar, Contacts, Chat, Notifications |
| 2 | Full Suite | Months 7–10 | Video (self-hosted WebRTC SFU — TBD), Drive, Search, Admin portals |
| 3 | AI & Enterprise | Months 11–18 | AI features, eDiscovery, SOC 2, GDPR tools |
| 4 | Scale | Months 19–24 | Multi-region, self-hosted option, Series A |
| 5 | Messaging | Months 25–30 | Messaging Infrastructure Platform + channel connectors (SMS, WhatsApp, RCS) |
| 6 | International | Months 31–36 | SEA/Middle East expansion |

---

## 3. Document Dependency Map

This map shows which documents must be read/understood before another document makes full sense. Arrows mean "depends on".

### 3.1 Foundation Layer (read first, no dependencies)

```
[01] Enterprise Audit          ← starting point, no dependencies
[02-11] Master Plan Parts      ← depends on Audit
```

### 3.2 Product Layer

```
[01] Audit
  └──► [02-11] Master Plan
              └──► [12-17] PRD (D1)          ← what to build
                        └──► [18-22] Dashboard Spec (D2)   ← how screens look
                        └──► [32-34] UI/UX Design System (D5) ← how components work
```

### 3.3 Data Layer

```
[12-17] PRD
  └──► [23-26] Database Blueprint (D3)       ← schema for all PRD features
              └──► [27-31] API Blueprint (D4) ← endpoints over the schema
```

### 3.4 Infrastructure Layer

```
[23-26] Database (D3)
[27-31] API (D4)
  └──► [35-36] Communication Engine (D6)     ← mail + WS + video + push
  └──► [37-38] Provisioning Engine (D7)      ← tenant/user lifecycle + billing
  └──► [39-41] Messaging Infrastructure (D8) ← chat protocol + compliance
```

### 3.5 Advanced Layer

```
[35-41] Infra documents
  └──► [42-43] AI Roadmap (D9)               ← AI on top of stable infra

[02-11] Master Plan + [12-17] PRD
  └──► [44-45] Commercial Roadmap (D10)      ← business model over product

[All DB + API + Infra documents]
  └──► [46-47] ADR (D11)                     ← records why each technology was chosen
```

### 3.6 Cross-Document Dependency Table

| Document | Hard Dependencies | Soft Dependencies |
|----------|------------------|------------------|
| PRD (D1) | Audit, Master Plan | — |
| Dashboard (D2) | PRD (D1) | UI/UX (D5) |
| Database (D3) | PRD (D1) | API (D4) |
| API (D4) | PRD (D1), Database (D3) | — |
| UI/UX (D5) | Dashboard (D2) | PRD (D1) |
| Comm Engine (D6) | Database (D3), API (D4) | — |
| Provisioning (D7) | Database (D3), API (D4) | Comm Engine (D6) |
| Messaging (D8) | Database (D3), API (D4) | Comm Engine (D6) |
| AI Roadmap (D9) | PRD (D1), API (D4) | Messaging (D8) |
| Commercial (D10) | Master Plan, PRD (D1) | All documents |
| ADR (D11) | All infra + DB + API documents | All documents |
| MDI (this) | All 47 documents | — |

---

## 4. Reading Paths by Role

### 4.1 New Backend Developer

```
Step 1: MDI Section 2 (Platform Overview)          — 10 min
Step 2: Master Plan Part 01 (Phase 0 & 1)          — 30 min
Step 3: Database Part 01 (Architecture & Standards) — 45 min
Step 4: Database Part 02 or 03 (your module)        — 30 min
Step 5: API Part 01 (Standards & conventions)       — 30 min
Step 6: API Part for your module                    — 30 min
Step 7: Comm Engine Part 01 (if working on mail/WS) — 45 min
Step 8: Provisioning Part 01 (if working on tenants)— 45 min
Step 9: ADR Part 01 (technology decisions for your stack) — 30 min

Total: ~4.5 hours to be productive
```

### 4.2 New Frontend Developer

```
Step 1: MDI Section 2 (Platform Overview)           — 10 min
Step 2: UI/UX Part 01 (Tokens & Foundations)        — 30 min
Step 3: UI/UX Part 02 (Component Library)           — 45 min
Step 4: UI/UX Part 03 (Screen Flows)                — 45 min
Step 5: Dashboard Part for your role (01–05)        — 30 min
Step 6: API Part 01 (Standards — for API calls)     — 20 min
Step 7: API Part for your module                    — 30 min

Total: ~3.5 hours to be productive
```

### 4.3 New Product Manager

```
Step 1: MDI (full document)                         — 30 min
Step 2: Master Plan Parts 01–04 (all phases)        — 2 hours
Step 3: PRD Parts 01–06 (all modules)               — 3 hours
Step 4: Dashboard Parts 01–05 (all dashboards)      — 2 hours
Step 5: Commercial Part 01 (GTM & pricing)          — 30 min
Step 6: AI Roadmap Part 01 (feature overview)       — 30 min

Total: ~8.5 hours for full product context
```

### 4.4 New DevOps / Infrastructure Engineer

```
Step 1: MDI Section 2 (Platform Overview)           — 10 min
Step 2: Master Plan Part 01 (Phase 0 infra setup)   — 30 min
Step 3: Comm Engine Part 01 (mail + WS architecture)— 45 min
Step 4: Comm Engine Part 02 (video + push + scaling)— 45 min
Step 5: Provisioning Part 01 (tenant lifecycle)     — 45 min
Step 6: Database Part 01 (DB architecture)          — 30 min
Step 7: Messaging Part 03 (deployment map)          — 20 min
Step 8: ADR Part 01 & 02 (why each technology)      — 30 min

Total: ~4 hours to understand infra topology
```

### 4.5 Security Auditor / Compliance Officer

```
Step 1: MDI Section 2 (Platform Overview)           — 10 min
Step 2: PRD Part 06 (Auth & Multi-Tenancy)          — 45 min
Step 3: Database Part 01 (RLS policies)             — 30 min
Step 4: API Part 01 (Auth standards, error codes)   — 30 min
Step 5: Comm Engine Part 01 (mail security)         — 30 min
Step 6: Comm Engine Part 02 (WS + video security)   — 30 min
Step 7: Messaging Part 02 (GDPR, audit, eDiscovery) — 45 min
Step 8: Provisioning Part 01 (suspension/offboarding)— 30 min

Total: ~4.5 hours for security/compliance review
```

### 4.6 Investor / Business Stakeholder

```
Step 1: MDI Section 2 (Platform Overview)           — 10 min
Step 2: Commercial Part 01 (market, pricing, GTM)   — 30 min
Step 3: Commercial Part 02 (financials, milestones) — 30 min
Step 4: AI Roadmap Part 02 (AI timeline & costs)    — 20 min
Step 5: Master Plan Part 01 (Phase 0 & 1 scope)     — 20 min

Total: ~1.5 hours for business context
```

---

## 5. Document Registry

### 5.1 Audit & Strategy Documents

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 01 | Enterprise Architecture Audit | *(delivered in chat)* | 1.0 | ACTIVE | Platform Architect | Audit |
| 02 | Master Plan Part 01 — Phase 0 & 1 | `MASTER_PLAN_PART_01.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 03 | Master Plan Part 02 — Phase 2 & 3 | `MASTER_PLAN_PART_02.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 04 | Master Plan Part 03 — Phase 4 & 5 | `MASTER_PLAN_PART_03.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 05 | Master Plan Part 04 — Phase 6 & 7 | `MASTER_PLAN_PART_04.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 06 | Master Plan Part 05 — Dependency Analysis | `MASTER_PLAN_PART_05.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 07 | Master Plan Part 06 — Feature Tracker | `MASTER_PLAN_PART_06.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 08 | Master Plan Part 07 — Risk Register | `MASTER_PLAN_PART_07.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 09 | Master Plan Part 08 — Milestones | `MASTER_PLAN_PART_08.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 10 | Master Plan Part 09 — Team & Hiring | `MASTER_PLAN_PART_09.md` | 1.0 | ACTIVE | Platform Architect | Strategy |
| 11 | Master Plan Part 10 — Summary | `MASTER_PLAN_PART_10.md` | 1.0 | ACTIVE | Platform Architect | Strategy |

### 5.2 Product Requirements Documents (D1)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 12 | PRD Part 01 — Mail | `docs/planning/PRD_PART_01.md` | 1.0 | ACTIVE | Product | Product |
| 13 | PRD Part 02 — Calendar & Contacts | `docs/planning/PRD_PART_02.md` | 1.0 | ACTIVE | Product | Product |
| 14 | PRD Part 03 — Chat & Presence | `docs/planning/PRD_PART_03.md` | 1.0 | ACTIVE | Product | Product |
| 15 | PRD Part 04 — Video & Drive | `docs/planning/PRD_PART_04.md` | 1.0 | ACTIVE | Product | Product |
| 16 | PRD Part 05 — Notifications, Search & Directory | `docs/planning/PRD_PART_05.md` | 1.0 | ACTIVE | Product | Product |
| 17 | PRD Part 06 — Auth, Multi-Tenancy & SaaS Integration | `docs/planning/PRD_PART_06.md` | 1.0 | ACTIVE | Product | Product |

### 5.3 Dashboard Specifications (D2)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 18 | Dashboard Part 01 — Super Admin | `docs/planning/DASHBOARD_PART_01.md` | 1.0 | ACTIVE | Product | UI/UX |
| 19 | Dashboard Part 02 — SaaS Admin | `docs/planning/DASHBOARD_PART_02.md` | 1.0 | ACTIVE | Product | UI/UX |
| 20 | Dashboard Part 03 — Tenant Admin | `docs/planning/DASHBOARD_PART_03.md` | 1.0 | ACTIVE | Product | UI/UX |
| 21 | Dashboard Part 04 — End User | `docs/planning/DASHBOARD_PART_04.md` | 1.0 | ACTIVE | Product | UI/UX |
| 22 | Dashboard Part 05 — Webmail Client | `docs/planning/DASHBOARD_PART_05.md` | 1.0 | ACTIVE | Product | UI/UX |

### 5.4 Database Blueprint (D3)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 23 | Database Part 01 — Architecture & Auth Tables | `docs/planning/DATABASE_PART_01.md` | 1.0 | ACTIVE | Backend | Database |
| 24 | Database Part 02 — Mail, Calendar, Contacts | `docs/planning/DATABASE_PART_02.md` | 1.0 | ACTIVE | Backend | Database |
| 25 | Database Part 03 — Chat, Video, Drive, Notifications | `docs/planning/DATABASE_PART_03.md` | 1.0 | ACTIVE | Backend | Database |
| 26 | Database Part 04 — Billing, Audit, Indexes, Partitions | `docs/planning/DATABASE_PART_04.md` | 1.0 | ACTIVE | Backend | Database |

### 5.5 API Blueprint (D4)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 27 | API Part 01 — Standards & Auth API | `docs/planning/API_PART_01.md` | 1.0 | ACTIVE | Backend | API |
| 28 | API Part 02 — SaaS Admin & Tenant Admin API | `docs/planning/API_PART_02.md` | 1.0 | ACTIVE | Backend | API |
| 29 | API Part 03 — Mail, Calendar, Contacts API | `docs/planning/API_PART_03.md` | 1.0 | ACTIVE | Backend | API |
| 30 | API Part 04 — Chat, Video, Drive API | `docs/planning/API_PART_04.md` | 1.0 | ACTIVE | Backend | API |
| 31 | API Part 05 — Notifications, Search, Integration API | `docs/planning/API_PART_05.md` | 1.0 | ACTIVE | Backend | API |

### 5.6 UI/UX Design System (D5)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 32 | UI/UX Part 01 — Foundations & Tokens | `docs/planning/D5_UIUX_PART_01.md` | 1.0 | ACTIVE | Frontend | UI/UX |
| 33 | UI/UX Part 02 — Component Library | `docs/planning/D5_UIUX_PART_02.md` | 1.0 | ACTIVE | Frontend | UI/UX |
| 34 | UI/UX Part 03 — Screen Flows & Interactions | `docs/planning/D5_UIUX_PART_03.md` | 1.0 | ACTIVE | Frontend | UI/UX |

### 5.7 Communication Engine (D6)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 35 | Comm Engine Part 01 — Mail & Real-time Infra | `docs/planning/D6_COMM_ENGINE_PART_01.md` | 1.0 | ACTIVE | Backend | Infrastructure |
| 36 | Comm Engine Part 02 — Video, Push & Delivery | `docs/planning/D6_COMM_ENGINE_PART_02.md` | 1.0 | ACTIVE | Backend | Infrastructure |

### 5.8 SaaS Provisioning Engine (D7)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 37 | Provisioning Part 01 — Onboarding & Lifecycle | `docs/planning/D7_PROVISIONING_PART_01.md` | 1.0 | ACTIVE | Backend | Infrastructure |
| 38 | Provisioning Part 02 — Billing, Plans & API Ref | `docs/planning/D7_PROVISIONING_PART_02.md` | 1.0 | ACTIVE | Backend | Infrastructure |

### 5.9 Messaging Infrastructure (D8)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 39 | Messaging Part 01 — Chat Architecture & Protocol | `docs/planning/D8_MESSAGING_PART_01.md` | 1.0 | ACTIVE | Backend | Infrastructure |
| 40 | Messaging Part 02 — Search, Moderation & Compliance | `docs/planning/D8_MESSAGING_PART_02.md` | 1.0 | ACTIVE | Backend | Compliance |
| 41 | Messaging Part 03 — Future Infra & Integrations | `docs/planning/D8_MESSAGING_PART_03.md` | 1.0 | ACTIVE | Backend | Infrastructure |

### 5.10 AI Roadmap (D9)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 42 | AI Roadmap Part 01 — Foundations, Mail & Chat AI | `docs/planning/D9_AI_ROADMAP_PART_01.md` | 1.0 | ACTIVE | AI/ML | Product |
| 43 | AI Roadmap Part 02 — Calendar, Drive, Admin AI & Governance | `docs/planning/D9_AI_ROADMAP_PART_02.md` | 1.0 | ACTIVE | AI/ML | Product |

### 5.11 Commercial Roadmap (D10)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 44 | Commercial Part 01 — Market Strategy & GTM | `docs/planning/D10_COMMERCIAL_PART_01.md` | 1.0 | ACTIVE | Business | Commercial |
| 45 | Commercial Part 02 — Financials, Milestones & Investment | `docs/planning/D10_COMMERCIAL_PART_02.md` | 1.0 | ACTIVE | Business | Commercial |

### 5.12 Architecture Decision Records (D11)

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 46 | ADR Part 01 — Database, Cache, Auth & Multi-tenancy | `docs/planning/D11_ADR_PART_01.md` | 1.0 | ACTIVE | Platform Architect | Architecture |
| 47 | ADR Part 02 — Video, Storage, Queue, Search & Messaging | `docs/planning/D11_ADR_PART_02.md` | 1.0 | ACTIVE | Platform Architect | Architecture |

### 5.13 This Document

| # | Document | File | Version | Status | Owner | Category |
|---|----------|------|---------|--------|-------|----------|
| 48 | Master Documentation Index | `docs/planning/MDI_MASTER_INDEX.md` | 1.1 | ACTIVE | Platform Architect | Meta |

---

## 6. Glossary of Key Terms

| Term | Definition |
|------|------------|
| **SSGzone** | The platform. Root domain: ssgzone.in |
| **SaaS Platform** | A B2B software company that integrates SSGzone into their product (e.g. Rupyo, LMS). Also called "platform" or "SaaS partner". |
| **Tenant** | A client/customer of the SaaS Platform (e.g. NABC company using Rupyo). Has its own subdomain. |
| **User** | An individual within a Tenant. Has a mailbox: `prefix@tenant.saas.ssgzone.in` |
| **Super Admin** | SSGzone's own administrator. Has platform-wide access. |
| **SaaS Admin** | Administrator of a SaaS Platform. Manages their tenants. |
| **Tenant Admin** | Administrator of a Tenant. Manages their users. |
| **Provisioning** | The automated process of creating a tenant or user with all required resources (DNS, mailbox, DKIM, etc.) |
| **DKIM** | DomainKeys Identified Mail. Cryptographic email signing to prove authenticity. |
| **DMARC** | Domain-based Message Authentication. Policy for handling failed SPF/DKIM. |
| **SPF** | Sender Policy Framework. DNS record listing authorized mail senders. |
| **MX Record** | DNS record pointing a domain's email to the correct mail server. |
| **RLS** | Row-Level Security. PostgreSQL feature ensuring tenants can only access their own data. |
| **UUID v4** | Universally Unique Identifier version 4. All primary keys use this format. |
| **BullMQ** | Redis-backed job queue library used for mail, provisioning, and notification workers. |
| **WebRTC SFU** | Selective Forwarding Unit for video meetings. Technology to be finalized in Phase 2 (candidates: LiveKit, mediasoup, Janus). |
| **LiveKit** | One candidate WebRTC SFU. Not locked as final choice. See ADR D11 for decision criteria. |
| **Messaging Infrastructure Platform** | SSGzone's Phase 5 programmable messaging layer, comparable to Twilio, MessageBird, Sinch, or Infobip. SMS, WhatsApp, and RCS are channel connectors to this platform, not standalone product features. |
| **Channel Connector** | A pluggable adapter in the Messaging Infrastructure Platform that routes messages to a specific external provider (e.g. SMS via MSG91, WhatsApp via Meta Cloud API). |
| **ADR** | Architecture Decision Record. Documents why a specific technology or architectural pattern was chosen over alternatives. |
| **SFU** | Selective Forwarding Unit. A video server that routes streams between participants without mixing them. |
| **VAPID** | Voluntary Application Server Identification. Standard for browser push notifications. |
| **DLT** | Distributed Ledger Technology. India's TRAI-mandated system for SMS sender/template registration. |
| **RAG** | Retrieval Augmented Generation. AI pattern: retrieve relevant docs, then generate answer grounded in them. |
| **eDiscovery** | Legal process of searching and exporting electronic communications for litigation or compliance. |
| **MAT** | Monthly Active Tenants. SSGzone's north star metric. |
| **MRR** | Monthly Recurring Revenue. |
| **ARR** | Annual Recurring Revenue. MRR × 12. |
| **CAC** | Customer Acquisition Cost. |
| **LTV** | Lifetime Value. Average revenue from a customer over their lifetime. |
| **NRR** | Net Revenue Retention. Measures expansion vs churn in existing customers. |
| **Phase 0–7** | SSGzone's development phases. Phase 0 = foundation, Phase 7 = international scale. |
| **MDI** | This document. Master Documentation Index. |
---

## 7. Document Ownership & Governance

### 7.1 Ownership by Category

| Category | Owner Role | Review Frequency |
|----------|------------|------------------|
| Strategy (Master Plan) | Platform Architect | Per phase completion |
| Product (PRD, Dashboard) | Product Manager | Per sprint / feature change |
| Database | Backend Lead | On schema change |
| API | Backend Lead | On endpoint change |
| UI/UX | Frontend Lead | On design system change |
| Infrastructure (D6, D7, D8) | Backend Lead + DevOps | On architecture change |
| Architecture Decisions (D11) | Platform Architect | When a decision is made or revisited |
| AI Roadmap | AI/ML Lead | Quarterly |
| Commercial | Founder / Business Lead | Quarterly |
| MDI (this document) | Platform Architect | Monthly |

### 7.2 Document Update Protocol

```
When to update a document:
  - A decision changes something the document is authoritative for
  - A new feature is added to a module
  - A technology choice changes
  - A phase milestone is completed

How to update:
  1. Edit the relevant document
  2. Increment version (MAJOR.MINOR)
  3. Update "Last Updated" date
  4. If the change affects other documents, update those too
  5. Update MDI Section 5 (version + last updated)
  6. Note the change in the document's own changelog (if major)

What NOT to do:
  - Do not create a new document for a small change — update the existing one
  - Do not duplicate content across documents — link instead
  - Do not let MDI go stale — it is updated whenever any document changes
```

### 7.3 Conflict Resolution

If two documents appear to contradict each other:

1. Check Section 8 (Authoritative Scope) — the document listed as authoritative for that topic wins
2. If both claim authority, the more specific document wins (e.g. API Blueprint wins over PRD for endpoint details)
3. If still unclear, the Platform Architect makes the call and updates both documents

### 7.4 New Document Protocol

Before creating a new document:
1. Check if the content belongs in an existing document (update instead)
2. If new document is justified: add it to MDI Section 5 immediately
3. Assign: document number, owner, category, review frequency
4. Link it in the dependency map (Section 3)

---

---

## 8. Document Purpose & Authoritative Scope

This section defines what each document is the **single source of truth** for. When two documents appear to conflict, the document listed as authoritative for that topic wins.

### 8.1 Audit & Master Plan (Docs 01–11)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 01 — Audit | Current state scores, gap analysis, what is broken | What to build next (see Master Plan) |
| 02 — Master Plan P01 | Phase 0 & 1 task list, sprint breakdown | Feature details (see PRD) |
| 03 — Master Plan P02 | Phase 2 & 3 task list | Schema details (see Database) |
| 04 — Master Plan P03 | Phase 4 & 5 task list | API contracts (see API Blueprint) |
| 05 — Master Plan P04 | Phase 6 & 7 task list | UI specs (see Dashboard/UI/UX) |
| 06 — Master Plan P05 | Inter-module dependency order | Technology choices (see Comm Engine) |
| 07 — Master Plan P06 | Feature completion tracker | Acceptance criteria (see PRD) |
| 08 — Master Plan P07 | Risk register, mitigation plans | Commercial risks (see Commercial P01) |
| 09 — Master Plan P08 | Milestone dates, go/no-go criteria | Financial projections (see Commercial P02) |
| 10 — Master Plan P09 | Team structure, hiring plan | Salary benchmarks |
| 11 — Master Plan P10 | Executive summary of all phases | Any detail (see individual docs) |

### 8.2 PRD — D1 (Docs 12–17)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 12 — PRD P01 | Mail user stories, acceptance criteria, business rules | Mail schema (see DB P02), Mail API (see API P03) |
| 13 — PRD P02 | Calendar & Contacts user stories, ACs | Calendar schema (see DB P02) |
| 14 — PRD P03 | Chat & Presence user stories, ACs | Chat protocol (see Messaging P01) |
| 15 — PRD P04 | Video & Drive user stories, ACs | Video infra (see Comm Engine P02) |
| 16 — PRD P05 | Notifications, Search, Directory ACs | Notification pipeline (see Comm Engine P02) |
| 17 — PRD P06 | Auth flows, MFA, SSO, multi-tenancy rules | Auth API endpoints (see API P01) |

### 8.3 Dashboard — D2 (Docs 18–22)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 18 — Dashboard P01 | Super Admin screen layout, menus, widgets | Super Admin API (see API P01/P02) |
| 19 — Dashboard P02 | SaaS Admin screen layout, developer hub UI | SaaS provisioning logic (see Provisioning P01) |
| 20 — Dashboard P03 | Tenant Admin screen layout, bulk import UI | Tenant API (see API P02) |
| 21 — Dashboard P04 | End User home, presence control UI | Presence protocol (see Comm Engine P01) |
| 22 — Dashboard P05 | Webmail UI, component refactoring map (14 components) | Component CSS (see UI/UX P02) |

### 8.4 Database — D3 (Docs 23–26)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 23 — DB P01 | UUID strategy, RLS pattern, naming conventions, auth/platform tables (11) | Auth flow logic (see PRD P06) |
| 24 — DB P02 | Mail (10 tables), Calendar (5), Contacts (4) schemas | Mail delivery pipeline (see Comm Engine P01) |
| 25 — DB P03 | Chat (7), Video (2), Drive (4), Notifications (5) schemas | Chat protocol (see Messaging P01) |
| 26 — DB P04 | Billing (4), Audit (4) schemas, index strategy, partition strategy, retention | Billing logic (see Provisioning P02) |

### 8.5 API Blueprint — D4 (Docs 27–31)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 27 — API P01 | API standards, versioning, error codes, Auth API (8 ep), Super Admin API (17 ep) | Auth flow UX (see PRD P06) |
| 28 — API P02 | SaaS Admin API (25 ep), Tenant Admin API (20 ep) | Provisioning pipeline (see Provisioning P01) |
| 29 — API P03 | Mail API (22 ep), Calendar API (12 ep), Contacts API (14 ep) | Mail delivery (see Comm Engine P01) |
| 30 — API P04 | Chat API (22 ep + 16 WS events), Video API (7 ep), Drive API (20 ep) | Chat protocol (see Messaging P01) |
| 31 — API P05 | Notifications API (10 ep), Search API (2 ep), Integration API (10 ep) | Push delivery (see Comm Engine P02) |

### 8.6 UI/UX Design System — D5 (Docs 32–34)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 32 — UI/UX P01 | All CSS design tokens (color, type, spacing, motion, z-index), breakpoints, grid | Screen layouts (see Dashboard D2) |
| 33 — UI/UX P02 | All component specs (Button, Input, Badge, Table, Modal, Toast, etc.) | Business logic in components |
| 34 — UI/UX P03 | Screen flows, URL structure, keyboard shortcuts, responsive behavior, tenant branding | API calls within flows (see API D4) |

### 8.7 Communication Engine — D6 (Docs 35–36)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 35 — Comm P01 | Inbound/outbound SMTP pipeline, mail queue design, IMAP auth, DKIM lifecycle, WS architecture, presence system | Mail API endpoints (see API P03) |
| 36 — Comm P02 | Self-hosted WebRTC SFU architecture (technology TBD), push notification pipeline (VAPID), delivery guarantees, WS security, capacity targets | Video API (see API P04) |

### 8.8 Provisioning Engine — D7 (Docs 37–38)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 37 — Prov P01 | Platform/tenant/user provisioning pipelines, DNS automation, DKIM provisioning, webhook system, suspension/offboarding | Provisioning API endpoints (see Provisioning P02) |
| 38 — Prov P02 | Plan tiers, quota enforcement, Razorpay billing integration, provisioning worker, full provisioning API reference | Billing DB schema (see DB P04) |

### 8.9 Messaging Infrastructure — D8 (Docs 39–41)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 39 — Msg P01 | Chat data model, message protocol, channel management, threading, reactions, unread counts, typing indicators, file sharing | Chat API endpoints (see API P04) |
| 40 — Msg P02 | Unified search architecture, moderation system, retention policies, GDPR implementation, audit logging, eDiscovery | Search API (see API P05) |
| 41 — Msg P03 | Phase 5 Messaging Infrastructure Platform design, channel connectors (SMS/WhatsApp/RCS), DLT compliance, cross-module integrations, deployment map | Channel connector API design (future doc) |

### 8.12 Architecture Decision Records — D11 (Docs 46–47)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 46 — ADR P01 | Why PostgreSQL, Redis, JWT, UUID v4, multi-tenancy pattern, event-driven architecture were chosen | How to implement them (see Database D3, API D4, Comm Engine D6) |
| 47 — ADR P02 | Why specific WebRTC SFU, object storage, queue system, search engine, provisioning strategy, messaging infrastructure approach were chosen | Implementation details (see respective domain documents) |

### 8.10 AI Roadmap — D9 (Docs 42–43)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 42 — AI P01 | AI infrastructure, model strategy, mail AI features (smart compose, summarize, smart reply, categorization), chat AI features | AI API endpoint contracts (future doc) |
| 43 — AI P02 | Calendar AI, Drive AI, Admin AI, Phase 3/4/5 rollout timeline, cost management, AI governance & feature flags | AI model training details |

### 8.11 Commercial Roadmap — D10 (Docs 44–45)

| Doc # | Authoritative For | NOT Authoritative For |
|-------|------------------|-----------------------|
| 44 — Comm P01 | Market positioning, competitive analysis, pricing tiers, GTM strategy by phase, acquisition funnel | Product feature decisions (see PRD) |
| 45 — Comm P02 | 3-year financial projections, unit economics, funding roadmap, business milestones, investment thesis | Technical milestones (see Master Plan P08) |
