# DelegatLabs Lawyer Agent — Project Requirements

**Product:** DelegatLabs Lawyer Agent  
**Version focus:** V1 guided drafting + V1.5 case-aware foundation  
**Primary jurisdiction:** Uttar Pradesh (India), with English and Hindi support  
**Last updated:** 2026-07-19  

This document consolidates functional, non-functional, technical, and safety requirements for the Lawyer Agent monorepo. It is derived from the master product blueprint, implementation roadmap, schema specifications, export architecture, and the current codebase in `apps/web` and `apps/api`.

Related docs:

- [Master Product Blueprint](lawyer-agent/00_Master_Product_Blueprint.md)
- [Implementation Roadmap](lawyer-agent/01_Implementation_Roadmap.md)
- [Export Architecture](lawyer-agent/08_Export_Architecture.md)
- [Print Testing Protocol](lawyer-agent/09_Print_Testing.md)
- [Schema Specifications (Level 13)](lawyer-agent/10_Level_13_Schema_Specifications.md)

---

## 1. Purpose and problem statement

### 1.1 Purpose

Build an AI-assisted **legal drafting and briefing product** for solo advocates and small Indian law firms. The system must behave as an **AI Junior Associate**: it compiles structured drafts from guided intake, checks completeness and formatting, and leaves final verification to the advocate.

### 1.2 Problem

Open-ended chatbot drafting is unreliable for non-technical legal users. Advocates need:

- Predictable, section-based document workflows
- Jurisdiction-aware templates (starting with UP)
- Dual-language UI and draft output (English / Hindi)
- Case context that pre-fills party and litigation facts
- Clear warnings when facts or legal sources are missing (no silent hallucination)

### 1.3 Success criteria (product-level)

| ID | Criterion |
|----|-----------|
| S1 | An advocate can select UI language, choose a draft type, complete a guided wizard, and generate a printable draft without writing free-form prompts. |
| S2 | Incomplete or inconsistent facts block generation until fixed, with actionable validation messages. |
| S3 | English and Hindi are supported for both interface labels and draft output language. |
| S4 | Generated drafts are review-first: nothing is auto-filed or auto-sent to courts or clients. |
| S5 | Case records can drive drafting suggestions and pre-fill intake fields. |

---

## 2. Target users and personas

| Persona | Description | Primary needs |
|---------|-------------|---------------|
| Solo advocate | Practices in district / high court, limited support staff | Fast day-to-day drafts, hearing-linked reminders, bilingual output |
| Small firm associate | Drafts under senior review | Guided intake, completeness checks, consistent structure |
| Senior advocate (reviewer) | Final verification before use | Clear warnings, editable draft text, print/export fidelity |

**Primary geography:** Uttar Pradesh courts and forums (High Court, district/lower courts, rent control, consumer forum, etc.), with room to expand later.

---

## 3. Core product principles (must follow)

| ID | Principle | Requirement |
|----|-----------|-------------|
| P1 | Dynamic wizard over chat | Users build documents via metadata-driven **Draft Blueprints** and section steppers, not open-ended chat as the default UX. |
| P2 | AI Junior Associate | System drafts and validates; advocate owns final legal responsibility. |
| P3 | Dual-language interoperability | Independent controls: UI language (EN/HI) and draft output language (EN/HI). |
| P4 | No legal hallucination | If required facts or verified rules are missing, show warnings and **block** unsafe compilation where configured. |
| P5 | Case-aware contextual drafting | Saved cases pre-fill deponent/litigation variables into drafting sessions. |
| P6 | Drafting-first single path | V1 user experience must default to Guided Drafting. Future modules (Document Review, Legal Research, Client Portal, WhatsApp outbound UI, Calendar, Voice) must **not** appear as selectable primary options until ready. |

---

## 4. Scope

### 4.1 In scope (V1 / V1.5)

1. **Mode 1 — Guided Legal Drafting**
   - Draft catalog registry
   - Blueprint-driven intake wizard
   - Completeness validation
   - Advocate custom directives / clause selection
   - Prompt compilation and AI draft generation
   - Draft preview, structural audit, browser print
2. **Active case saving** (local and eventually server-backed)
3. **Party side selection** and client marker
4. **Case → draft** linking, suggestions by stage, and intake prefill
5. **Schema foundation** for drafting + cases + reminders (Supabase migrations)
6. **Multi-provider AI router** with safe default (mock) and pluggable Gemini / Claude / OpenAI

