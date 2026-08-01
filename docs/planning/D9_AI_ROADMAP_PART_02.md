# D9 — AI Roadmap | Part 02: Calendar AI, Drive AI, Admin AI, Timeline & Governance

## 1. Calendar AI Features

### 1.1 Smart Scheduling (Phase 3)

Find the best meeting time across multiple attendees automatically.

```
Trigger: user adds attendees to a new event and clicks "Find best time"

Input:
  - Attendee list (user IDs)
  - Desired duration (30 min, 1 hr, etc.)
  - Preferred time range (morning / afternoon / any)
  - Lookahead window (next 5 business days, default)

Algorithm (no LLM needed — deterministic):
  1. Fetch free/busy slots for all attendees (calendar_events table)
  2. Find overlapping free windows of required duration
  3. Score each slot:
     - Prefer: 9 AM–12 PM and 2 PM–5 PM (core hours)
     - Penalize: back-to-back meetings (< 15 min gap)
     - Penalize: early morning / late evening
     - Prefer: slots where most attendees are in their timezone's core hours
  4. Return top 3 suggestions

Response:
  {
    suggestions: [
      { start: "ISO8601", end: "ISO8601", score: 0.95, conflictsFor: [] },
      { start: "ISO8601", end: "ISO8601", score: 0.82, conflictsFor: ["user_id_3"] },
      { start: "ISO8601", end: "ISO8601", score: 0.71, conflictsFor: [] }
    ]
  }

UI: "Best times" panel in event creation modal
User clicks a slot → auto-fills start/end time

API:
  POST /api/v1/ai/calendar/find-time
  { attendeeIds[], durationMinutes, preferredRange, lookaheadDays }
  → { suggestions[] }
```

### 1.2 Meeting Agenda Generator (Phase 3)

```
Trigger: user clicks "Generate agenda" in event creation

Input:
  - Event title
  - Attendee names and roles
  - Optional: related email thread ID or chat conversation ID

Model: Tier 2 (Llama 3.1 70B)

Prompt:
  "Generate a structured meeting agenda for:
   Title: {title}
   Attendees: {attendee_names_and_roles}
   Duration: {duration} minutes
   Context: {email_or_chat_summary if provided}
   Format: numbered list with time allocations."

Response:
  "1. Welcome & introductions (5 min)
   2. Review Q3 targets (15 min)
   3. Budget discussion (20 min)
   4. Action items & next steps (10 min)
   5. AOB (5 min)"

UI: inserted into event description field (editable)

API:
  POST /api/v1/ai/calendar/generate-agenda
  { title, attendeeIds[], durationMinutes, contextThreadId }
  → { agenda: string }
```

### 1.3 Meeting Notes & Action Items (Phase 4)

```
Trigger: after a video meeting ends (if recording/transcription enabled)

Input:
  - Meeting transcript (from LiveKit Egress + Whisper transcription)
  - Attendee names
  - Meeting title

Model: Tier 1 (GPT-4o) — quality critical for meeting notes

Output:
  {
    summary: "3-paragraph meeting summary",
    actionItems: [
      { owner: "Priya Verma", task: "Send revised budget by Friday", dueDate: "2024-01-19" },
      { owner: "Amit Shah", task: "Schedule follow-up with client", dueDate: null }
    ],
    decisions: ["Approved Q3 budget of ₹50L", "Deferred hiring to Q4"],
    nextMeeting: null
  }

Delivery:
  - Posted as a message in the meeting's chat channel
  - Attached to the calendar event as a note
  - Emailed to all attendees (optional, configurable)

Transcription pipeline:
  LiveKit Egress (audio) → S3 → Whisper API → transcript text → GPT-4o → notes

API (internal, triggered post-meeting):
  POST /internal/ai/video/meeting-notes
  { meetingId, transcriptS3Key }
  → { notes: { summary, actionItems, decisions } }
```

---

## 2. Drive AI Features

### 2.1 Document Summarization (Phase 3)

```
Trigger: user clicks "Summarize" on a file in Drive

Supported types: PDF, DOCX, TXT, PPTX (text extraction)

Input:
  - Extracted text from document (max 16,000 tokens)
  - File name

Model: Tier 1 (GPT-4o) for long documents, Tier 2 for short

Prompt:
  "Summarize this document in 5 bullet points.
   Include: main topic, key findings, conclusions, any action items.
   Document: {extracted_text}"

Response:
  { summary: string[], keyTopics: string[], pageCount: number }

UI: side panel in Drive file preview
Cached: per file version (invalidated on file update)

API:
  POST /api/v1/ai/drive/summarize
  { fileId }
  → { summary[], keyTopics[], model, latencyMs }
```

### 2.2 Smart File Search (Phase 4)

