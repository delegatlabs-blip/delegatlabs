# AI Agents Marketplace --- Master Build Prompt

## Role

You are a senior product designer, UX architect, and full-stack Next.js
engineer.

Build a premium, modern, visually impressive AI Agents Marketplace
website using Next.js. The website must feel like a high-end SaaS
product marketplace, not a generic e-commerce store.

The platform sells and showcases AI agents for business, marketing,
sales, SEO, social media, lead generation, automation, content creation,
and other professional workflows.

The website must be:

-   Modern
-   Premium
-   Eye-catching
-   Conversion-focused
-   Fast
-   Responsive
-   Accessible
-   SEO-friendly
-   Scalable
-   Easy to manage through an admin panel

The final experience should make visitors immediately understand:

> "I can discover, compare, purchase, and start using powerful AI agents
> from one marketplace."

------------------------------------------------------------------------

# 1. Product Concept

Create a marketplace where AI agents are listed as digital products.

Each agent should have:

-   Name
-   Logo or visual identity
-   Category
-   Short description
-   Detailed description
-   Key features
-   Pricing
-   Screenshots
-   Demo video or demo link
-   Rating
-   Reviews
-   Version
-   Supported platforms
-   Tags
-   Seller/provider information
-   Agent panel URL
-   Purchase CTA

The platform owner must be able to register and manage agents from an
admin interface.

When a user purchases an agent, the system should:

1.  Process the payment.
2.  Record the purchase.
3.  Add the agent to the user's dashboard.
4.  Provide access to the configured agent panel URL.
5.  Redirect the user to the external agent panel when the user clicks
    "Open Agent" or "Launch Agent".

The agent panel URL must be configurable for every individual agent.

Example:

``` text
Agent Name: LinkedIn Content Creator
Category: Social Media
Price: £49/month
Features:
- Generate LinkedIn posts
- Create content calendars
- Generate hooks
- Repurpose long-form content
Agent Panel URL:
https://agent.example.com/linkedin-content
```

------------------------------------------------------------------------

# 2. Recommended Technology Stack

Use:

-   Next.js with App Router
-   TypeScript
-   React
-   Tailwind CSS
-   shadcn/ui
-   Radix UI primitives where appropriate
-   Framer Motion or Motion for subtle animations
-   PostgreSQL
-   Prisma ORM
-   Authentication with a modern secure authentication solution
-   Stripe for payments
-   Optional Stripe Connect for marketplace sellers
-   Zod for validation
-   React Hook Form
-   Recharts for dashboard analytics
-   Next.js Image optimization
-   Server Components wherever possible
-   Server Actions or secure API routes
-   Vercel-ready deployment architecture

Use strict TypeScript.

Use a clean modular architecture.

Avoid unnecessary client-side JavaScript.

------------------------------------------------------------------------

# 3. Brand and Visual Direction

The website should look like a premium AI SaaS marketplace.

Do not create a basic dashboard or ordinary card grid.

The visual direction should combine:

-   Premium AI startup aesthetics
-   Modern SaaS marketplaces
-   High-end technology brands
-   Editorial layouts
-   Strong typography
-   Subtle gradients
-   Soft glass effects
-   Beautiful spacing
-   Elegant micro-interactions
-   Strong visual hierarchy

Use a dark-first premium theme with an optional light mode.

Suggested visual direction:

-   Deep charcoal or near-black backgrounds
-   Soft white text
-   Muted gray secondary text
-   Electric accent gradients
-   Purple, blue, cyan, or violet accents
-   Subtle glowing effects
-   Fine borders
-   Soft shadows
-   Gradient mesh backgrounds
-   Abstract AI-inspired visual elements

Do not overuse gradients.

The design must remain professional and easy to use.

Use large typography and strong whitespace.

The overall visual feeling should be:

> "The App Store for powerful AI employees and business agents."

------------------------------------------------------------------------

# 4. Main Website Navigation

