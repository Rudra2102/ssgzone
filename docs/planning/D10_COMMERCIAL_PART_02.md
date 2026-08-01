# D10 — Commercial Roadmap | Part 02: Financial Projections, Milestones & Investment Thesis

## 1. Financial Projections

### 1.1 Revenue Model Assumptions

```
SaaS Platform customers:
  Average plan: Growth (₹9,999/month)
  Average tenants per platform: 20
  Average users per tenant: 30
  Churn rate: 3%/month (early), 1.5%/month (mature)

Tenant direct customers:
  Average plan: Standard (₹1,499/month)
  Average users: 25
  Churn rate: 4%/month (early), 2%/month (mature)

Overage revenue: 15% of subscription revenue
Professional services: 10% of subscription revenue (Year 1), declining to 5%
```

### 1.2 3-Year Revenue Projection

#### Year 1 (Months 1–12)

| Month | SaaS Platforms | Tenants | MRR (₹) | Notes |
|-------|---------------|---------|---------|-------|
| 1–3 | 3 | 15 | 30,000 | Pilot (free/discounted) |
| 4–6 | 8 | 60 | 80,000 | First paying customers |
| 7–9 | 20 | 200 | 200,000 | Self-serve launch |
| 10–12 | 40 | 500 | 400,000 | Growth acceleration |

**Year 1 ARR: ~₹48 Lakhs**

#### Year 2 (Months 13–24)

| Month | SaaS Platforms | Tenants | MRR (₹) | Notes |
|-------|---------------|---------|---------|-------|
| 13–15 | 70 | 1,000 | 700,000 | AI features launch |
| 16–18 | 110 | 2,000 | 1,100,000 | Partner channel active |
| 19–21 | 160 | 4,000 | 1,600,000 | Enterprise deals |
| 22–24 | 220 | 7,000 | 2,200,000 | International pilots |

**Year 2 ARR: ~₹2.2 Crores**

#### Year 3 (Months 25–36)

| Month | SaaS Platforms | Tenants | MRR (₹) | Notes |
|-------|---------------|---------|---------|-------|
| 25–27 | 300 | 12,000 | 3,000,000 | SEA expansion |
| 28–30 | 400 | 20,000 | 4,000,000 | Messaging gateway live |
| 31–33 | 520 | 30,000 | 5,200,000 | Enterprise scale |
| 34–36 | 650 | 45,000 | 6,500,000 | Market leadership |

**Year 3 ARR: ~₹7.8 Crores**

---

### 1.3 Revenue Breakdown (Year 3)

| Stream | % of Revenue | ₹ ARR |
|--------|-------------|-------|
| SaaS Platform subscriptions | 55% | 4.3 Cr |
| Tenant direct subscriptions | 25% | 1.95 Cr |
| Overages (users, storage, AI) | 12% | 0.94 Cr |
| Professional services | 5% | 0.39 Cr |
| Messaging Infrastructure Platform (SMS/WA connectors) | 3% | 0.23 Cr |

---

### 1.4 Cost Structure

#### Infrastructure Costs (Monthly, Year 1)

| Component | Cost (₹/month) |
|-----------|---------------|
| Cloud compute (API, WS, workers) | 30,000 |
| PostgreSQL (managed, RDS) | 15,000 |
| Redis (managed, ElastiCache) | 8,000 |
| Mail servers (Postfix/Dovecot) | 20,000 |
| Object storage (S3, 10 TB) | 10,000 |
| CDN | 5,000 |
| Elasticsearch | 12,000 |
| Monitoring (Datadog/Grafana) | 8,000 |
| **Total infra** | **₹1,08,000** |

Infrastructure scales to ~₹5,00,000/month by Year 3 (with 45,000 tenants).

#### Team Costs (Monthly, Year 1)

| Role | Count | Cost (₹/month) |
|------|-------|---------------|
| Founder/CTO | 1 | — (equity) |
| Backend engineers | 2 | 2,00,000 |
| Frontend engineer | 1 | 80,000 |
| DevOps engineer | 1 | 1,00,000 |
| Sales/BD | 1 | 60,000 + commission |
| **Total team** | **6** | **₹4,40,000** |

#### Unit Economics (Year 2 target)

| Metric | Target |
|--------|--------|
| CAC (SaaS platform) | < ₹15,000 |
| LTV (SaaS platform, 24-month avg) | ₹2,40,000 |
| LTV:CAC ratio | > 16:1 |
| Gross margin | > 70% |
| Payback period | < 3 months |

---

### 1.5 Path to Profitability

```
Month 1–6:   Burn phase. Revenue < costs. Funded by founder capital or pre-seed.
Month 7–12:  Revenue covers infra costs. Team costs still exceed revenue.
Month 13–18: Revenue covers infra + partial team. Approaching break-even.
Month 18–20: Break-even at ~₹15L MRR (assuming 6-person team).
Month 21+:   Profitable. Reinvest in team growth and product.

Break-even calculation:
  Monthly costs (Month 18): ₹8,00,000 (infra ₹2L + team ₹6L)
  Required MRR: ₹11,43,000 (at 70% gross margin)
  Projected MRR Month 18: ₹11,00,000 ✓ (near break-even)
```

