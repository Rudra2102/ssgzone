# D10 — Commercial Roadmap | Part 01: Market Strategy, Pricing & Go-to-Market

## 1. Market Positioning

### 1.1 The Problem SSGzone Solves

SaaS companies in India building HR, ERP, LMS, CRM, and similar platforms face a common problem: their users need professional email addresses tied to the SaaS product's domain, but building and operating email infrastructure is expensive, complex, and outside the SaaS company's core competency.

Current alternatives:
| Option | Problem |
|--------|---------|
| Google Workspace | ₹125–₹1,500/user/month, requires custom domain setup per client, no API for programmatic provisioning |
| Microsoft 365 | Same problems, higher cost |
| Zoho Mail | Limited API, not designed for multi-tenant SaaS embedding |
| Build in-house | 6–12 months, ₹50L+ investment, ongoing ops burden |

SSGzone's position: **The only API-first, multi-tenant communication platform built for Indian SaaS companies to embed into their products.**

### 1.2 Target Customer Segments

#### Primary: Indian B2B SaaS Companies

| Segment | Examples | Pain Point | SSGzone Value |
|---------|----------|------------|---------------|
| HR/Payroll SaaS | Rupyo, Keka, Darwinbox | Clients need company email | Provision email per employee |
| LMS / EdTech B2B | TalentLMS clones, corporate training | Learners need institutional email | Tenant email per institution |
| ERP / Accounting | Tally-adjacent SaaS | SMB clients need email | Affordable per-tenant email |
| CRM / Sales SaaS | Leadsquared alternatives | Sales teams need branded email | Team email provisioning |
| HRMS / Attendance | Attendance management SaaS | Employee communication | Full communication suite |

#### Secondary: Direct Enterprise Tenants

Organizations that want a managed communication suite without going through a SaaS intermediary.

| Segment | Size | Need |
|---------|------|------|
| SMBs (10–100 employees) | Large volume | Affordable Google Workspace alternative |
| NGOs / Educational institutions | Medium volume | Low-cost professional email |
| Startups | High growth | Scalable, API-friendly |

---

### 1.3 Competitive Differentiation

| Feature | SSGzone | Google Workspace | Zoho Mail | Microsoft 365 |
|---------|---------|-----------------|-----------|---------------|
| API-first provisioning | ✅ | ❌ | Partial | ❌ |
| Multi-tenant SaaS embedding | ✅ | ❌ | ❌ | ❌ |
| Subdomain per tenant | ✅ | ❌ | ❌ | ❌ |
| Programmatic user creation | ✅ | Admin SDK only | Limited | Graph API |
| Webmail embed (iframe) | ✅ | ❌ | ❌ | ❌ |
| India pricing (₹) | ✅ | ✅ | ✅ | ✅ |
| Built-in chat + video | ✅ | ✅ (Meet/Chat) | Partial | ✅ (Teams) |
| White-label branding | ✅ | ❌ | Partial | ❌ |
| Tenant-level isolation | ✅ | Per-domain only | ❌ | Per-tenant |
| Self-hosted option | Phase 4 | ❌ | ❌ | ❌ |

---

## 2. Pricing Model

### 2.1 Revenue Streams

```
Stream 1: SaaS Platform Subscriptions (B2B2B)
  SaaS companies pay monthly for platform access + tenant quota

Stream 2: Tenant Direct Subscriptions (B2B)
  Tenants pay directly (when not going through a SaaS platform)

Stream 3: Usage Overages
  Extra users, storage, API calls, AI credits beyond plan limits

Stream 4: Professional Services
  Onboarding, custom integration, migration from Google/Zoho

Stream 5: Enterprise Contracts
  Annual contracts with custom pricing, SLA, dedicated support
```

### 2.2 SaaS Platform Pricing

Billed monthly to SaaS companies. Annual billing: 2 months free (16.7% discount).

| Plan | Price/Month | Tenants | Users/Tenant | Storage/Mailbox | Modules |
|------|-------------|---------|--------------|-----------------|---------|
| **Starter** | ₹2,999 | 10 | 50 | 5 GB | Mail only |
| **Growth** | ₹9,999 | 100 | 500 | 10 GB | Mail + Cal + Chat |
| **Scale** | ₹24,999 | 500 | 1,000 | 25 GB | All modules |
| **Enterprise** | Custom | Unlimited | Custom | Custom | All + SLA |

Add-ons (any plan):
| Add-on | Price |
|--------|-------|
| Extra 10 tenants | ₹999/month |
| Extra 100 users/tenant | ₹499/month |
| Extra 1 TB storage | ₹999/month |
| AI credits (100K tokens) | ₹499/month |
| Dedicated IP for SMTP | ₹1,999/month |
| Priority support | ₹4,999/month |

### 2.3 Tenant Direct Pricing

For tenants not provisioned through a SaaS platform (direct sign-up).

| Plan | Price/Month | Users | Storage | Modules |
|------|-------------|-------|---------|---------|
| **Basic** | ₹499 | 10 | 2 GB/mailbox | Mail only |
| **Standard** | ₹1,499 | 100 | 10 GB/mailbox | Mail + Cal + Chat |
| **Professional** | ₹3,999 | 500 | 25 GB/mailbox | All modules |
| **Enterprise** | Custom | Unlimited | Custom | All + SLA |

Per-user pricing (alternative):
| Plan | Price/User/Month | Min Users |
|------|-----------------|-----------|
| Basic | ₹79 | 5 |
| Standard | ₹149 | 5 |
| Professional | ₹249 | 10 |

