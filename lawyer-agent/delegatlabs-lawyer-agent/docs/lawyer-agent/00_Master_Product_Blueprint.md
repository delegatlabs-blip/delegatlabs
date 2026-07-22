# Master Product Blueprint: DelegatLabs Lawyer Agent V1.5

## Executive Summary
DelegatLabs Lawyer Agent is a **case-aware legal drafting and briefing assistant** tailored for solo advocates and small law firms in India. The initial focus is on **Uttar Pradesh (UP)** jurisdictions, with native support for both **English** and **Hindi** interface languages and output drafts.

Advocates can track active cases, link draft templates directly to case records, pre-fill deponent details from saved client records, and receive structured briefings.

---

## Core Product Principles
1. **Dynamic Wizard over Chat**: Instead of prompting open chatbots, users compile documents using section-based intake wizards generated from structured **Draft Blueprints**.
2. **AI Junior Associate Model**: The agent handles raw legal document compiling, checks for formatting consistency and completeness, while reserving final verification for the senior advocate.
3. **Dual-Language Interoperability**: Support for switching UI language (English/Hindi) and choosing the output draft language (English/Hindi).
4. **No Legal Hallucination**: Fallback logic ensures that if core facts or local legal rules are absent, the system displays warning alerts and blocks compilation.
5. **Case-Aware Contextual Drafting**: Drafting metadata automatically pre-fills deponent and litigation variables from saved cases, saving time.
6. **Single-Path Drafting-First User Experience**: V1 user-facing experience must be single-path and drafting-first. Guided Drafting is the default workflow. Future modules (such as Document Review, Legal Research, Matter Management, Client Portal, WhatsApp Outbound, Calendar, or Voice Agent) should not be shown as selectable user options in the UI until they are ready and necessary.

---

## Technical Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: FastAPI (Python 3.10+), Pydantic v2, Supabase client.
- **Database**: Supabase PostgreSQL with JSONB schema columns (storing custom fields and dynamic metadata).
- **Authentication**: Custom OAuth2 + JWT (Access + Refresh tokens).
- **AI Routing**: Multi-model integration (Gemini, Claude, GPT) with robust backend router.

---

## Product Modules (Expanded V1.5 Scope)

### 1. Active Case Saving Module
Lawyers can manually record active litigation. Each case record tracks the following attributes:
* **Identification Details**: Case Title, Case Type, Case Number, CNR Number.
* **Litigation Forums**:
  * Court Type: *High Court, District Court, Lower Court, Civil Court, Criminal Court, Family Court, Tribunal, Rent Control Authority, Consumer Forum, Other* (supports manual entry and autocomplete suggestions).
  * Court Name, Court Number / Room / Floor.
* **Criminal/Statutory Reference**: FIR Number, Police Station, Sections / U/S.
* **Hearing Timeline**: Stage, Remarks, Previous Date, Next Date / Date Fixed.
* **Tasks & Orders**: FOF (Further Order / Future Action), Next Action.
* **Client Identifiers**: Client Name, Client Mobile, Raw Notes.

### 2. Party Side Selection
While saving a case, the advocate defines both parties and marks their client:
* **Side A**: Party Name, Legal Role.
* **Side B**: Party Name, Legal Role.
* **Our Client**: Side A or Side B.
* **Roles supported**: *Petitioner, Respondent, Plaintiff, Defendant, Complainant, Accused, Applicant, Opposite Party, Appellant, Revisionist, Tenant, Landlord, State, Other*.
* **Drafting Impact**:
  * If client is Petitioner/Applicant: Drafts seek relief, present prayers, and outline initial grievances.
  * If client is Respondent/Accused/Defendant: Drafts defend, oppose, or reply to notices.

### 3. Rough Case Notes Extraction
Advocates can paste raw notes from court hearings to auto-populate cases:
* **Extraction Flow**: Paste Notes → AI compiles JSON data → Lawyer reviews/corrects → Save Active Case.
* **Saved Attributes**: `raw_notes`, `extracted_data` (JSONB), `extraction_confidence`, `review_status` (*needs_review, reviewed, confirmed*).

### 4. Day-to-Day Drafting Catalog Update
A new template category, **Day-to-Day Court Drafts**, is added to the catalog:
* **Affidavits**:
  * NOC Affidavit (subtypes: *Nagar Nigam, UPPCL, House Assessment / Mutation, Landlord-Tenant Relation*).
  * Gap Certificate Affidavit, Two Name Affidavit, Name Correction Affidavit, Declaration Affidavit, Pension Affidavit.
* **Lower Court Applications**:
  * Haziri Mafi / Appearance Exemption, Adjournment Application, Exemption Application, Discharge Application, FIR / Order Related Application, Surety / Jamanat, Order Compliance, Undertaking, Regular Bail, Sessions Bail, Appeal Against Sessions Court Order.
* **High Court Utilities**:
  * Mention Slip, Vakalatnama Taken on Record, Listing Application, Short Counter Affidavit, Supplementary Affidavit, Bail, Writ under Article 226, Writ under Article 227, Criminal Miscellaneous Writ Petition.
* **Criminal Miscellaneous / CRLP Inputs**: FIR Number, Sections / U/S, Grounds, Prayer, Police Station, Case Number, Client Side.

### 5. Case-Aware Drafting Integration
* **Workflow**: Open Case → Create Draft From Case → Pre-fill case data → Advocate completes missing details → Completeness Engine check → AI Draft Generation.
* **Suggested Drafts by Case Stage**:
  * *Stage: Final Arguments* → Short Argument Note, Written Submission, Early Disposal Application.
  * *Stage: Evidence* → Evidence Affidavit, List of Documents, Witness List.
  * *Stage: Bail / Criminal* → Bail Application, Surety Affidavit, Exemption Application, Discharge Application.
  * *Stage: High Court Listing* → Mention Slip, Listing Application, Supplementary Affidavit.

### 6. Outbound WhatsApp Assistant
WhatsApp operates strictly as an **outbound helper** for advocates, notifying them of:
* Daily/tomorrow hearing schedules.
* Upcoming case dates.
* Pending drafting tasks.
* Case status reminders and suggested templates.
* **Safety Rule**: It will *not* read client chats, auto-send filings, or message clients directly.

### 7. Calendar and Voice Reminders (Future Phases)
* **Calendar Sync**: Case date sync, hearing schedules, tomorrow's prep sheet.
* **Voice Reminders**: Interactive calling assistant summarizing schedules.

---

## Product Safety Notes
1. **Review-First Guardrails**: No filings are auto-generated or auto-submitted. Legal outputs must require manual review.
2. **Unverified Section Mapping**: Old CrPC to new BNSS mappings must display a warning tag as "Unverified" until official RAG legal source lookup is implemented.
3. **No Direct Client Messages**: The WhatsApp module must never message opposing parties or clients without explicit advocate approval.
4. **Key Security**: API keys must reside in backend environment scopes, never exposed in client bundles.