```
Natural language search within Drive:
  "Find the contract with ABC Corp from last year"
  "Show me all invoices over ₹1 lakh"

Flow:
  1. LLM extracts: file type, keywords, date range, metadata hints
  2. Execute structured Drive search
  3. Return results with relevance explanation

Requires: file content indexing in Elasticsearch (Phase 2)

API:
  POST /api/v1/ai/drive/search
  { query: "contract with ABC Corp from last year" }
  → { results[], explanation: "Searching for contracts mentioning ABC Corp..." }
```

### 2.3 Auto-Tagging (Phase 4)

```
Trigger: on file upload (async)

Input: file name + extracted text (first 500 words)

Model: Tier 3 (fine-tuned classifier)

Output: up to 5 tags from a predefined taxonomy:
  contract, invoice, report, proposal, presentation,
  policy, hr, finance, legal, technical, marketing

Stored: drive_files.ai_tags (JSONB)
Used for: filter by tag in Drive UI

API (internal):
  POST /internal/ai/drive/tag
  { fileId, fileName, textPreview }
  → { tags: string[], confidence: number[] }
```

---

## 3. Admin AI Features

### 3.1 Anomaly Detection (Phase 4)

Detect unusual patterns in platform usage that may indicate security issues or abuse.

```
Monitored patterns:
  - Login from new country/device (immediate alert)
  - Bulk email send spike (> 5x normal volume in 1h)
  - Mass file download (> 100 files in 10 min)
  - Unusual after-hours activity (configurable hours)
  - Multiple failed login attempts across tenant
  - Sudden spike in outbound mail bounce rate

Detection method:
  - Statistical baseline per user (rolling 30-day average)
  - Z-score threshold: > 3 standard deviations = anomaly
  - No LLM needed — pure statistical analysis

Alert delivery:
  - In-app notification to Tenant Admin / Super Admin
  - Email alert
  - Webhook: security.anomaly_detected

API:
  GET /api/v1/admin/security/anomalies
  → { anomalies: [{ userId, type, severity, detectedAt, details }] }
```

### 3.2 Usage Insights (Phase 3)

Natural language summaries of platform analytics for admins.

```
Trigger: Admin opens Analytics dashboard

Input:
  - Last 30 days of aggregated usage metrics
  - Comparison to previous 30 days

Model: Tier 2

Prompt:
  "Generate a 3-sentence executive summary of platform usage.
   Highlight: growth trends, most active features, concerns.
   Data: {metrics_json}"

Response:
  "Your platform had 1,247 active users this month, up 18% from last month.
   Mail and Chat are the most-used features, with 45,000 messages sent.
   Storage usage is at 67% capacity — consider upgrading your plan."

UI: "AI Insights" card at top of analytics dashboard
Refreshed: daily (cached)

API:
  GET /api/v1/ai/admin/insights
  → { summary: string, highlights: string[], concerns: string[] }
```

### 3.3 Support Assistant (Phase 4)

AI-powered first-line support for tenant admins.

```
Trigger: Admin clicks "Help" → "Ask AI"

Input: admin's question in natural language

Knowledge base:
  - SSGzone documentation (indexed in vector DB)
  - Tenant's own configuration (settings, users, plan)
  - Common troubleshooting guides

Model: Tier 1 (RAG — Retrieval Augmented Generation)

Flow:
  1. Embed user question (text-embedding-3-small)
  2. Vector search in knowledge base (pgvector or Pinecone)
  3. Retrieve top 5 relevant docs
  4. GPT-4o generates answer grounded in retrieved docs
  5. Include source links

Response:
  {
    answer: "To add a new user, go to Users → Add User...",
    sources: [{ title: "User Management Guide", url: "/docs/users" }],
    confidence: 0.91
  }

Escalation: if confidence < 0.6 → "I'm not sure. Contact support@ssgzone.in"

API:
  POST /api/v1/ai/support/ask
  { question: string }
  → { answer, sources[], confidence }
```

---

## 4. AI Feature Rollout Timeline

### Phase 3 (Months 13–18)

| Feature | Module | Model | Priority |
|---------|--------|-------|----------|
| Email summarization | Mail | GPT-4o | P0 |
| Smart reply (mail) | Mail | Llama 3.1 70B | P0 |
| Smart compose | Mail | Llama 3.1 70B | P1 |
| Conversation summary (chat) | Chat | GPT-4o | P0 |
| Smart reply (chat) | Chat | Llama 3.1 70B | P1 |
| Message translation | Chat | GPT-4o | P1 |
| Smart scheduling | Calendar | Deterministic | P0 |
| Agenda generator | Calendar | Llama 3.1 70B | P1 |
| Document summarization | Drive | GPT-4o | P1 |
| Email categorization | Mail | DistilBERT | P0 |
| Vacation reply generator | Mail | Llama 3.1 70B | P2 |
| Usage insights (admin) | Admin | Llama 3.1 70B | P2 |

### Phase 4 (Months 19–24)