### 4.2 Explicitly out of scope (early V1)

Unless separately scheduled in later roadmap levels:

- Client Portal
- Full Matter Management suite beyond active-case CRUD
- Legal Research / RAG citation verification (beyond warning tags)
- OCR of scanned PDFs as a certified pipeline (Level 16 is planned)
- Auto-filing to e-courts
- Direct messaging of clients or opposing parties
- Certified court-filing layout for UP stamps/margins (preview is review-only)

---

## 5. Functional requirements

### 5.1 Language and onboarding

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-L1 | First visit must present a language selection for UI: English or Hindi. | Must |
| FR-L2 | UI language preference must persist across sessions (local cache initially; account settings later). | Must |
| FR-L3 | Draft output language must be selectable independently of UI language during intake / catalog flow. | Must |
| FR-L4 | Catalog entries must support bilingual titles/descriptions where provided. | Should |

### 5.2 Dashboard and navigation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-D1 | Dashboard must prioritize Guided Drafting as the primary action. | Must |
| FR-D2 | Dashboard must provide entry points to draft catalog and case list. | Must |
| FR-D3 | Recent drafts (or local draft session history) should be visible when available. | Should |
| FR-D4 | Incomplete future modules must not be presented as equal primary modes. | Must |

### 5.3 Draft catalog

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C1 | Maintain a metadata-driven catalog of draft types with category, jurisdiction hints, language flags, and availability status. | Must |
| FR-C2 | Users can search and filter drafts by category. | Must |
| FR-C3 | Drafts without an implemented blueprint must show a clear “coming soon” / unavailable state and not enter a broken wizard. | Must |
| FR-C4 | Catalog integrity checks (duplicate IDs, missing metadata) should run in development/QA tooling. | Should |

**Catalog categories (required coverage over product life):**

- Agreements (e.g. rent, leave & license, sale, partnership, loan, NDA)
- Notices (general, cheque bounce, recovery, eviction, breach, consumer)
- Family / civil petitions (mutual divorce, maintenance, custody)
- Criminal (bail, anticipatory bail, complaint)
- Affidavits and power of attorney
- **Day-to-day court drafts** (affidavits subtypes, lower-court applications, high-court utilities, criminal miscellaneous inputs)

### 5.4 Draft blueprints and guided intake

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-B1 | Each supported draft type must have a **Draft Blueprint** defining sections, fields (required / recommended / optional), clauses, validation rules, and a review checklist. | Must |
| FR-B2 | Intake must be a multi-step section wizard driven by the blueprint (not free-form chat). | Must |
| FR-B3 | Progress (answers + current step) must auto-save so users can resume. | Must |
| FR-B4 | Customize step must allow advocate directives / optional clause toggles defined by the blueprint. | Must |
| FR-B5 | V1 reference implementation: **Rent Agreement** blueprint must be fully end-to-end. | Must |
| FR-B6 | Additional catalog items marked “available” require blueprints before they leave “coming soon” behavior. | Must |

### 5.5 Completeness validation engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-V1 | Before AI generation, run completeness checks against required fields and hard rules. | Must |
| FR-V2 | Block generation when `isReadyForGeneration` (or equivalent) is false; show actionable deficiencies. | Must |
| FR-V3 | Surface soft warnings for recommended fields without necessarily blocking. | Should |
| FR-V4 | Hard rules must cover identity consistency (e.g. distinct party names), money/date logic, jurisdiction, witnesses, and draft language where applicable. | Must |

### 5.6 Prompt compilation and AI generation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A1 | Compile a structured prompt from answers, clauses, anti-hallucination guardrails, and output requirements. | Must |
| FR-A2 | Support a prompt preview screen so the advocate can inspect/adjust intent before generation. | Must |
| FR-A3 | Backend must expose draft generation via API (`POST /api/v1/ai/generate-draft`). | Must |
| FR-A4 | AI router must support multiple providers (mock, OpenAI, Gemini, Claude) with availability reporting. | Must |
| FR-A5 | Default provider in development must be safe (`mock`) when real keys are absent. | Must |
| FR-A6 | Provider API keys must live only in backend environment configuration — never in client bundles. | Must |
| FR-A7 | Real providers (OpenAI / Gemini / Claude) must implement generation once enabled; stubs must not silently return fake “success” without disclosure. | Must |

