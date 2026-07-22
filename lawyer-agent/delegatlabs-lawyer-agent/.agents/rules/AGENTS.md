# Workspace Agent Rules for DelegatLabs Lawyer Agent

This file contains project-scoped guidelines and rules.

## Tech Stack
- Frontend: Next.js (App Router, TypeScript, Tailwind CSS, shadcn/ui)
- Backend: FastAPI (Python, Pydantic, SQLAlchemy)
- Database: Supabase PostgreSQL
- Auth: Custom OAuth2 JWT

## Special Rules
1. **Never hardcode translations**: All strings shown in the UI must be referenced via translation JSON files (`en.json` and `hi.json`).
2. **Metadata-driven draft Blueprints**: Never hardcode document structure or fields directly into React components. Load them from backend blueprint JSON payloads.
3. **No Halucinations**: If verified legal databases or user facts are missing, output a graceful fallback saying the draft cannot be generated confidently.
4. **Step-by-step Wizard**: Intake forms must be section-based, guided, auto-saving steps.