Create a premium global navigation bar.

Desktop navigation:

-   Logo
-   Explore Agents
-   Categories
-   Solutions
-   Pricing
-   Resources
-   Search
-   Sign In
-   Get Started

Primary CTA:

``` text
Explore AI Agents
```

Secondary CTA:

``` text
Become a Partner
```

Mobile navigation:

-   Hamburger menu
-   Logo
-   Search icon
-   Sign-in button

The header should become sticky after scrolling.

Use a subtle backdrop blur.

------------------------------------------------------------------------

# 5. Homepage

Create an exceptional homepage.

## Hero Section

The hero must immediately communicate the value proposition.

Example headline:

> AI Agents That Work While You Sleep

Alternative:

> Discover the AI Workforce for Your Business

Supporting text:

> Explore powerful AI agents for marketing, sales, SEO, content, lead
> generation, automation, and more.

Primary CTA:

``` text
Explore AI Agents
```

Secondary CTA:

``` text
Build Your AI Stack
```

Hero visual:

Create a premium visual showing multiple AI agent cards floating around
a central AI marketplace interface.

Example floating agents:

-   SEO Agent
-   LinkedIn Content Agent
-   Lead Generation Agent
-   Email Marketing Agent
-   Sales Research Agent

Use:

-   Floating cards
-   Soft glow
-   Animated gradient mesh
-   Subtle particles
-   Motion effects
-   Product preview UI

The hero should be visually impressive without hurting performance.

------------------------------------------------------------------------

# 6. Homepage Sections

Create the following sections.

## Section A: Trust Bar

Display:

-   Trusted by modern teams
-   Customer logos
-   Usage statistics

Example:

``` text
10,000+ workflows automated
250+ AI agents
50+ business use cases
```

------------------------------------------------------------------------

## Section B: Explore by Category

Display attractive category cards.

Categories:

### Marketing

AI agents for campaigns, marketing strategy, and growth.

### Social Media

LinkedIn, Instagram, Twitter/X, and content automation agents.

### SEO

Keyword research, content optimization, audits, and SEO strategy.

### Lead Generation

Prospecting, enrichment, qualification, and outreach.

### Sales

Research, CRM workflows, proposals, and sales intelligence.

### Content Creation

Blog posts, social posts, scripts, newsletters, and copywriting.

### Customer Support

AI agents for support, knowledge bases, and customer communication.

### Automation

Workflow automation and repetitive task execution.

Each category card should include:

-   Icon
-   Gradient visual
-   Category name
-   Description
-   Agent count
-   Hover animation

CTA:

``` text
Explore Category
```

------------------------------------------------------------------------

## Section C: Featured AI Agents

Create a premium agent card grid.

Each card should show:

-   Agent logo
-   Agent name
-   Category
-   Short description
-   Rating
-   Number of users
-   Pricing
-   Feature tags
-   "View Agent" CTA

Example agents:

### LinkedIn Growth Agent

Category: Social Media

Description:

> Create engaging LinkedIn content, build content calendars, and grow
> your professional presence.

Features:

-   Post generation
-   Content calendar
-   Hook generator
-   Repurposing

Price:

``` text
£29/month
```

------------------------------------------------------------------------

### SEO Strategist

Category: SEO

Description:

> Research keywords, analyze competitors, and build SEO content
> strategies.

Features:

-   Keyword research
-   Competitor analysis
-   Content briefs
-   SEO recommendations

Price:

``` text
£49/month
```

------------------------------------------------------------------------

### Lead Hunter AI

Category: Lead Generation

Description:

> Find, qualify, and organize high-quality prospects for your business.

Features:

-   Prospect research
-   Lead qualification
-   ICP matching
-   Export-ready lists

Price:

``` text
£79/month
```

------------------------------------------------------------------------

# 7. Agent Card Design

The AgentCard component is extremely important.

Each card should feel premium.

Structure:

