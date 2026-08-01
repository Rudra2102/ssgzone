# D9 — AI Roadmap | Part 01: Foundations, Mail AI & Chat AI

## 1. Strategic Context

AI features in SSGzone serve one purpose: reduce communication overhead for users inside SaaS-powered organizations. Every AI feature must be:
- **Opt-in**: no AI processing without explicit user/tenant consent
- **Tenant-isolated**: no cross-tenant data leakage in any AI pipeline
- **Explainable**: user can see why a suggestion was made
- **Overridable**: AI output is always a suggestion, never an action without confirmation

AI is a Phase 3+ investment. Phases 1 and 2 focus on core infrastructure. AI features are layered on top of a stable, data-rich platform.

---

## 2. AI Infrastructure

### 2.1 Model Strategy

SSGzone uses a hybrid model approach — not a single vendor lock-in.

| Tier | Model | Use Case | Hosting |
|------|-------|----------|---------|
| Tier 1 — Cloud LLM | OpenAI GPT-4o / Claude 3.5 Sonnet | Complex generation, summarization | API (per-call cost) |
| Tier 2 — Hosted OSS | Llama 3.1 70B (via Groq/Together) | Mid-complexity tasks, lower cost | API |
| Tier 3 — Self-hosted | Llama 3.1 8B (on-prem GPU) | High-volume, latency-sensitive | Own infra (Phase 4) |
| Embeddings | text-embedding-3-small (OpenAI) | Semantic search, similarity | API |
| Classification | Fine-tuned DistilBERT | Spam, intent, category | Self-hosted |

Model selection per feature is documented in Section 3–5.

### 2.2 AI Service Architecture

```
Client Request
  │
  ▼
[API Server — AI Module]
  │
  ├── Check: tenant AI features enabled
  ├── Check: user AI consent
  ├── Retrieve: context (messages, user profile, tenant data)
  ├── Build: prompt with context
  │
  ▼
[AI Gateway — internal service]
  │
  ├── Route to appropriate model (by feature + cost tier)
  ├── Apply: prompt templates
  ├── Apply: tenant-specific instructions (system prompt injection)
  ├── Rate limit: per tenant, per feature
  ├── Log: AI usage (tokens, cost, latency)
  │
  ▼
[LLM Provider API]
  │
  ▼
[Response → post-process → return to client]
```

### 2.3 Data Privacy in AI Pipeline

```
Rules:
  1. No user data sent to LLM APIs without tenant AI consent
  2. PII scrubbing before sending to cloud LLMs (Phase 4):
     - Names → [PERSON]
     - Phone numbers → [PHONE]
     - Aadhaar/PAN → [ID_NUMBER]
     - Email addresses → [EMAIL] (except sender/recipient context)
  3. Tenant data never mixed in shared prompts
  4. AI logs (prompts + responses) stored per-tenant, encrypted
  5. AI log retention: 30 days (configurable)
  6. Self-hosted models (Phase 4): no data leaves SSGzone infra

Consent model:
  - Tenant Admin enables AI features for the tenant
  - User can opt out of AI features individually
  - Opt-out stored: users.ai_consent = false
  - On opt-out: all AI features disabled for that user
```

### 2.4 AI Usage Tracking

```sql
ai_usage_logs
  id              UUID PK
  tenant_id       UUID FK
  user_id         UUID FK
  feature         TEXT    -- 'mail.compose_assist' | 'chat.summary' | etc.
  model           TEXT    -- 'gpt-4o' | 'llama-3.1-70b'
  prompt_tokens   INTEGER
  completion_tokens INTEGER
  latency_ms      INTEGER
  cost_usd        NUMERIC(10,6)
  created_at      TIMESTAMPTZ

ai_usage_daily   -- aggregated for billing/analytics
  tenant_id, date, feature, model,
  total_requests, total_tokens, total_cost_usd
```

---

## 3. Mail AI Features

### 3.1 Smart Compose (Phase 3)

Autocomplete suggestions as the user types an email body.

```
Trigger: user pauses typing for 1.5s with cursor at end of sentence

Input to AI:
  - Email subject
  - Current body text (up to 500 tokens)
  - Recipient name/role (from contacts/directory)
  - User's writing style (last 20 sent emails, summarized)
  - Tone preference: formal | neutral | casual

Model: Tier 2 (Llama 3.1 70B) — low latency required

Prompt template:
  "You are helping {user_name} write a professional email.
   Subject: {subject}
   Recipient: {recipient_name} ({recipient_role})
   Current draft: {body}
   Continue the email naturally in {tone} tone.
   Provide 1 short continuation (max 2 sentences).
   Do not add a closing or signature."

Response: 1–2 sentence suggestion
UI: ghost text after cursor, Tab to accept, Esc to dismiss

API:
  POST /api/v1/ai/mail/compose-suggest
  { subject, body, recipientId, tone }
  → { suggestion: "...", model: "llama-3.1-70b", latencyMs: 320 }
```

### 3.2 Email Summarization (Phase 3)

Summarize long email threads into key points.

```
Trigger: user clicks "Summarize thread" button on thread with > 5 messages

Input to AI:
  - All messages in thread (sender, timestamp, body)
  - Max context: 8,000 tokens (truncate oldest if needed)

Model: Tier 1 (GPT-4o) for quality, Tier 2 as fallback

Prompt template:
  "Summarize this email thread in 3–5 bullet points.
   Focus on: decisions made, action items, key information.
   Format: bullet list. Be concise.
   Thread: {thread_json}"

Response format:
  {
    summary: ["• Decision: ...", "• Action: ...", "• Key info: ..."],
    actionItems: [{ owner: "Priya", task: "Send report by Friday" }],
    generatedAt: "ISO8601"
  }

UI: collapsible panel above thread, "AI Summary" label
Cached: per thread, invalidated when new message arrives

API:
  POST /api/v1/ai/mail/summarize
  { threadId }
  → { summary[], actionItems[], model, latencyMs }
```

