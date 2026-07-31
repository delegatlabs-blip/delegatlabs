# Graph Report - agent  (2026-08-01)

## Corpus Check
- 21 files · ~7,357 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 108 nodes · 285 edges · 8 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b3aac84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent-drawer-fields.tsx
- index.ts
- agent-drawer.tsx
- types.ts
- agent.service.ts
- agent-drawer-pricing-step.tsx
- utils/index.ts
- linkedin-manage-form.tsx

## God Nodes (most connected - your core abstractions)
1. `defaultListing()` - 13 edges
2. `AgentDrawer()` - 10 edges
3. `rowToAgent()` - 8 edges
4. `postAgent()` - 7 edges
5. `AgentSlug` - 7 edges
6. `AgentRecord` - 7 edges
7. `defaultConfigForSlug()` - 7 edges
8. `defaultSubscriptionPlans()` - 7 edges
9. `defaultCreditPacks()` - 7 edges
10. `AgentDrawerFormValues` - 6 edges

## Surprising Connections (you probably didn't know these)
- `fetchAgents()` --indirect_call--> `rowToAgent()`  [INFERRED]
  services/agent.service.ts → utils/map-agent-row.ts
- `AgentDrawer()` --calls--> `createAgent()`  [EXTRACTED]
  features/agent-drawer.tsx → controllers/agent.controller.ts
- `AgentDrawer()` --calls--> `updateAgent()`  [EXTRACTED]
  features/agent-drawer.tsx → controllers/agent.controller.ts
- `AgentDrawer()` --calls--> `defaultListing()`  [EXTRACTED]
  features/agent-drawer.tsx → utils/listing.ts
- `fetchAgent()` --calls--> `rowToAgent()`  [EXTRACTED]
  services/agent.service.ts → utils/map-agent-row.ts

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "agent-drawer-fields.tsx"
Cohesion: 0.15
Nodes (16): AgentDrawerBasicsFields(), AgentDrawerLinksFields(), AgentDrawerListingFields(), FormValues, AgentDrawerPublishStep(), FormValues, fieldControlClass(), FieldError() (+8 more)

### Community 1 - "index.ts"
Cohesion: 0.18
Nodes (11): createAgent(), deleteAgent(), getAgent(), listAgents(), updateAgent(), accentBySlug, AgentConfigMap, AgentCreateInput (+3 more)

### Community 2 - "agent-drawer.tsx"
Cohesion: 0.17
Nodes (14): AgentDrawer(), csvToList(), emptyDefaults, FormValues, newId(), resolveAgentSlug(), Step, STEP_FIELDS (+6 more)

### Community 3 - "types.ts"
Cohesion: 0.28
Nodes (12): fetchAgents(), AgentListing, AgentSlug, BillingInterval, CreditPack, PaymentType, SubscriptionPlan, AgentRow (+4 more)

### Community 4 - "agent.service.ts"
Cohesion: 0.36
Nodes (10): fetchAgent(), postAgent(), putAgent(), replacePlansAndPacks(), withPlans, defaultListing(), agentToCreateData(), asUuid() (+2 more)

### Community 5 - "agent-drawer-pricing-step.tsx"
Cohesion: 0.33
Nodes (9): AgentDrawerPricingStep(), FormValues, CreditPackForm, CreditPacksEditor(), emptyCredit(), emptySubscription(), newId(), SubscriptionPlanForm (+1 more)

### Community 6 - "utils/index.ts"
Cohesion: 0.62
Nodes (5): defaultConfigForSlug(), defaultLawyerConfig(), defaultLinkedInConfig(), isLawyerConfig(), isLinkedInConfig()

### Community 7 - "linkedin-manage-form.tsx"
Cohesion: 0.50
Nodes (3): csvToList(), LinkedInManageForm(), LinkedInAgentConfig

## Knowledge Gaps
- **15 isolated node(s):** `accentBySlug`, `FormValues`, `FormValues`, `FormValues`, `FormValues` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `defaultListing()` connect `agent.service.ts` to `index.ts`, `agent-drawer.tsx`, `types.ts`, `utils/index.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `AgentRecord` connect `index.ts` to `agent-drawer.tsx`, `types.ts`, `agent.service.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `AgentDrawerFormValues` connect `agent-drawer-fields.tsx` to `agent-drawer.tsx`, `agent-drawer-pricing-step.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `rowToAgent()` (e.g. with `fetchAgents()` and `packRowToPack()`) actually correct?**
  _`rowToAgent()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `accentBySlug`, `FormValues`, `FormValues` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._