``` text
[Agent Logo]

[Category Badge]

Agent Name

Short description

[Feature Tag] [Feature Tag] [Feature Tag]

★★★★★ 4.9
1,200 users

From £29/month

[View Agent]
```

Hover behavior:

-   Card slightly lifts
-   Border glow appears
-   Image scales subtly
-   CTA becomes more prominent
-   Background gradient appears subtly

Do not create excessive animations.

------------------------------------------------------------------------

# 8. Explore Agents Page

Route:

``` text
/explore
```

This should be the main marketplace browsing page.

Layout:

-   Page heading
-   Search bar
-   Category filter
-   Price filter
-   Rating filter
-   Popularity filter
-   Newest filter
-   Featured toggle
-   Grid/list toggle

Search examples:

``` text
Search AI agents...
```

Users should be able to search:

-   Agent name
-   Description
-   Category
-   Tags
-   Features

Sort options:

-   Most Popular
-   Highest Rated
-   Newest
-   Price: Low to High
-   Price: High to Low

Use URL query parameters so filters are shareable.

Example:

``` text
/explore?category=seo&sort=popular
```

------------------------------------------------------------------------

# 9. Category Pages

Route:

``` text
/categories/[slug]
```

Example:

``` text
/categories/seo
/categories/social-media
/categories/lead-generation
```

Each category page should contain:

-   Category hero
-   Category description
-   Featured agents
-   All agents
-   Category-specific benefits
-   FAQ section
-   Related categories

Example SEO category heading:

> AI SEO Agents for Faster Organic Growth

The page should be optimized for search engines.

------------------------------------------------------------------------

# 10. Agent Detail Page

Route:

``` text
/agents/[slug]
```

This is the primary conversion page.

The page should feel like a premium product landing page.

## Top Section

Left side:

-   Agent logo
-   Category
-   Agent name
-   Short description
-   Rating
-   User count
-   Trust badges

Right side:

-   Pricing card
-   Price
-   Billing period
-   Main CTA
-   Secondary demo CTA

Example:

``` text
SEO Strategist

AI-powered SEO research and content strategy.

★★★★★ 4.9
Used by 2,400+ marketers

£49/month

[Get Access]
[Watch Demo]
```

------------------------------------------------------------------------

# 11. Agent Detail Sections

Include:

## Overview

Detailed explanation of the agent.

## Features

Use beautiful feature cards.

Example:

-   Keyword Research
-   Competitor Analysis
-   Content Brief Generation
-   SEO Audits

## How It Works

Use a 3-step process:

``` text
1. Connect your workflow
2. Give the agent a task
3. Get actionable results
```

## Screenshots

Beautiful product screenshots or mockups.

## Demo

Support:

-   Demo video
-   Interactive preview
-   External demo URL

## Use Cases

Example:

-   Agencies
-   Startups
-   Freelancers
-   Marketing teams

## Pricing

Support:

-   One-time pricing
-   Monthly subscriptions
-   Annual subscriptions
-   Multiple pricing tiers

Example:

### Starter

£29/month

### Professional

£79/month

### Enterprise

Custom pricing

Highlight the recommended plan.

## Reviews

Display:

-   Rating
-   Review count
-   User reviews

## FAQ

Use accordion components.

## Related Agents

Show similar AI agents.

------------------------------------------------------------------------

# 12. Purchase Flow

The purchase experience must be extremely simple.

Flow:

``` text
Agent Detail
    ↓
Click Get Access
    ↓
Login/Register if required
    ↓
Checkout
    ↓
Payment
    ↓
Payment Confirmation
    ↓
Agent Added to Account
    ↓
Open Agent Panel
```

Use Stripe Checkout or an equivalent secure payment flow.

After successful payment:

-   Create purchase record
-   Associate purchase with user
-   Mark payment as successful
-   Grant agent access
-   Store the agent panel URL
-   Send confirmation email
-   Show success page

------------------------------------------------------------------------

