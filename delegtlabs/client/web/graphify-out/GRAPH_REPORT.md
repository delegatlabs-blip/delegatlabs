# Graph Report - web  (2026-08-01)

## Corpus Check
- 20 files · ~4,015 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 121 nodes · 144 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b3aac84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- compilerOptions
- package.json
- json-ld.tsx
- layout.tsx
- page.tsx
- include
- eslint.config.mjs
- DelegtLabs public marketing site (homepage)
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `siteConfig` - 8 edges
3. `scripts` - 5 edges
4. `include` - 5 edges
5. `lib` - 4 edges
6. `DelegtLabs public marketing site (homepage)` - 4 edges
7. `FloatingWhatsApp()` - 3 edges
8. `JsonLd()` - 3 edges
9. `agentToSoftwareApplication()` - 3 edges
10. `Accent` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, @eslint/eslintrc, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, tailwindcss (+11 more)

### Community 1 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 2 - "package.json"
Cohesion: 0.11
Nodes (17): framer-motion, next, dependencies, framer-motion, next, react, react-dom, name (+9 more)

### Community 3 - "json-ld.tsx"
Cohesion: 0.20
Nodes (12): PlanMode, AnimatedSection(), AnimatedSectionProps, directionOffset, agentToSoftwareApplication(), extractPrice(), JsonLd(), Accent (+4 more)

### Community 4 - "layout.tsx"
Cohesion: 0.19
Nodes (7): inter, metadata, viewport, AdvancedCursor(), buildWhatsAppUrl(), FloatingWhatsApp(), siteConfig

### Community 5 - "page.tsx"
Cohesion: 0.27
Nodes (5): AgentMarketplace(), Hero(), SiteFooter(), NAV_ITEMS, SiteHeader()

### Community 6 - "include"
Cohesion: 0.25
Nodes (7): next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude, include

### Community 7 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 8 - "DelegtLabs public marketing site (homepage)"
Cohesion: 0.40
Nodes (4): DelegtLabs public marketing site (homepage), Develop, Docker, SEO / AI search

## Knowledge Gaps
- **59 isolated node(s):** `__filename`, `__dirname`, `compat`, `eslintConfig`, `nextConfig` (+54 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `compat` to the rest of the system?**
  _59 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._