---

## 2. Milestone Roadmap

### 2.1 Product Milestones

| Milestone | Target Month | Definition of Done |
|-----------|-------------|-------------------|
| MVP Live | Month 3 | Mail send/receive, IMAP, basic webmail, 1 SaaS platform integrated |
| Self-serve Launch | Month 6 | Signup, provisioning, billing all automated, no manual steps |
| Full Communication Suite | Month 9 | Chat, Calendar, Contacts, Drive all live |
| Video (Self-hosted WebRTC) | Month 10 | Self-hosted video meetings, screen share — SFU technology TBD |
| AI Features (Phase 3) | Month 15 | Smart reply, summarization, smart scheduling live |
| Enterprise Features | Month 18 | eDiscovery, GDPR tools, SSO, audit logs, SLA |
| AI Search | Month 20 | Natural language search across all modules |
| Messaging Infrastructure Platform | Month 24 | Platform live, SMS connector, DLT compliance, delivery tracking |
| WhatsApp Business Connector | Month 27 | WhatsApp channel connector, template messages, opt-in management |
| International Launch | Month 28 | USD pricing, SEA region, data residency |
| Self-hosted Option | Month 30 | Enterprise on-premise deployment package |

### 2.2 Business Milestones

| Milestone | Target Month | Metric |
|-----------|-------------|--------|
| First paying customer | Month 4 | 1 SaaS platform on paid plan |
| Product-market fit signal | Month 9 | NPS > 40, < 3% monthly churn |
| ₹10L MRR | Month 12 | 40 SaaS platforms |
| Break-even | Month 19 | Revenue > all costs |
| ₹1 Cr MRR | Month 24 | 220 SaaS platforms |
| Series A ready | Month 24 | ₹1 Cr MRR, 30% MoM growth, clear path to ₹10 Cr ARR |
| ₹5 Cr MRR | Month 33 | 500+ SaaS platforms |

### 2.3 Technical Milestones

| Milestone | Target Month | Definition |
|-----------|-------------|------------|
| 99.9% uptime | Month 6 | Measured over 30 days |
| < 5s mail delivery (p95) | Month 3 | End-to-end inbound delivery |
| 10,000 concurrent users | Month 9 | Load tested |
| SOC 2 Type I | Month 18 | Audit completed |
| SOC 2 Type II | Month 24 | 6-month observation period |
| ISO 27001 | Month 30 | Certification |
| 100,000 concurrent users | Month 24 | Load tested |

---

## 3. Investment Thesis

### 3.1 The Opportunity

```
Indian SaaS market:
  - 1,000+ B2B SaaS companies in India (2024)
  - Growing at 25% YoY
  - Each SaaS company has 10–1,000 enterprise clients (tenants)
  - Each tenant has 10–10,000 employees (users)

Total Addressable Market (TAM):
  - 1,000 SaaS platforms × avg 100 tenants × avg 50 users
  - = 5,000,000 potential mailboxes
  - At ₹149/user/month = ₹745 Cr/month TAM
  - Conservative 5% capture = ₹37 Cr/month = ₹444 Cr ARR

Serviceable Addressable Market (SAM, 3-year horizon):
  - 500 SaaS platforms × 50 tenants × 30 users
  - = 750,000 mailboxes
  - At blended ₹120/user/month = ₹90 Cr ARR

Serviceable Obtainable Market (SOM, 3-year target):
  - 650 SaaS platforms, 45,000 tenants
  - ₹7.8 Cr ARR (Year 3 projection)
  - = 8.7% of SAM ✓ (realistic)
```

### 3.2 Why Now

```
1. Indian SaaS explosion: 2020–2024 saw 3x growth in Indian B2B SaaS companies.
   Each new SaaS company is a potential SSGzone customer.

2. Google Workspace price increase (2022): Google ended free Workspace,
   forcing millions of Indian SMBs to find alternatives.

3. Data localization pressure: Indian government pushing for data residency.
   SSGzone is India-first, India-hosted.

4. AI commoditization: LLM APIs are now cheap enough to build AI features
   that were impossible 2 years ago. First-mover advantage in AI-powered
   communication for Indian SaaS.

5. No direct competitor: No Indian company offers API-first, multi-tenant
   email infrastructure for SaaS embedding. This is a greenfield market.
```

### 3.3 Funding Requirements

#### Pre-Seed (Self-funded / Friends & Family)
```
Amount: ₹50–75 Lakhs
Use:
  - 6 months runway for 4-person team
  - Infrastructure setup
  - MVP development
  - First 5 customer pilots

Milestone to unlock: ₹10L MRR, 40 paying SaaS platforms
```

