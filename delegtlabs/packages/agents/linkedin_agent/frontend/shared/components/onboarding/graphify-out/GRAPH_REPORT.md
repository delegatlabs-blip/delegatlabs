# Graph Report - onboarding  (2026-08-02)

## Corpus Check
- 9 files · ~6,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 34 nodes · 44 edges · 7 communities (5 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba911392`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- FlashcardFlow.tsx
- OnboardingStepCard.tsx
- CheckboxCard.tsx
- SingleSelectCard.tsx
- SummaryCard.tsx
- TextInputCard.tsx

## God Nodes (most connected - your core abstractions)
1. `CheckboxOption` - 3 edges
2. `CheckboxCard()` - 2 edges
3. `OnboardingQuestion` - 2 edges
4. `SingleSelectCard()` - 2 edges
5. `SummaryCard()` - 2 edges
6. `TextInputCard()` - 2 edges
7. `defaultAnswers` - 2 edges
8. `industryOptions` - 2 edges
9. `industryTopicsMap` - 2 edges
10. `defaultFallbackTopics` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (7 total, 2 thin omitted)

### Community 0 - "FlashcardFlow.tsx"
Cohesion: 0.36
Nodes (6): FlashcardFlowProps, defaultAnswers, defaultFallbackTopics, industryOptions, industryTopicsMap, questionsConfig

### Community 1 - "OnboardingStepCard.tsx"
Cohesion: 0.25
Nodes (5): defaultOnboardingLabels, OnboardingLabels, OnboardingQuestion, OnboardingStepCardProps, wizardQuestions

### Community 2 - "CheckboxCard.tsx"
Cohesion: 0.50
Nodes (3): CheckboxCard(), CheckboxCardProps, CheckboxOption

### Community 3 - "SingleSelectCard.tsx"
Cohesion: 0.50
Nodes (3): SingleSelectCard(), SingleSelectCardProps, SingleSelectOption

## Knowledge Gaps
- **10 isolated node(s):** `CheckboxCardProps`, `FlashcardFlowProps`, `OnboardingLabels`, `defaultOnboardingLabels`, `OnboardingStepCardProps` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `CheckboxCardProps`, `FlashcardFlowProps`, `OnboardingLabels` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._