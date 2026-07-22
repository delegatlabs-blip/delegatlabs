# DelegatLabs Lawyer Agent

AI-powered Legal Drafting Assistant tailored for Indian advocates and small law firms, initially focusing on Uttar Pradesh.

## Scope: V1 Focus
DelegatLabs Lawyer Agent V1 is focused solely on **Mode 1: Guided Legal Drafting**. The product behaves as a user-friendly AI Junior Associate, making it simple for non-technical legal users to generate high-quality documents without navigating complex chat prompts.

Unrelated modules (such as Client Portal, Matter Management, Legal Research, OCR, RAG, or Case Management) are out of scope for V1 and are planned as future updates.

## Monorepo Workspace Structure

```
delegatlabs-lawyer-agent/
├── apps/
│   ├── web/         # Next.js UI Application (Tailwind CSS, TypeScript)
│   └── api/         # FastAPI Backend API (Python, Pydantic, Supabase client)
├── packages/
│   ├── shared/      # Types, schemas, and common code
│   └── config/      # Shared configs (ESlint, TypeScript config, Tailwind configurations)
├── docs/
│   └── lawyer-agent/# Master product blueprints and roadmap
├── infra/
│   └── supabase/    # Supabase DB schema, migrations, and seed files
└── README.md
```

## Key Core Product Principles
1. **Not Chatbot-First**: Dynamic UI forms based on metadata-driven blueprints.
2. **UI & Draft Language Selection**: First screen asks for UI language (English/Hindi). Intake workflow specifies draft output language (English/Hindi).
3. **No Hallucinations**: Standard validation checks ensure verified citations and legal facts are used. Graceful confidence warning if facts are missing.
4. **Auto-save & Auto-versioning**: Auto-saves state in local cache.

## Documentation
- See the concise product blueprint: [00_Master_Product_Blueprint.md](docs/lawyer-agent/00_Master_Product_Blueprint.md)
- See the progression roadmap: [01_Implementation_Roadmap.md](docs/lawyer-agent/01_Implementation_Roadmap.md)