# 13. Agent Panel Redirect

Every agent must have a configurable external panel URL.

Example:

``` text
agentPanelUrl:
https://app.example.com/agents/seo
```

When the user clicks:

``` text
Open Agent
```

redirect them to the configured URL.

Possible access logic:

``` text
User owns agent
    ↓
Show Open Agent button
    ↓
Redirect to agentPanelUrl
```

If the user has not purchased:

``` text
Show Get Access
```

Do not expose private agent URLs to unauthorized users.

If required, support secure signed redirect tokens.

Example concept:

``` text
/platform/agents/[id]/launch
```

The server verifies:

1.  User is authenticated.
2.  User owns the agent.
3.  Agent is active.
4.  The configured external URL is valid.

Then redirect the user.

------------------------------------------------------------------------

# 14. Authentication

Support:

-   Email/password
-   Google login
-   Optional GitHub login
-   Email verification
-   Password reset
-   Secure sessions

User roles:

``` text
BUYER
SELLER
ADMIN
```

A user may be both buyer and seller.

Protect:

``` text
/dashboard
/seller
/admin
```

------------------------------------------------------------------------

# 15. Buyer Dashboard

Route:

``` text
/dashboard
```

Create a beautiful SaaS dashboard.

Sidebar:

-   Overview
-   My Agents
-   Purchases
-   Favorites
-   Billing
-   Account Settings

Overview cards:

``` text
Active Agents
Total Spent
Recent Purchases
Saved Agents
```

## My Agents

Display purchased agents.

Each card:

-   Agent logo
-   Name
-   Category
-   Purchase date
-   Status
-   Open Agent button

Example:

``` text
LinkedIn Growth Agent
Active

[Open Agent]
[View Details]
```

------------------------------------------------------------------------

# 16. Seller / Agent Registration

Create a seller onboarding flow.

Route:

``` text
/seller/register
```

The seller should be able to submit an AI agent.

Form fields:

## Basic Information

-   Agent name
-   Short description
-   Full description
-   Category
-   Tags

## Branding

-   Agent logo
-   Cover image
-   Screenshots
-   Demo video

## Features

Dynamic feature list.

Example:

``` text
+ Add Feature
```

Each feature:

``` text
Feature title
Feature description
Icon
```

## Pricing

Support:

-   One-time price
-   Monthly price
-   Annual price
-   Custom pricing

## Agent Access

Important field:

``` text
Agent Panel URL
```

Example:

``` text
https://your-agent-platform.com/agent/123
```

Optional:

``` text
Demo URL
Documentation URL
Support URL
```

## Version

Example:

``` text
v1.0.0
```

## Submit

Button:

``` text
Submit Agent for Review
```

After submission:

``` text
Your agent has been submitted for review.
```

Status:

``` text
DRAFT
PENDING_REVIEW
APPROVED
REJECTED
ARCHIVED
```

------------------------------------------------------------------------

# 17. Seller Dashboard

Route:

``` text
/seller/dashboard
```

Sections:

-   Overview
-   My Agents
-   Add Agent
-   Sales
-   Revenue
-   Analytics
-   Payouts
-   Settings

Analytics:

-   Total sales
-   Revenue
-   Conversion rate
-   Agent views
-   Purchase rate

Use beautiful charts.

------------------------------------------------------------------------

# 18. Admin Panel

Create a powerful admin interface.

Admin routes:

``` text
/admin
/admin/agents
/admin/categories
/admin/users
/admin/orders
/admin/reviews
/admin/settings
```

Admin capabilities:

-   Create agents
-   Edit agents
-   Delete agents
-   Approve agents
-   Reject agents
-   Manage categories
-   Manage pricing
-   Manage users
-   Manage sellers
-   Manage orders
-   View revenue
-   Feature agents
-   Hide agents
-   Manage reviews

Admin agent editor should support all fields:

``` text
name
slug
description
category
features
images
pricing
agentPanelUrl
demoUrl
documentationUrl
version
tags
status
featured
```