### 2.4 Pricing Philosophy

```
India-first pricing:
  - All prices in INR
  - Razorpay for payments (UPI, cards, net banking)
  - GST included in displayed prices (18% GST)
  - Annual billing incentivized (2 months free)

Competitive benchmarks:
  Google Workspace Business Starter: ₹125/user/month
  SSGzone Standard (per user): ₹149/user/month
  → Comparable price, but SSGzone includes:
    - Multi-tenant management
    - API provisioning
    - Webmail embed
    - No per-domain setup

Value metric: per tenant (SaaS plans) or per user (direct plans)
  → Scales with customer's growth
  → Predictable for customer's budgeting
```

---

## 3. Go-to-Market Strategy

### 3.1 Phase 1 GTM (Months 1–6): Founder-Led Sales

```
Target: 5 SaaS platform customers, 50 tenants total

Channels:
  1. Direct outreach to Indian SaaS founders (LinkedIn, Twitter/X)
  2. SaaS communities: SaaSBOOMi, iSPIRT, ProductNation
  3. Startup accelerators: Y Combinator India, Sequoia Surge, 100X.VC
  4. Developer communities: HasGeek, BangaloreJS, PyCon India

Offer: Pilot program
  - 3 months free for first 10 SaaS platforms
  - White-glove onboarding (founder personally onboards)
  - Weekly check-in calls
  - Feature requests prioritized

Success metric: 5 paying SaaS platforms by Month 6
```

### 3.2 Phase 2 GTM (Months 7–12): Product-Led Growth

```
Target: 50 SaaS platforms, 500 tenants

Channels:
  1. Self-serve signup (no sales call required for Starter/Growth)
  2. Developer documentation (docs.ssgzone.in)
  3. API sandbox (free, no credit card)
  4. Integration marketplace listings (if applicable)
  5. Content marketing: "How to add email to your SaaS" blog series
  6. SEO: target "email API India", "multi-tenant email SaaS"

Product-led hooks:
  - Free tier: 1 tenant, 5 users, 1 GB storage (forever free)
  - Upgrade prompt: when approaching limits
  - Referral program: 1 month free for each referred SaaS platform

Success metric: 50 paying SaaS platforms, < ₹5,000 CAC
```

### 3.3 Phase 3 GTM (Months 13–18): Channel Partnerships

```
Target: 200 SaaS platforms, 5,000 tenants

Channels:
  1. System integrators (SIs): partner with IT consultancies that implement SaaS for enterprises
  2. Cloud marketplaces: AWS Marketplace, Azure Marketplace listing
  3. Reseller program: SaaS agencies resell SSGzone to their clients
  4. Technology partnerships: integrate with popular Indian SaaS stacks

Partner program:
  Reseller tier:
    Silver: 10% revenue share, co-marketing
    Gold: 20% revenue share, dedicated partner manager, joint case studies
    Platinum: 30% revenue share, white-label option, custom contracts

Success metric: 30% of new revenue from partner channel
```

### 3.4 Phase 4 GTM (Months 19–24): Enterprise & International

```
Target: 500 SaaS platforms, 50,000 tenants

Enterprise sales:
  - Dedicated enterprise sales team (2 AEs)
  - Target: SaaS companies with > 500 tenants
  - Deal size: ₹5L–₹50L/year
  - Sales cycle: 3–6 months
  - Requirements: custom SLA, dedicated infra, compliance docs

International expansion:
  - Southeast Asia (Singapore, Indonesia, Philippines) — Phase 4
  - Middle East (UAE, Saudi Arabia) — Phase 5
  - Pricing: USD for international customers
  - Compliance: PDPA (Thailand/Singapore), local data residency

Success metric: ₹10 Cr ARR by Month 24
```

---

## 4. Customer Acquisition & Retention

### 4.1 Acquisition Funnel

```
Awareness
  → Blog, SEO, community presence, developer docs
  → Target: 10,000 monthly website visitors by Month 12

Interest
  → Free tier signup, API sandbox access
  → Target: 500 signups/month by Month 12

Activation
  → First tenant provisioned, first email sent
  → Target: 60% of signups activate within 7 days

Conversion
  → Upgrade from free to paid
  → Target: 15% free-to-paid conversion

Retention
  → Monthly churn < 3% (SaaS platforms)
  → Target: NPS > 50

Expansion
  → Upsell to higher plan, add-ons
  → Target: Net Revenue Retention > 110%
```

### 4.2 Churn Prevention

```
Early warning signals:
  - No API calls in 7 days → trigger check-in email
  - Tenant count declining → trigger success call
  - Support tickets increasing → proactive outreach
  - Usage below 20% of plan limits → downgrade risk

Retention plays:
  - Quarterly business reviews (Growth+ plans)
  - Feature adoption emails (new features relevant to their use case)
  - Success stories: share how similar SaaS companies use SSGzone
  - Annual contract discount: 2 months free → reduces monthly churn risk
```

### 4.3 Expansion Revenue

```
Expansion triggers:
  - Approaching user quota (80%) → suggest plan upgrade
  - Approaching storage quota (80%) → suggest storage add-on
  - High API usage → suggest rate limit upgrade
  - New AI features available → suggest AI credits add-on

In-app upgrade prompts:
  - Non-intrusive banner when approaching limits
  - One-click upgrade (no sales call for self-serve plans)
  - ROI calculator: "Upgrading saves you ₹X vs building in-house"
```

---

*Part 01 of 02 — Next: Financial Projections, Milestones & Investment Thesis*
