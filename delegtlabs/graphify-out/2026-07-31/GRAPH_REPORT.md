# Graph Report - delegtlabs  (2026-07-28)

## Corpus Check
- 369 files · ~96,114 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2124 nodes · 4003 edges · 211 communities (99 shown, 112 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 83 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b3aac84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agent_repository.py
- cn
- customer_repository.py
- user_repository.py
- get_registered_agents
- agents-context.tsx
- admin/src/lib/utils.ts
- devDependencies
- devDependencies
- agent-drawer.tsx
- devDependencies
- agent-types.ts
- admin/src/components/ui/sidebar.tsx
- user/src/components/ui/sidebar.tsx
- (app)/settings/page.tsx
- cn
- user/src/lib/utils.ts
- admin/src/components/ui/command.tsx
- user/src/components/users/users-table.tsx
- user/src/components/users/user-drawer.tsx
- Language
- linkedin-agent/backend/router_user.py
- compilerOptions
- compilerOptions
- draft-blueprints.ts
- page-header.tsx
- case-storage.ts
- payment-plans-editor.tsx
- intake-wizard.tsx
- lawyer-agent/backend/schemas.py
- user/src/components/ui/command.tsx
- DraftBlueprint
- pr_pipeline.py
- admin/components.json
- user/components.json
- compilerOptions
- test_phase4_web.py
- customer-store.ts
- admin/src/components/ui/menubar.tsx
- user/src/components/ui/menubar.tsx
- config.py
- lawyer-agent/frontend/UserDashboard.tsx
- linkedin-agent/manifest.json
- (app)/users/page.tsx
- dependencies
- admin/src/components/ui/carousel.tsx
- topbar.tsx
- FastAPI
- lawyer-agent/manifest.json
- Base
- draft-catalog.ts
- linkedin-agent/frontend/UserDashboard.tsx
- admin/src/components/ui/form.tsx
- user/endpoints/health.py
- admin/src/components/ui/chart.tsx
- user/src/components/ui/chart.tsx
- exceptions.py
- AgentRegistry
- admin/src/components/ui/context-menu.tsx
- user/src/components/ui/context-menu.tsx
- admin/src/components/ui/navigation-menu.tsx
- user/src/app/providers.tsx
- Quick start
- DelegtLabs Server
- Admin + Web APIs (PostgreSQL)
- Delegate Labs — Admin Panel
- user/README.md
- export-service.ts
- lawyer-agent/frontend/AdminDashboard.tsx
- linkedin-agent/frontend/AdminDashboard.tsx
- web/README.md
- active-cases-empty-state.tsx
- components/empty-state.tsx
- developer-prompt-preview.tsx
- guardrails-card.tsx
- output-requirements-card.tsx
- dev.sh
- user/src/components/ui/carousel.tsx
- dependencies
- embla-carousel-react
- @hookform/resolvers
- input-otp
- lucide-react
- @radix-ui/react-accordion
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- web/eslint.config.mjs
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- enterprise/page.tsx
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- pricing/page.tsx
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- solutions/page.tsx
- react-day-picker
- react-dom
- react-hook-form
- react-resizable-panels
- sonner
- tailwind-merge
- user/router.py
- admin/next.config.ts
- @tanstack/react-query
- framer-motion
- next
- @tanstack/react-table
- next-themes
- tw-animate-css
- vaul
- @radix-ui/react-alert-dialog
- zod
- class-variance-authority
- clsx
- @radix-ui/react-aspect-ratio
- date-fns
- embla-carousel-react
- @hookform/resolvers
- input-otp
- lucide-react
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-avatar
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- @radix-ui/react-dialog
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- recharts
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-tabs
- admin/postcss.config.mjs
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react
- react-hook-form
- react-resizable-panels
- tailwind-merge
- user/next.config.ts
- @tanstack/react-query
- framer-motion
- next
- @tanstack/react-table
- tw-animate-css
- vaul
- next-themes
- zod
- zustand
- @radix-ui/react-aspect-ratio
- react-day-picker
- recharts
- user/postcss.config.mjs
- app/settings/page.tsx
- web/next.config.ts
- web/postcss.config.mjs
- core/__init__.py
- admin/eslint.config.mjs
- app/__init__.py
- integrations/__init__.py
- user/eslint.config.mjs
- strings.py
- delegtlabs-server
- logging.py
- date-fns
- @radix-ui/react-switch
- @radix-ui/react-separator
- @radix-ui/react-checkbox

## God Nodes (most connected - your core abstractions)
1. `cn()` - 81 edges
2. `cn()` - 77 edges
3. `Language` - 41 edges
4. `TenantContext` - 30 edges
5. `get_session_factory()` - 25 edges
6. `MemberService` - 25 edges
7. `getTranslation()` - 24 edges
8. `Base` - 23 edges
9. `AppError` - 23 edges
10. `Button` - 19 edges

## Surprising Connections (you probably didn't know these)
- `LawyerDraftSession` --inherits--> `Base`  [EXTRACTED]
  packages/agents/lawyer-agent/backend/models.py → server/app/core/database.py
- `LawyerGeneratedDraft` --inherits--> `Base`  [EXTRACTED]
  packages/agents/lawyer-agent/backend/models.py → server/app/core/database.py
- `LinkedInLead` --inherits--> `Base`  [EXTRACTED]
  packages/agents/linkedin-agent/backend/models.py → server/app/core/database.py
- `LinkedInPost` --inherits--> `Base`  [EXTRACTED]
  packages/agents/linkedin-agent/backend/models.py → server/app/core/database.py
- `ContextMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  client/admin/src/components/ui/context-menu.tsx → client/admin/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (211 total, 112 thin omitted)

### Community 0 - "agent_repository.py"
Cohesion: 0.06
Nodes (62): async_sessionmaker, HTTPException, create_agent(), delete_agent(), get_agent(), update_agent(), create_customer(), delete_customer() (+54 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (49): initial, AccordionContent, AccordionItem, AccordionTrigger, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink (+41 more)

### Community 2 - "customer_repository.py"
Cohesion: 0.21
Nodes (18): assertTenant(), createMemberUseCase(), deleteMemberUseCase(), listMembersUseCase(), updateMemberUseCase(), UserDrawer(), UsersTable(), Member (+10 more)

### Community 3 - "user_repository.py"
Cohesion: 0.17
Nodes (19): create_user(), update_user(), AdminUser, _apply_row(), _now(), _orm_to_row(), _parse_dt(), AsyncSession (+11 more)

### Community 4 - "get_registered_agents"
Cohesion: 0.30
Nodes (12): create_member(), delete_member(), get_member(), list_members(), AsyncSession, UUID, Create always stamps JWT tenant_id via stamp_tenant_id (never from body)., update_member() (+4 more)

### Community 5 - "agents-context.tsx"
Cohesion: 0.07
Nodes (35): AgentDetailPage(), CheckoutClient(), geist, inter, metadata, AgentDetail(), AgentDetailProps, AgentPlaygroundModal() (+27 more)

### Community 6 - "admin/src/lib/utils.ts"
Cohesion: 0.13
Nodes (29): SettingsPage(), statusStyles, CommandPalette(), useTheme(), labelFromPath(), TopNav(), AlertDialogAction, AlertDialogCancel (+21 more)

### Community 7 - "devDependencies"
Cohesion: 0.05
Nodes (36): dependencies, @google/genai, next, react, react-dom, devDependencies, eslint, eslint-config-next (+28 more)

### Community 8 - "devDependencies"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, eslint-config-next, @eslint/eslintrc, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+19 more)

### Community 9 - "agent-drawer.tsx"
Cohesion: 0.10
Nodes (34): creditPackSchema, emptyDefaults, FormValues, schema, subscriptionPlanSchema, csvToList(), LinkedInManageForm(), FormValues (+26 more)

### Community 10 - "devDependencies"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, eslint-config-next, @eslint/eslintrc, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+19 more)

### Community 11 - "agent-types.ts"
Cohesion: 0.09
Nodes (37): AgentManagePage(), AgentsPage(), accentBySlug, AgentCard(), AgentDrawer(), csvToList(), newId(), resolveAgentSlug() (+29 more)

### Community 12 - "admin/src/components/ui/sidebar.tsx"
Cohesion: 0.08
Nodes (33): AppSidebar(), bottomItems, mainItems, workspaceItems, Sidebar, SidebarContent, SidebarContext, SidebarContextProps (+25 more)

### Community 13 - "user/src/components/ui/sidebar.tsx"
Cohesion: 0.07
Nodes (36): AppShell(), BARE_PATHS, AppSidebar(), management, platform, system, CommandPalette(), Sidebar (+28 more)

### Community 14 - "(app)/settings/page.tsx"
Cohesion: 0.11
Nodes (25): DashboardContent(), DashboardHeader(), metadata, ActivityFeed(), items, data, RevenueChart(), StatCard() (+17 more)

### Community 15 - "cn"
Cohesion: 0.09
Nodes (30): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+22 more)

### Community 16 - "user/src/lib/utils.ts"
Cohesion: 0.04
Nodes (40): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, ContextMenuCheckboxItem (+32 more)

### Community 17 - "admin/src/components/ui/command.tsx"
Cohesion: 0.12
Nodes (18): metadata, Providers(), applyTheme(), Theme, ThemeContext, ThemeContextValue, ThemeProvider(), Command (+10 more)

### Community 18 - "user/src/components/users/users-table.tsx"
Cohesion: 0.10
Nodes (27): statusStyles, Avatar, AvatarFallback, AvatarImage, Badge(), BadgeProps, badgeVariants, Checkbox (+19 more)

### Community 19 - "user/src/components/users/user-drawer.tsx"
Cohesion: 0.12
Nodes (18): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SheetContent (+10 more)

### Community 20 - "Language"
Cohesion: 0.13
Nodes (19): CompletenessSummaryCard(), CompletenessSummaryCardProps, getRuleFriendlyName(), ValidationResults(), ValidationResultsProps, WarningsList(), WarningsListProps, IntakeProgress() (+11 more)

### Community 21 - "linkedin-agent/backend/router_user.py"
Cohesion: 0.09
Nodes (18): get_linkedin_admin_stats(), get_stats(), _next_run_from_cron(), Manual worker trigger — runs LinkedIn PR + lead pipeline once., Next boundary for cron `0 */6 * * *` (every 6 hours on the hour)., trigger_pipeline(), update_config(), AgentRunSchema (+10 more)

### Community 22 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 23 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 24 - "draft-blueprints.ts"
Cohesion: 0.11
Nodes (14): BlueprintSectionCardProps, ClauseListProps, IntakeFieldProps, IntakeSectionNav(), IntakeSectionNavProps, RequiredFieldListProps, CompletenessResult, DRAFT_BLUEPRINTS (+6 more)

### Community 25 - "page-header.tsx"
Cohesion: 0.09
Nodes (16): metadata, metadata, DashboardContent(), metadata, metadata, metadata, metadata, metadata (+8 more)

### Community 26 - "case-storage.ts"
Cohesion: 0.14
Nodes (19): CaseCardProps, addCaseTimelineEvent(), archiveActiveCase(), CASE_ROLE_SUGGESTIONS, CaseDraftContext, CaseDraftLink, CaseParty, CaseRecord (+11 more)

### Community 27 - "payment-plans-editor.tsx"
Cohesion: 0.14
Nodes (21): CreditPackForm, CreditPacksEditor(), emptyCredit(), emptySubscription(), newId(), SubscriptionPlanForm, SubscriptionPlansEditor(), DialogContent (+13 more)

### Community 28 - "intake-wizard.tsx"
Cohesion: 0.16
Nodes (18): IntakeWizard(), buildCaseDraftPrefill(), normalizeRole(), clearActiveCaseDraftContext(), getActiveCase(), getActiveCaseDraftContext(), updateCaseDraftLink(), clearDraftIntake() (+10 more)

### Community 29 - "lawyer-agent/backend/schemas.py"
Cohesion: 0.13
Nodes (15): get_lawyer_admin_stats(), generate_draft(), get_stats(), update_config(), AgentRunSchema, DailyMetricSchema, DraftGenerationRequest, DraftGenerationResponse (+7 more)

### Community 30 - "user/src/components/ui/command.tsx"
Cohesion: 0.16
Nodes (15): Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator (+7 more)

### Community 31 - "DraftBlueprint"
Cohesion: 0.13
Nodes (12): MissingFieldsList(), MissingFieldsListProps, IntakeSummary(), IntakeSummaryProps, IntakeWizardProps, OutputCheckListProps, DraftBlueprint, OutputValidationResult (+4 more)

### Community 32 - "pr_pipeline.py"
Cohesion: 0.19
Nodes (19): generate_linkedin_post(), generate_post_image_meta(), is_duplicate_post(), _mock_mode(), pick_topic(), publish_or_draft_post(), Any, PR posting + lead generation pipeline adapted from linkedin_pr_agent reference. (+11 more)

### Community 33 - "admin/components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 34 - "user/components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 35 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 36 - "test_phase4_web.py"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 37 - "customer-store.ts"
Cohesion: 0.19
Nodes (16): CustomersPage(), CustomerDrawer(), ApiCustomer, createCustomer(), deleteCustomer(), listCustomers(), mapCustomer(), updateCustomer() (+8 more)

### Community 38 - "admin/src/components/ui/menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 39 - "user/src/components/ui/menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 40 - "config.py"
Cohesion: 0.21
Nodes (11): BaseSettings, get_current_settings(), get_settings(), Application settings from environment / .env., Settings, create_access_token(), decode_access_token(), get_secret_key() (+3 more)

### Community 41 - "lawyer-agent/frontend/UserDashboard.tsx"
Cohesion: 0.17
Nodes (11): defaultConfig, LawyerConfig, DraftGenerationPayload, DraftGenerationResponse, generateDraft(), compileLocalPreview(), INTAKE_FIELDS, IntakeState (+3 more)

### Community 42 - "linkedin-agent/manifest.json"
Cohesion: 0.12
Nodes (15): admin_route, base_price_inr, base_price_usd, capabilities, category, description, name, slug (+7 more)

### Community 43 - "(app)/users/page.tsx"
Cohesion: 0.22
Nodes (14): UsersPage(), UserDrawer(), ApiUser, createUser(), deleteUser(), listUsers(), mapUser(), updateUser() (+6 more)

### Community 44 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, cmdk, @radix-ui/react-dropdown-menu, @radix-ui/react-hover-card, @radix-ui/react-toggle, react-dom, sonner, cmdk (+5 more)

### Community 46 - "admin/src/components/ui/carousel.tsx"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 47 - "topbar.tsx"
Cohesion: 0.23
Nodes (11): Topbar(), useCrumbs(), Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage (+3 more)

### Community 48 - "FastAPI"
Cohesion: 0.09
Nodes (9): BaseHTTPMiddleware, FastAPI, Response, setup_logging(), Request, RequestContextMiddleware, create_app(), lifespan() (+1 more)

### Community 49 - "lawyer-agent/manifest.json"
Cohesion: 0.14
Nodes (13): admin_route, base_price_inr, base_price_usd, capabilities, category, description, name, slug (+5 more)

### Community 50 - "Base"
Cohesion: 0.05
Nodes (44): LawyerDraftSession, LawyerGeneratedDraft, LinkedInLead, LinkedInPost, Path, AgentRegistry, _find_agents_dir(), get_agent_manifest() (+36 more)

### Community 51 - "draft-catalog.ts"
Cohesion: 0.21
Nodes (10): CategoryFilter(), CategoryFilterProps, DraftCard(), DraftCardProps, Category, Difficulty, DRAFT_CATALOG, DraftCatalogItem (+2 more)

### Community 52 - "linkedin-agent/frontend/UserDashboard.tsx"
Cohesion: 0.21
Nodes (9): defaultConfig, LinkedInConfig, Credential, formatCountdown(), Lead, LinkedInUserDashboard(), Post, scoreBadge() (+1 more)

### Community 53 - "admin/src/components/ui/form.tsx"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 54 - "user/endpoints/health.py"
Cohesion: 0.29
Nodes (7): api_health(), AppSurface, Environment, APIModel, HealthResponse, BaseModel, StrEnum

### Community 55 - "admin/src/components/ui/chart.tsx"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 56 - "user/src/components/ui/chart.tsx"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 57 - "exceptions.py"
Cohesion: 0.36
Nodes (6): Exception, JSONResponse, app_error_handler(), AppError, http_exception_handler(), Request

### Community 59 - "admin/src/components/ui/context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 61 - "admin/src/components/ui/navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 62 - "user/src/app/providers.tsx"
Cohesion: 0.08
Nodes (31): metadata, Providers(), loginUseCase(), registerUseCase(), AuthGate(), PUBLIC_PATHS, Toaster(), ToasterProps (+23 more)

### Community 63 - "Quick start"
Cohesion: 0.29
Nodes (6): Backend, Clients, DelegtLabs, Design goals, One-command Docker run, Quick start

### Community 64 - "DelegtLabs Server"
Cohesion: 0.22
Nodes (7): DelegtLabs Server, Layout (summary), Routes, Run, Storage, Run, Server layout

### Community 65 - "Admin + Web APIs (PostgreSQL)"
Cohesion: 0.29
Nodes (6): Admin (`/api/admin`), Admin + Web APIs (PostgreSQL), Endpoints, PostgreSQL, Run (monolith gateway), Web (`/web/api/v1`)

### Community 68 - "Delegate Labs — Admin Panel"
Cohesion: 0.25
Nodes (7): Delegate Labs — Admin Panel, Docker, Environment variables, Getting started, Routes, Scripts, Stack

### Community 69 - "user/README.md"
Cohesion: 0.33
Nodes (5): Architecture, Auth flow, DelegtLabs — User App (Next.js), Setup, Tenant model

### Community 77 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 88 - "user/src/components/ui/carousel.tsx"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 89 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, class-variance-authority, clsx, @radix-ui/react-dropdown-menu, @radix-ui/react-scroll-area, @radix-ui/react-toggle, react, class-variance-authority (+5 more)

### Community 100 - "web/eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 125 - "user/router.py"
Cohesion: 0.13
Nodes (24): HTTPAuthorizationCredentials, get_current_tenant(), Resolve the authenticated principal and tenant_id from the JWT.      When DISABL, get_me(), ProfileRead, BaseModel, get_user_global_dashboard(), list_registered_agents() (+16 more)

### Community 190 - "app/settings/page.tsx"
Cohesion: 0.08
Nodes (28): metadata, iconMap, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (+20 more)

### Community 197 - "admin/eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 202 - "user/eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 205 - "strings.py"
Cohesion: 0.18
Nodes (21): login(), me(), AsyncSession, Create a tenant + owner; JWT includes tenant_id., Authenticate and issue a JWT with tenant_id claim., register(), hash_password(), PBKDF2-SHA256 hash with embedded salt (no extra dependency). (+13 more)

### Community 213 - "logging.py"
Cohesion: 0.60
Nodes (4): Any, Daily metrics rollup — drafting itself is request-driven via generate-draft., run_agent_task(), run_lawyer_agent_task()

## Knowledge Gaps
- **673 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+668 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **112 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `customer_repository.py`, `user/src/components/ui/menubar.tsx`, `user/src/components/ui/sidebar.tsx`, `topbar.tsx`, `user/src/lib/utils.ts`, `user/src/components/users/users-table.tsx`, `user/src/components/users/user-drawer.tsx`, `user/src/components/ui/command.tsx`, `user/src/components/ui/carousel.tsx`, `page-header.tsx`, `user/src/components/ui/chart.tsx`, `app/settings/page.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `test_phase4_web.py`, `customer-store.ts`, `admin/src/lib/utils.ts`, `admin/src/components/ui/menubar.tsx`, `payment-plans-editor.tsx`, `agent-drawer.tsx`, `agent-types.ts`, `admin/src/components/ui/sidebar.tsx`, `(app)/users/page.tsx`, `(app)/settings/page.tsx`, `admin/src/components/ui/carousel.tsx`, `admin/src/components/ui/command.tsx`, `admin/src/components/ui/form.tsx`, `admin/src/components/ui/chart.tsx`, `admin/src/components/ui/context-menu.tsx`, `admin/src/components/ui/navigation-menu.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `framer-motion`, `next`, `@tanstack/react-table`, `next-themes`, `tw-animate-css`, `vaul`, `@radix-ui/react-alert-dialog`, `zod`, `devDependencies`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-dialog`, `recharts`, `AgentRegistry`, `embla-carousel-react`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `@radix-ui/react-accordion`, `@radix-ui/react-avatar`, `date-fns`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `sonner`, `tailwind-merge`, `@tanstack/react-query`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _673 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent_repository.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05504950495049505 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.04859335038363171 - nodes in this community are weakly interconnected._
- **Should `agents-context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07080200501253132 - nodes in this community are weakly interconnected._