### 3.3 Smart Reply (Phase 3)

3 one-click reply suggestions for received emails.

```
Trigger: user opens an email (auto-generated, shown below email)

Input to AI:
  - Last message in thread (sender, body)
  - Thread context (previous 3 messages)
  - User role/name

Model: Tier 2 (Llama 3.1 70B)

Prompt template:
  "Generate 3 short reply options for this email.
   Each reply: 1–2 sentences, different tones (agree/neutral/decline or short/detailed/question).
   Email: {last_message}
   Respond as: {user_name} ({user_role})
   Format: JSON array of 3 strings."

Response:
  { replies: ["Sure, I'll get that done by EOD.", "Could you clarify the deadline?", "I'll need more time for this."] }

UI: 3 chips below email body, click → opens compose with reply pre-filled
User can edit before sending

API:
  POST /api/v1/ai/mail/smart-reply
  { messageId }
  → { replies: string[], model, latencyMs }
```

### 3.4 Email Categorization & Priority (Phase 3)

Auto-label and prioritize incoming mail.

```
Trigger: on mail delivery (async, post-delivery)

Input to AI:
  - Subject, sender, body preview (first 200 words)
  - Sender's relationship to user (contact, colleague, unknown)
  - Historical: has user replied to this sender before?

Model: Tier 3 (fine-tuned DistilBERT classifier) — high volume, must be fast

Categories:
  important     ← action required, deadline mentioned
  newsletter    ← bulk/marketing content
  notification  ← automated system emails
  social        ← social network notifications
  finance       ← invoices, receipts, bank alerts
  travel        ← booking confirmations, itineraries
  update        ← software updates, changelogs

Priority score: 0.0–1.0
  > 0.8 → mark as important, move to top of inbox
  0.5–0.8 → normal
  < 0.5 → deprioritize

API (internal):
  POST /internal/ai/mail/categorize
  { messageId, subject, senderEmail, bodyPreview }
  → { category, priority, confidence }

User can correct: "Not important" → feeds back to personalization model
```

### 3.5 Vacation Reply Generator (Phase 3)

```
Trigger: user enables vacation reply, clicks "Generate with AI"

Input:
  - Vacation start/end dates
  - User name, role
  - Optional: reason (conference, holiday, medical)

Model: Tier 2

Output: draft vacation reply message
User edits and saves

API:
  POST /api/v1/ai/mail/vacation-reply
  { startDate, endDate, reason }
  → { draft: "Hi, I'm out of office from..." }
```

---

## 4. Chat AI Features

### 4.1 Conversation Summary (Phase 3)

Summarize a chat channel or DM thread.

```
Trigger: user clicks "Summarize" in channel header (channels with > 50 messages)

Input:
  - Last N messages (configurable, default 100, max 500)
  - Participant names

Model: Tier 1 (GPT-4o) for channels, Tier 2 for DMs

Prompt:
  "Summarize this chat conversation in 3–5 bullet points.
   Highlight: decisions, action items, unresolved questions.
   Participants: {names}
   Messages: {messages_json}"

Response:
  { summary[], actionItems[], unresolvedQuestions[], generatedAt }

UI: modal overlay, "AI Summary" header, copy button
Not cached (generated on demand)

API:
  POST /api/v1/ai/chat/summarize
  { conversationId, messageCount: 100 }
  → { summary[], actionItems[], unresolvedQuestions[], model, latencyMs }
```

### 4.2 Smart Reply in Chat (Phase 3)

```
Trigger: user opens a DM or is @mentioned in a channel

Input:
  - Last 10 messages in conversation
  - User's name/role

Model: Tier 2 (fast, low latency)

Response: 3 short reply chips (max 8 words each)
Examples: "On it!", "Can we discuss this?", "Sounds good to me."

UI: 3 chips above chat input, click → fills input (user can edit)
Auto-dismissed after 30s or on typing

API:
  POST /api/v1/ai/chat/smart-reply
  { conversationId, lastMessageId }
  → { replies: string[] }
```

### 4.3 Message Translation (Phase 3)

```
Trigger: user clicks "Translate" on a message (shown if message language ≠ user locale)

Input: message content, target language (from user profile locale)

Model: Tier 1 (GPT-4o) — quality matters for translation

Response: translated text shown inline below original
"Translated from Hindi · Show original"

API:
  POST /api/v1/ai/chat/translate
  { messageId, targetLanguage: "en" }
  → { translation: "...", sourceLanguage: "hi", model }
```

### 4.4 AI Search Assistant (Phase 4)

Natural language search across all modules.

```
Trigger: user types a question in global search instead of keywords
Detection: query contains question words (what, when, who, find, show me)

Input:
  - User's natural language query
  - User's tenant context (role, department)

Flow:
  1. LLM converts query to structured search parameters
     "Show me emails from Priya about the budget last month"
     → { scope: "mail", from: "priya@*", keywords: "budget", dateFrom: "2024-01-01", dateTo: "2024-01-31" }
  2. Execute structured search (existing search API)
  3. LLM generates a natural language answer from top results
     "I found 3 emails from Priya about the budget in January..."

Model: Tier 1 (query understanding + answer generation)

API:
  POST /api/v1/ai/search
  { query: "Show me emails from Priya about budget last month" }
  → { answer: "...", results: [...], structuredQuery: {...} }
```

---

*Part 01 of 02 — Next: Calendar AI, Drive AI, Admin AI, Roadmap Timeline & Governance*