------------------------------------------------------------------------

# 19. Data Model

Create a scalable relational database.

Core models:

## User

``` text
id
name
email
passwordHash
avatar
role
createdAt
updatedAt
```

## Category

``` text
id
name
slug
description
icon
image
createdAt
```

## Agent

``` text
id
name
slug
shortDescription
description
logoUrl
coverImageUrl
screenshots
categoryId
sellerId
agentPanelUrl
demoUrl
documentationUrl
version
status
featured
rating
reviewCount
createdAt
updatedAt
```

## AgentFeature

``` text
id
agentId
title
description
icon
```

## PricingPlan

``` text
id
agentId
name
price
currency
billingInterval
features
isPopular
```

## Purchase

``` text
id
userId
agentId
pricingPlanId
amount
currency
paymentProvider
paymentId
status
createdAt
```

## Review

``` text
id
userId
agentId
rating
title
content
status
createdAt
```

## Favorite

``` text
id
userId
agentId
createdAt
```

------------------------------------------------------------------------

# 20. API / Server Actions

Implement secure backend functionality for:

``` text
GET /api/agents
GET /api/agents/[slug]
POST /api/agents
PATCH /api/agents/[id]
DELETE /api/agents/[id]

GET /api/categories
POST /api/categories

POST /api/checkout
POST /api/webhooks/payment

GET /api/dashboard/agents
GET /api/dashboard/purchases

POST /api/agents/[id]/launch

POST /api/reviews
POST /api/favorites
```

Every protected action must verify authentication and authorization.

Do not trust client-provided prices.

Always retrieve pricing from the database server-side.

------------------------------------------------------------------------

# 21. Search and Filtering

Create fast marketplace search.

Search by:

-   Agent name
-   Category
-   Tags
-   Features
-   Description

Filters:

-   Category
-   Price range
-   Rating
-   Pricing model
-   Popularity
-   Newest

Search should be:

-   Debounced
-   URL-compatible
-   Responsive
-   Accessible

------------------------------------------------------------------------

# 22. SEO

Implement excellent SEO.

Every agent page should generate:

-   Title
-   Meta description
-   Canonical URL
-   Open Graph image
-   Twitter card metadata

Use structured data where appropriate:

-   Product
-   SoftwareApplication
-   Review
-   AggregateRating
-   BreadcrumbList

Generate:

``` text
sitemap.xml
robots.txt
```

Use semantic HTML.

Every page should have one clear H1.

Agent pages should be indexable.

------------------------------------------------------------------------

# 23. Performance

Prioritize:

-   Fast initial page load
-   Server Components
-   Static generation where possible
-   Incremental revalidation
-   Optimized images
-   Lazy-loaded videos
-   Minimal client JavaScript
-   Code splitting
-   Skeleton loading states

Target excellent Core Web Vitals.

Avoid unnecessary animations that harm performance.

------------------------------------------------------------------------

# 24. Accessibility

Follow WCAG principles.

Requirements:

-   Keyboard navigation
-   Visible focus states
-   Accessible modals
-   Proper labels
-   Semantic headings
-   Alt text for images
-   Accessible buttons
-   Accessible form validation
-   Sufficient color contrast
-   Screen-reader-friendly components

Do not use icons without accessible labels.

------------------------------------------------------------------------

# 25. Animation System

Use subtle premium animations.

Examples:

-   Fade-up sections
-   Staggered agent cards
-   Hover elevation
-   Button hover effects
-   Gradient movement
-   Smooth page transitions
-   Animated counters
-   Scroll reveal

Avoid:

-   Excessive bouncing
-   Distracting animations
-   Slow page transitions
-   Animation everywhere

The site should feel polished, not gimmicky.

------------------------------------------------------------------------

# 26. Required Components

Create reusable components:

``` text
Navbar
Footer
HeroSection
AgentCard
AgentGrid
CategoryCard
CategoryGrid
SearchBar
FilterSidebar
FilterDrawer
PricingCard
PricingTable
FeatureCard
ReviewCard
RatingStars
AgentScreenshotGallery
AgentHero
AgentLaunchButton
PurchaseButton
CheckoutSummary
DashboardSidebar
DashboardHeader
StatsCard
DataTable
AgentForm
PricingPlanForm
ImageUploader
RichTextEditor
StatusBadge
Modal
Dialog
Toast
Tooltip
Accordion
Tabs
Breadcrumbs
```

Use consistent naming and folder organization.

------------------------------------------------------------------------

# 27. Suggested Project Structure

``` text
app/
  (marketing)/
    page.tsx
    explore/
    categories/
    agents/
    pricing/
    about/

  auth/
    login/
    register/
    forgot-password/

  dashboard/
    page.tsx
    agents/
    purchases/
    settings/

  seller/
    register/
    dashboard/
    agents/

  admin/
    page.tsx
    agents/
    categories/
    users/
    orders/
    settings/

  api/
    agents/
    categories/
    checkout/
    webhooks/

components/
  agents/
  marketplace/
  dashboard/
  admin/
  forms/
  ui/

lib/
  auth/
  db/
  payments/
  validations/
  utils/

prisma/
  schema.prisma
```

------------------------------------------------------------------------

# 28. Seed Data

Create realistic sample data.

Categories:

``` text
Marketing
SEO
Social Media
Lead Generation
Sales
Content Creation
Customer Support
Automation
Research
Finance
```

Sample agents:

``` text
LinkedIn Growth Agent
SEO Strategist
Lead Hunter AI
Content Repurposer
Email Campaign Builder
Sales Research Assistant
Competitor Intelligence Agent
Customer Support Copilot
Marketing Campaign Planner
Blog SEO Writer
```

------------------------------------------------------------------------

# 29. Empty States and Loading States

Design beautiful empty states.

Examples:

``` text
No agents found

Try changing your filters or search terms.
```

Dashboard:

``` text
You haven't purchased any agents yet.

Explore the marketplace and build your AI workforce.
```

Loading states:

-   Skeleton cards
-   Skeleton dashboard rows
-   Skeleton detail sections

Error states should be friendly and actionable.

------------------------------------------------------------------------

# 30. Final Design Quality Requirements

The final website must not look like:

-   A generic template
-   A basic Bootstrap site
-   A plain admin dashboard
-   A simple e-commerce store
-   A basic AI landing page

It must look like a real premium SaaS startup.

Prioritize:

1.  Strong visual hierarchy
2.  Premium typography
3.  Excellent spacing
4.  High-quality agent cards
5.  Beautiful landing page sections
6.  Clear conversion paths
7.  Smooth interactions
8.  Mobile-first responsiveness
9.  Trust-building design
10. Fast performance

------------------------------------------------------------------------

# 31. Important Implementation Rules

Build real functionality, not only static mockups.

Use realistic sample data but structure the application so that data can
later come from a database.

Do not hardcode the agent panel URL inside UI components.

The agent panel URL must come from the database.

Do not allow users to access purchased-agent functionality without
authorization.

Do not trust frontend pricing.

Validate all data server-side.

Use role-based access control.

Use secure payment webhook verification.

Use clean error handling.

Use reusable components.

Keep business logic separate from UI.

------------------------------------------------------------------------

# 32. Final Expected Result

Deliver a complete, polished AI Agents Marketplace that feels like:

> A premium marketplace where businesses discover, compare, purchase,
> and launch AI employees.

The most important experience is:

``` text
Discover Agent
        ↓
Understand Value
        ↓
View Features
        ↓
See Pricing
        ↓
Purchase
        ↓
Access Agent
        ↓
Launch External Agent Panel
```

The final result should be visually exceptional, commercially credible,
scalable, responsive, SEO-friendly, and production-ready.