#### Seed Round
```
Amount: ₹2–3 Crores
Timing: Month 12–15 (after PMF signal)
Use:
  - Team expansion: 4 engineers, 2 sales, 1 marketing
  - AI feature development (Phase 3)
  - Marketing and content
  - SOC 2 certification
  - 18 months runway

Target investors:
  - Indian SaaS-focused VCs: Blume Ventures, Stellaris, Elevation Capital
  - Angel investors: Indian SaaS founders (Freshworks, Zoho alumni)

Milestone to unlock: ₹1 Cr MRR, Series A metrics
```

#### Series A
```
Amount: ₹15–25 Crores
Timing: Month 24 (₹1 Cr MRR)
Use:
  - International expansion (SEA, Middle East)
  - Enterprise sales team
  - Messaging Infrastructure Platform (SMS + WhatsApp connectors)
  - Self-hosted product
  - 24 months runway

Target investors:
  - Sequoia Surge, Accel India, Matrix Partners India
  - Strategic: Twilio Ventures, Salesforce Ventures
```

---

## 4. Risk Register (Commercial)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Workspace launches API provisioning | Medium | High | Deepen multi-tenant features, lower price, India-first positioning |
| SaaS platform customer churns, taking all their tenants | Medium | High | Direct tenant relationships, data portability, multi-platform tenants |
| Razorpay payment failures at scale | Low | Medium | Stripe as fallback, retry logic, dunning emails |
| Indian data localization law changes | Low | High | Already India-hosted, monitor regulatory changes |
| LLM API cost spike | Medium | Medium | Multi-model strategy, self-hosted fallback, cost caps |
| Key engineer departure | Medium | High | Documentation, knowledge sharing, competitive compensation |
| Spam/abuse on platform | Medium | Medium | Rspamd, rate limits, abuse team, IP reputation monitoring |
| Competitor raises large round | Low | Medium | Focus on product depth, customer success, switching costs |

---

## 5. Success Metrics Dashboard

### 5.1 North Star Metric

**Monthly Active Tenants (MAT)**: number of tenants with at least one active user sending or receiving a message in the past 30 days.

This metric captures both growth (new tenants) and retention (tenants staying active).

### 5.2 Key Metrics by Function

#### Product
| Metric | Month 6 | Month 12 | Month 24 |
|--------|---------|---------|---------|
| MAT | 50 | 500 | 7,000 |
| DAU/MAU ratio | 40% | 50% | 60% |
| Mail delivery success rate | 98% | 99% | 99.5% |
| API uptime | 99.5% | 99.9% | 99.95% |
| NPS | 30 | 45 | 55 |

#### Revenue
| Metric | Month 6 | Month 12 | Month 24 |
|--------|---------|---------|---------|
| MRR | ₹4L | ₹10L | ₹1 Cr |
| ARR | ₹48L | ₹1.2 Cr | ₹12 Cr |
| Gross margin | 60% | 68% | 72% |
| Net Revenue Retention | 95% | 105% | 115% |
| CAC payback (months) | 6 | 4 | 3 |

#### Growth
| Metric | Month 6 | Month 12 | Month 24 |
|--------|---------|---------|---------|
| SaaS platforms | 8 | 40 | 220 |
| MoM growth | 20% | 15% | 10% |
| Monthly churn | 5% | 3% | 1.5% |
| Partner-sourced revenue | 0% | 10% | 30% |

---

## 6. The 5-Year Vision

```
Year 1: Prove the model
  India's first API-first multi-tenant email platform.
  50 SaaS platforms, 500 tenants, ₹48L ARR.

Year 2: Scale the platform
  Full communication suite (mail, chat, video, drive).
  AI-powered features. 220 SaaS platforms, ₹2.2 Cr ARR.

Year 3: Expand the market
  Messaging Infrastructure Platform live (SMS + WhatsApp connectors). International pilots.
  650 SaaS platforms, ₹7.8 Cr ARR.

Year 4: Become the infrastructure layer
  Every Indian B2B SaaS company uses SSGzone for communication.
  Self-hosted enterprise option. ₹25 Cr ARR.

Year 5: Regional leader
  Southeast Asia and Middle East expansion.
  The "Twilio for communication" for emerging markets.
  ₹75 Cr ARR, Series B, path to IPO.
```

---

*Part 02 of 02 — D10 Commercial Roadmap Complete*

---

## Planning Package Complete

All 10 documents (D1–D10) across 24 parts are now complete.

| Doc | Name | Parts | Status |
|-----|------|-------|--------|
| D1 | Product Requirements Document | 6 | ✅ |
| D2 | Dashboard Specification | 5 | ✅ |
| D3 | Database Blueprint | 4 | ✅ |
| D4 | API Blueprint | 5 | ✅ |
| D5 | UI/UX Design System | 3 | ✅ |
| D6 | Communication Engine Blueprint | 2 | ✅ |
| D7 | SaaS Provisioning Engine | 2 | ✅ |
| D8 | Messaging Infrastructure Blueprint | 3 | ✅ |
| D9 | AI Roadmap | 2 | ✅ |
| D10 | Commercial Roadmap | 2 | ✅ |
| **Total** | | **34 parts** | **✅** |
