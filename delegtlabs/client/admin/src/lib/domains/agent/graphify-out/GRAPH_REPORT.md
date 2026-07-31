# Graph Report - agent  (2026-08-01)

## Corpus Check
- 22 files · ~7,997 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 119 nodes · 326 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b3aac84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent-drawer.tsx
- index.ts
- utils/index.ts
- map-agent-row.ts
- agent.service.ts
- payment-plans-editor.tsx
- map-agent-config.ts
- linkedin-manage-form.tsx
- schema/index.ts

## God Nodes (most connected - your core abstractions)
1. `defaultListing()` - 13 edges
2. `rowToAgent()` - 11 edges
3. `AgentDrawer()` - 10 edges
4. `defaultConfigForSlug()` - 9 edges
5. `defaultLinkedInConfig()` - 8 edges
6. `postAgent()` - 7 edges
7. `AgentSlug` - 7 edges
8. `AgentRecord` - 7 edges
9. `defaultLawyerConfig()` - 7 edges
10. `defaultSubscriptionPlans()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `fetchAgents()` --indirect_call--> `rowToAgent()`  [INFERRED]
  services/agent.service.ts → utils/map-agent-row.ts
- `AgentDrawer()` --calls--> `createAgent()`  [EXTRACTED]
  features/agent-drawer.tsx → controllers/agent.controller.ts
- `AgentDrawer()` --calls--> `updateAgent()`  [EXTRACTED]
  features/agent-drawer.tsx → controllers/agent.controller.ts
- `replacePlansAndPacks()` --calls--> `defaultListing()`  [EXTRACTED]
  services/agent.service.ts → utils/listing.ts
- `upsertAgentConfig()` --calls--> `linkedInConfigToCreateData()`  [EXTRACTED]
  services/agent.service.ts → utils/map-agent-config.ts

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "agent-drawer.tsx"
Cohesion: 0.12
Nodes (21): emptyDefaults, AgentDrawerBasicsFields(), AgentDrawerLinksFields(), AgentDrawerListingFields(), FormValues, FormValues, AgentDrawerPricingStep(), FormValues (+13 more)

### Community 1 - "index.ts"
Cohesion: 0.15
Nodes (15): createAgent(), deleteAgent(), getAgent(), listAgents(), updateAgent(), accentBySlug, AgentConfigMap, AgentCreateInput (+7 more)

### Community 2 - "utils/index.ts"
Cohesion: 0.33
Nodes (11): AgentDrawer(), csvToList(), newId(), resolveAgentSlug(), AgentSlug, AGENT_CATALOG, newPlanId(), defaultCreditPacks() (+3 more)

### Community 3 - "map-agent-row.ts"
Cohesion: 0.57
Nodes (6): lawyerRowToConfig(), AgentRow, asStringArray(), packRowToPack(), planRowToPlan(), rowToAgent()

### Community 4 - "agent.service.ts"
Cohesion: 0.25
Nodes (13): fetchAgent(), fetchAgents(), postAgent(), putAgent(), replacePlansAndPacks(), Tx, upsertAgentConfig(), withRelations (+5 more)

### Community 5 - "payment-plans-editor.tsx"
Cohesion: 0.39
Nodes (8): CreditPackForm, CreditPacksEditor(), emptyCredit(), emptySubscription(), newId(), SubscriptionPlanForm, SubscriptionPlansEditor(), BillingInterval

### Community 6 - "map-agent-config.ts"
Cohesion: 0.33
Nodes (11): LawyerAgentConfig, LinkedInAgentConfig, defaultConfigForSlug(), defaultLawyerConfig(), defaultLinkedInConfig(), asStringArray(), asTopicWeights(), linkedInConfigToCreateData() (+3 more)

### Community 8 - "schema/index.ts"
Cohesion: 0.70
Nodes (3): agentCreateSchema, agentSlugSchema, agentStatusSchema

## Knowledge Gaps
- **16 isolated node(s):** `accentBySlug`, `FormValues`, `FormValues`, `FormValues`, `FormValues` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `defaultListing()` connect `utils/index.ts` to `agent-drawer.tsx`, `index.ts`, `map-agent-row.ts`, `agent.service.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `AgentRecord` connect `index.ts` to `agent-drawer.tsx`, `map-agent-row.ts`, `agent.service.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `AgentDrawerFormValues` connect `agent-drawer.tsx` to `schema/index.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `rowToAgent()` (e.g. with `fetchAgents()` and `packRowToPack()`) actually correct?**
  _`rowToAgent()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `accentBySlug`, `FormValues`, `FormValues` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent-drawer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._