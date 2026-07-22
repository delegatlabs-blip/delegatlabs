# Implementation Roadmap: DelegatLabs Lawyer Agent

A progressive multi-stage roadmap detailing development increments from monorepo structures to case-aware legal assistants.

---

## Completed Phases
* **Level 0**: Monorepo workspace layouts.
* **Level 1**: Linting, TypeScript rules, and Github workflows.
* **Level 2**: Basic API skeletons inside `apps/api`.
* **Level 3**: Next.js app structure setup inside `apps/web`.
* **Level 4**: Light-themed Dashboard and Draft catalog placeholders.
* **Level 5**: Metadata-driven draft catalog registry.
* **Level 6**: Draft Blueprints framework (supporting Rent Agreement).
* **Level 7**: Guided Section Stepper Intake Wizard.
* **Level 8**: Completeness Validation Engine.
* **Level 9**: Advocate Custom Directives & Prompt Previewer.
* **Level 10**: FastAPI AI Router Mock Provider endpoint linking.
* **Level 11**: Draft Preview and Structural Auditor.
* **Level 12**: Browser Printing rules & Export Abstractions.

---

## Active Phase

### Level 13: Supabase Schema with Drafting + Case-Aware Legal Briefing Foundation
* Create Supabase SQL migration scripts in `infra/supabase/migrations/`.
* Define tables for core drafting data (users, blueprints, draft sessions, generated texts).
* Define tables for case management records (`cases`, `case_parties`, `case_dates`, `case_tasks`, `case_notes`, `case_draft_links`).
* Define tables for reminders and integration settings (`reminders`, `notification_preferences`, `notification_logs`, `integration_accounts`).
* Ensure all tables include auditing timestamps, foreign keys, and indexes.

---

## Downstream Milestones

### Level 14: Supabase Client Integration & Auth Persistence
* Integrate Prisma ORM or direct Supabase client libraries inside the FastAPI backend.
* Set up database models and integrate users authentication tables with sign-in/up routes.
* Connect Next.js frontend state to preserve login tokens.

### Level 15: Case Management Module & Linking Core
* Construct frontend dashboards for creating and listing cases.
* Wire input forms for Party Side Selection A/B and client markers.
* Link dynamic drafts intake wizard to pull facts directly from case records.

### Level 16: Intelligent Intake Parsing (Hearing Notes OCR/AI)
* Build hearing notes upload interface supporting OCR.
* Implement backend AI parsing extracting structured variables into case objects.

### Level 17: Outbound WhatsApp Scheduler
* Connect outbound notifications service triggers.
* Formulate schedules compiling morning briefings for advocates.