### 5.7 Draft preview, audit, print, and export

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-E1 | After generation, show a document preview sheet plus structural audit results. | Must |
| FR-E2 | Post-generation validator must check non-empty text, presence of key facts, clause heuristics, and unresolved placeholders. | Must |
| FR-E3 | Advocate must be able to edit draft text before print/export. | Must |
| FR-E4 | **V1 export:** browser print using `@media print`, hiding chrome (nav, buttons, warnings, validation cards) and retaining document sheet only. | Must |
| FR-E5 | Print output should target readable A4-like margins, fonts, and paragraph spacing. | Must |
| FR-E6 | Preview must display a pre-print review notice: layout is **not** certified for direct UP court filing without manual review. | Must |
| FR-E7 | Future DOCX/PDF export must accept final advocate-edited text from the client and must **not** re-run AI generation (no double billing). | Should (future) |
| FR-E8 | Future export API stores files (e.g. Supabase Storage) and returns a download URL. | Should (future) |

### 5.8 Active case management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-K1 | Advocates can create, list, view, edit, archive, and delete active cases. | Must |
| FR-K2 | Case identification fields: Case Title, Case Type, Case Number, CNR Number. | Must |
| FR-K3 | Litigation forum fields: Court Type, Court Name, Court Number / Room / Floor. | Must |
| FR-K4 | Court Type must support: High Court, District Court, Lower Court, Civil Court, Criminal Court, Family Court, Tribunal, Rent Control Authority, Consumer Forum, Other (manual entry / autocomplete). | Must |
| FR-K5 | Criminal / statutory fields: FIR Number, Police Station, Sections / U/S. | Must |
| FR-K6 | Hearing timeline: Stage, Remarks, Previous Date, Next Date / Date Fixed. | Must |
| FR-K7 | Tasks & orders: FOF (Further Order / Future Action), Next Action. | Must |
| FR-K8 | Client identifiers: Client Name, Client Mobile, Raw Notes. | Must |
| FR-K9 | Case status values: `active`, `disposed`, `archived`. | Must |

### 5.9 Party side selection

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-P1 | Each case must define Side A and Side B with party name and legal role. | Must |
| FR-P2 | Advocate must mark **Our Client** as Side A or Side B. | Must |
| FR-P3 | Supported roles: Petitioner, Respondent, Plaintiff, Defendant, Complainant, Accused, Applicant, Opposite Party, Appellant, Revisionist, Tenant, Landlord, State, Other. | Must |
| FR-P4 | Drafting tone/impact must reflect client posture (seeking relief vs defending/replying) when blueprints support it. | Should |

### 5.10 Rough case notes extraction

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-N1 | Advocates can paste raw hearing notes to propose structured case fields. | Should (Level 16) |
| FR-N2 | Flow: Paste notes → AI JSON extraction → lawyer review/correct → save case. | Should |
| FR-N3 | Persist `raw_notes`, `extracted_data` (JSONB), `extraction_confidence`, `review_status` (`needs_review` \| `reviewed` \| `confirmed`). | Should |

### 5.11 Case-aware drafting

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CD1 | From a case, user can create a draft that pre-fills known facts into intake answers. | Must |
| FR-CD2 | System suggests draft types by case stage (e.g. Final Arguments → written submissions; Bail → bail/surety/exemption; Evidence → evidence affidavit / lists). | Should |
| FR-CD3 | Links between cases and draft sessions / generated drafts must be persistable (`case_draft_links`). | Must (schema); Should (UI) |

### 5.12 Outbound WhatsApp assistant (future)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-W1 | WhatsApp is **outbound-only** to the advocate: hearing schedules, upcoming dates, pending drafting tasks, status reminders, suggested templates. | Could |
| FR-W2 | Must not read client chats, auto-send filings, or message clients/opposing parties without explicit advocate approval. | Must (when built) |

### 5.13 Calendar and voice (future)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CV1 | Calendar sync for case dates, hearing schedules, and tomorrow prep sheet. | Could |
| FR-CV2 | Voice reminders summarizing schedules. | Could |