| Feature | Module | Model | Priority |
|---------|--------|-------|----------|
| AI search assistant | Global | GPT-4o | P0 |
| Meeting notes & action items | Video | GPT-4o + Whisper | P0 |
| Anomaly detection | Admin | Statistical | P0 |
| Smart file search | Drive | GPT-4o | P1 |
| Auto-tagging | Drive | DistilBERT | P1 |
| Support assistant (RAG) | Admin | GPT-4o + pgvector | P1 |
| PII scrubbing pipeline | Infra | spaCy NER | P0 |
| Self-hosted model infra | Infra | Llama 3.1 8B | P1 |

### Phase 5 (Months 25–30)

| Feature | Module | Notes |
|---------|--------|-------|
| Personalized email prioritization | Mail | Per-user fine-tuning |
| Writing style learning | Mail | User-specific model |
| Predictive scheduling | Calendar | ML on historical patterns |
| Sentiment analysis (chat) | Chat | Team health monitoring |
| AI-generated reports | Admin | Automated weekly digests |
| On-premise AI option | Infra | For Enterprise plan |

---

## 5. AI Cost Management

### 5.1 Cost Estimates (per 1,000 requests)

| Feature | Model | Est. Tokens/Request | Est. Cost (USD) |
|---------|-------|---------------------|-----------------|
| Email summarization | GPT-4o | 2,000 | $0.10 |
| Smart reply (mail) | Llama 70B | 500 | $0.01 |
| Smart compose | Llama 70B | 300 | $0.006 |
| Chat summary | GPT-4o | 3,000 | $0.15 |
| Translation | GPT-4o | 400 | $0.02 |
| Categorization | DistilBERT | — | $0.001 |
| Meeting notes | GPT-4o | 8,000 | $0.40 |
| AI search | GPT-4o | 1,000 | $0.05 |

### 5.2 Cost Controls

```
Per-tenant AI budget:
  - Monthly token budget per tenant (by plan)
  - Basic: $5/month AI budget
  - Standard: $20/month
  - Professional: $100/month
  - Enterprise: custom

On budget exhaustion:
  - Disable AI features for remainder of month
  - Notify tenant admin at 80% and 100%
  - Option: purchase additional AI credits

Caching to reduce costs:
  - Email summaries: cached per thread (invalidated on new message)
  - Document summaries: cached per file version
  - Smart replies: cached per message (same message → same suggestions)
  - Cache TTL: 24 hours
  - Cache hit rate target: > 40%

Model fallback for cost:
  - If GPT-4o cost > threshold → fallback to Llama 70B
  - Configurable per feature per tenant plan
```

---

## 6. AI Governance

### 6.1 Responsible AI Principles

| Principle | Implementation |
|-----------|----------------|
| Transparency | Every AI output labeled "AI-generated" or "AI-assisted" |
| Human control | All AI outputs are suggestions; no autonomous actions |
| Privacy | Tenant data isolation, PII scrubbing (Phase 4), consent required |
| Fairness | No personalization based on protected characteristics |
| Accuracy | Confidence scores shown; low-confidence outputs flagged |
| Auditability | All AI calls logged with prompt hash, model, response |

### 6.2 AI Feature Flags

```
All AI features controlled by feature flags:
  - Global flag (Super Admin): enable/disable per feature platform-wide
  - Tenant flag (Tenant Admin): enable/disable per feature for tenant
  - User flag (User): opt out of AI features entirely

Feature flag schema:
  ai_feature_flags
    tenant_id       UUID FK
    feature         TEXT    -- 'mail.smart_reply' | 'chat.summary' | etc.
    enabled         BOOLEAN
    updated_by      UUID FK
    updated_at      TIMESTAMPTZ

Evaluation order:
  Global disabled → feature off for everyone
  Global enabled + Tenant disabled → off for tenant
  Global enabled + Tenant enabled + User opted out → off for user
  All enabled → feature on
```

### 6.3 AI Incident Response

```
If AI feature produces harmful/incorrect output:
  1. User reports via "Report AI output" button (every AI response has this)
  2. Report stored: ai_feedback { userId, feature, outputHash, reason, createdAt }
  3. Auto-disable feature if report rate > 1% in 24h
  4. Engineering review within 24h
  5. Fix: prompt update, model change, or feature disable
  6. Post-incident: notify affected tenants

Monitoring:
  - AI error rate per feature (target < 0.1%)
  - User rejection rate (user edits/dismisses AI suggestion)
  - Latency p95 per feature (target < 2s for all features)
  - Cost per feature per day
```

### 6.4 Model Update Policy

```
When updating a model (e.g. GPT-4o → GPT-4o-mini):
  1. A/B test: 10% traffic to new model for 7 days
  2. Compare: output quality score (human eval sample), latency, cost
  3. If quality maintained and cost reduced → full rollout
  4. If quality degraded → revert

Prompt changes:
  - All prompts versioned in code (not DB)
  - Prompt change requires: PR review + staging test
  - Rollback: revert PR
```

---

*Part 02 of 02 — D9 AI Roadmap Complete*