### 5.14 Authentication and accounts (planned)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AU1 | Custom OAuth2 + JWT (access + refresh tokens) for advocate accounts. | Must (Level 14+) |
| FR-AU2 | Sign-up / sign-in flows; persist auth state in the Next.js client. | Must (Level 14+) |
| FR-AU3 | Roles such as `advocate` and `associate` on user records. | Should |

### 5.15 Backend API surface (baseline)

| ID | Endpoint | Requirement |
|----|----------|-------------|
| FR-API1 | `GET /api/v1/health` | Service health response. |
| FR-API2 | `GET /api/v1/drafting/status` | Drafting module readiness. |
| FR-API3 | `POST /api/v1/ai/generate-draft` | Generate draft from compiled payload. |
| FR-API4 | `GET /api/v1/ai/providers/status` | Provider availability. |
| FR-API5 | Future: auth, cases CRUD, draft sessions, export DOCX/PDF | Per roadmap Levels 14–17. |

CORS must allow the configured frontend origin (default `http://localhost:3000`).

---

## 6. Data and schema requirements

Persistence target: **Supabase PostgreSQL** with JSONB for flexible metadata. All core tables require audit timestamps, foreign keys, and indexes as appropriate.

### 6.1 Core drafting tables

| Table | Purpose |
|-------|---------|
| `users` | Advocate accounts (`email`, `password_hash`, `full_name`, `role`) |
| `draft_blueprints` | Template registry (`draft_type`, `title`, `metadata` JSONB) |
| `draft_sessions` | Intake state (`answers` JSONB, `status`, `current_step`) |
| `generated_drafts` | Final texts (`draft_text`, `provider`, `model`, `generation_id`, `status`) |

### 6.2 Case management tables

| Table | Purpose |
|-------|---------|
| `cases` | Lawsuit tracker (identification, court, FIR, timeline, FOF, notes, extraction, status) |
| `case_parties` | Side A/B/Other, roles, client flag, contact |
| `case_dates` | Hearing history |
| `case_tasks` | In-office tasks (`pending` / `in_progress` / `completed`) |
| `case_notes` | Chronological memos |
| `case_draft_links` | Case ↔ draft session / generated draft relationships |

### 6.3 Reminders and integrations

| Table | Purpose |
|-------|---------|
| `reminders` | Scheduled notifications (`whatsapp` / `email` / `sms`) |
| `notification_preferences` | Per-user channel settings |
| `notification_logs` | Delivery audit |
| `integration_accounts` | Provider tokens (WhatsApp, Google Calendar, etc.) |

### 6.4 Interim persistence

Until Level 14 wiring is complete, the web app may store draft sessions and cases in **browser localStorage**. Server migration must not drop the product principles above; local behavior is a stepping stone, not the long-term contract.

---

## 7. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Reliability | Validation and generation failures must fail visibly with clear messages; no silent empty success. |
| NFR-2 | Security | Secrets and LLM API keys only on the server; HTTPS in production; auth tokens handled securely. |
| NFR-3 | Privacy | Client and opposite-party PII stay under advocate control; no auto-outbound to third parties. |
| NFR-4 | Performance | Intake UX must feel local-fast; AI generation may be asynchronous/blocking with loading state. |
| NFR-5 | Accessibility | Forms and wizards usable via keyboard; adequate contrast on light-themed UI. |
| NFR-6 | Internationalization | Hindi and English strings for core drafting and cases flows. |
| NFR-7 | Maintainability | Monorepo separation: `apps/web`, `apps/api`, `packages/*`, `infra/supabase`, `docs/`. |
| NFR-8 | Observability | Health endpoint at minimum; notification logs for outbound channels when enabled. |
| NFR-9 | Compatibility | Modern Chromium/WebKit/Firefox; print path verified per print testing protocol. |

---

## 8. Technical stack requirements

| Layer | Requirement |
|-------|-------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS; UI component patterns as used in `apps/web` |
| Backend | FastAPI (Python 3.10+), Pydantic Settings, Uvicorn |
| Database | Supabase PostgreSQL + JSONB; migrations under `infra/supabase/migrations/` |
| Auth (planned) | Custom OAuth2 + JWT (access + refresh) |
| AI | Backend multi-provider router: Mock (required), OpenAI / Gemini / Claude (optional when keyed) |
| Tooling | npm workspaces monorepo; Python `requirements.txt` for API |

### 8.1 Runtime configuration (API)

Environment variables (see `apps/api/.env.example`):

- `APP_NAME`, `APP_ENV`
- `FRONTEND_ORIGIN`
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `CLAUDE_API_KEY`
- `AI_DEFAULT_PROVIDER` (default: `mock`)

---

## 9. Safety, legal, and compliance requirements

| ID | Requirement |
|----|-------------|
| SAF-1 | **Review-first:** No auto-generated court filings or auto-submission. |
| SAF-2 | Unverified CrPC → BNSS (or similar) mappings must show an **Unverified** warning until official RAG/source lookup exists. |
| SAF-3 | WhatsApp module must never message clients or opposing parties without explicit advocate approval. |
| SAF-4 | API keys never shipped to the browser. |
| SAF-5 | UI must state that print/preview is for review and is not a certified UP court filing format. |
| SAF-6 | Anti-hallucination: prefer warnings/blocks over inventing statutes, citations, or facts. |

---

## 10. User journeys (acceptance scenarios)

### 10.1 Happy path — Rent Agreement (V1 must-pass)

1. Select UI language (EN or HI).
2. Open dashboard → New Draft → select Rent Agreement.
3. Review plan → complete intake sections → customize clauses.
4. Completeness engine reports ready (or user fixes blocking issues).
5. Review compiled prompt → generate draft via API.
6. Preview shows document + audit; edit if needed.
7. Print Draft: print dialog shows **only** the document sheet.
8. Optional: save case first, then create draft from case with prefilled parties/property where applicable.

### 10.2 Blocked generation

1. Leave required party or rent fields empty.
2. Completeness step must refuse generation and list deficiencies.
3. After fixing, generation becomes available.

### 10.3 Case record

1. Create case with court type, CNR/case number, parties A/B, client side.
2. Edit timeline and next action.
3. From case, open suggested / new draft flow and verify prefill behavior for supported blueprints.

---

## 11. Implementation roadmap mapping

| Level | Theme | Requirement linkage |
|-------|-------|---------------------|
| 0–3 | Monorepo, lint, API skeleton, Next.js shell | NFR-7, FR-API1 |
| 4–6 | Dashboard, catalog, blueprint framework | FR-D*, FR-C*, FR-B* |
| 7–9 | Intake wizard, completeness, prompt preview | FR-B2–B4, FR-V*, FR-A1–A2 |
| 10–12 | AI mock router, preview auditor, print | FR-A3–A6, FR-E1–E6 |
| 13 | Supabase schema (drafting + cases + reminders) | Section 6 |
| 14 | Supabase client + auth persistence | FR-AU* |
| 15 | Case management module + drafting links | FR-K*, FR-P*, FR-CD* |
| 16 | Hearing notes OCR / AI parse | FR-N* |
| 17 | Outbound WhatsApp scheduler | FR-W* |

---

## 12. Current implementation snapshot (for requirements tracking)

This section is descriptive of the codebase as of the date above; it is not a reduction of the requirements.

| Area | Status |
|------|--------|
| Guided drafting E2E | Implemented for **Rent Agreement** (localStorage + mock AI) |
| Draft catalog | ~60 catalog entries; many “coming soon”; one full blueprint |
| Completeness + prompt + preview/print | Implemented for rent flow |
| Case CRUD + suggestions + prefill | Implemented in browser localStorage UI |
| Auth | Not implemented |
| Live database | Schema migration present; not wired to app |
| Real LLM providers | Stubs; mock provider works |
| DOCX/PDF server export | Planned / stubs only |

---

## 13. Priority legend

| Priority | Meaning |
|----------|---------|
| **Must** | Required for product acceptance of the relevant release. |
| **Should** | Expected soon after; strong product value. |
| **Could** | Nice-to-have / later phases. |

---

## 14. Open decisions / follow-ups

1. Order of remaining blueprints after Rent Agreement (bail, affidavits, notices, etc.).
2. ORM choice for Level 14 (Prisma vs direct Supabase client in FastAPI).
3. Production auth provider details (pure custom JWT vs hybrid with Supabase Auth).
4. When bilingual (HI) draft quality gates become mandatory for non-rent templates.
5. Certified court formatting pack timing for UP filings (post–browser-print V1).
