# Changelog

## Credit packs — Starter pack and Growth pack (2026-09-06)

- **Volume packs.** Migration `019_credit_packs_topup` keeps `taster_100` Taster ₹100 / $1 / 200 credits and adds `starter_pack_200` **Starter pack** ₹200 / $2 / 500 credits and `growth_pack_500` **Growth pack** ₹500 / $5 / 1500 credits (`price_inr_minor` / `price_usd_minor` / `credits`). Sort order 10 / 20 / 30. Credits tab already lists every active pack from `GET /tenant/catalog`. Rollback: `019_credit_packs_topup_rollback.sql`.

## TS-22 — Posts tab Generate Post wizard (2026-09-06)

- **Posts tab wizard.** `PostsTab` **Generate Post** (next to Refresh) opens `GeneratePostDialog` (`PostsTab.tsx`, `GeneratePostDialog.tsx`). Switch default is **text only** (`withImage` false). Next calls `postsApi.generate({ skipImage })` → `POST /posts/generate` (`frontend/shared/api/index.ts`). Text sends `skipImage: true`; image sends `skipImage: false`. Preview is read-only (`generated_text` in a `<p>`). Confirm calls `postsApi.publish(id)` → `POST /posts/{id}/publish` with no extra debit (`posts.py` `publish_post_endpoint` has no `consume_for_action`). Cancel/close invalidates `["posts"]` and leaves the draft; there is no delete. No Active topic (`listPersonaTopics` / `is_active`) disables Generate Post and Next; copy is `Activate a topic on Topic Weights.` Image mode with null `image_url` still shows preview and warns `Image generation failed.` Next is disabled while in-flight (`retry: false`). Confirm is disabled when `enabled_publishable_count === 0`.
- **Generate API.** `GeneratePostRequest.skipImage` bool, default false (`schemas/post.py`). `generate_post_endpoint` peeks wallet then `run_generation_pipeline(..., skip_image=body.skipImage)`, then `consume_for_action` after a successful save (`posts.py`). HTTP 201. `action_key` is `text_post` when `skipImage` else `image_post`. Peek 402 detail: `Insufficient credits — {action_key} costs {amount}, balance is {balance}`. Failed generate does not debit. No `quota_slot`. Cron `generate_job` still does not debit.
- **Roles.** `POST /posts/generate` requires owner/admin/editor (`ctx.require_tenant_roles` on `generate_post_endpoint`), same as publish/manual.
- **Meter.** Migration `018_meter_text_image_costs.sql` updates existing keys only: `text_post` 1→**10**, `image_post` 10→**30**. Does not INSERT keys or touch `manual_post`. Rollback `018_meter_text_image_costs_rollback.sql` restores 1 / 10.
- **Post Generation tab.** Unchanged: button still **Generate Post** → `postsApi.manualPublish` → `POST /posts/manual` (`PostGenerationTab.tsx`). Not this wizard.
- **Contract.** `.agent/contracts/C-posts-manual.md` TS-16 debit amended: USER `POST /posts/generate` may `consume_for_action` `text_post` / `image_post` after a successful generate save. Locked wizard: `.agent/contracts/TS-22.md`.

## TS-18 — First posts stay cron-only; Topic Weights equal-weight visual (2026-09-06)

- **Generate CTA (Q-1 B).** `GenerateFirstPostsButton` stays always `disabled` (`SummaryCard.tsx`). It has no `onClick` and does not call `POST /posts/generate`. Label remains **Generate My First Posts**. Persona badge is **Persona ready** (not “Ready to Generate”). Helper copy: `First posts come from your subscription schedule.` The screenshot toast `Could not generate a first post. Activate one topic under Topic Weights, then try again.` is not in source. The TS-14 generate-on-complete path is historical and is not restored.
- **USER nginx cache.** `location = /index.html` sends `Cache-Control: no-cache`. `location /assets/` sends `Cache-Control: public, max-age=31536000, immutable` (`frontend/user/nginx.conf`). `linkedin-user` has no source bind-mount (`docker-compose.yml`); the USER image must be rebuilt for localhost:3005 to match source.
- **Topic Weights (Q-2 A).** Grid (`Topics.tsx`) and cards (`TopicRow.tsx`) use `min-w-0`. The duplicate weight fill bar (`width: ${weight * 100}%`) is removed. The Radix slider remains `min={0.05}` `max={1}` `step={0.05}`.

## TS-16 — Plan quotas + hourly draft generate (2026-09-06)

- **Quotas, not monthly credits.** Plans grant daily/weekly post slots. Catalog JSON keys are `daily_text`, `daily_image`, `weekly_image` (`.agent/contracts/C-subscription-quota-schema.md` §1; `billing.py` `serialize_plan` / `PLAN_WRITE_FIELDS`). `monthly_credits` stays in schema and HTTP; 017 seeds **0**. USER Subscription must not show N credits/month (`SubscriptionTab.tsx`; `.agent/contracts/C-billing-catalog.md` §2.2).
- **Free.** Display name **Free** (was Free trial). Description exactly `1 high-quality image post per week. No expiry.` (`017_subscription_quota.sql`).
- **Mix.** free 0/0/1 weekly image; starter 1/0/3 additive; growth 3/2/0; scale catalog 20/10/0. USER Scale card still lists 20 text + 10 image / day and adds: scheduled generation is at most 1 post per hour (up to 24 per UTC day). Cron delivery cap is Q-2b (`.agent/contracts/C-subscription-quota.md` §0).
- **Cron.** Hourly UTC `CronTrigger(minute=0, timezone="UTC")`, job id `generate_job` (`scheduler.py`). At most **1** draft per tenant per UTC hour (`generate_job.py`). Drafts only — no LinkedIn publish, no credit debit. Eligible `agent_subscriptions` `post_gen` + `active`|`trialing`.
- **Credits.** `POST /posts/manual` (`posts.py` `manual_post_endpoint`) calls `consume_for_action(ctx.tenant_id, "manual_post")` (**50**) after a successful `publish_post`. Cron / `POST /posts/improve` do not debit. Still no HTTP route named `consume_for_action`. TS-22 amends USER `POST /posts/generate`: it may debit `text_post` / `image_post` on Next.
- **Topics.** Target Posts Per Week stays visible and **disabled** (`Topics.tsx`). Generate My First Posts stays **disabled**; helper copy: first posts come from the subscription schedule (`SummaryCard.tsx`). Onboarding complete does not call `run_generation_pipeline`.
- **Schema.** Migration `017_subscription_quota` + rollback `017_subscription_quota_rollback.sql`. Adds quota columns, `subscription_quota_usage`, `posts.tenant_id` / `posts.quota_slot`, matching `jobs` columns. `GET /posts` filters `p.tenant_id = ctx.tenant_id`.
- **Env.** No new env vars. Existing `DISABLE_SCHEDULER=true` skips the in-process scheduler, including `generate_job` (`scheduler.py`).
- **Contract.** `.agent/contracts/C-subscription-quota.md`, `.agent/contracts/C-subscription-quota-schema.md`, `.agent/contracts/C-billing-catalog.md`.

## TS-14 — Generate My First Posts (2026-09-06)

- **Cause.** Topics review called `POST /onboarding/adaptive/complete`, which upserted topics as draft (`is_active=false`) then passed that id to generation (`is_active=true` required). Failure was swallowed (`hadPost: false`); the UI stayed on `/topics` with no toast.
- **Fix.** If no topic is active, activate the first onboarding topic (exclusive), then generate. Success navigates to Post Gen. Failure toasts `postError`.

## TS-11 — Description TipTap + Improve the text (2026-09-05)

- **Editor.** Post Generation Description is a TipTap field (bold, italic, lists, links) with **Improve the text**.
- **Improve.** `POST /posts/improve` sends plain title/description/tags, returns sanitized HTML + `plainText`. Preview Dialog **Accept** / **Discard**. Timeout 120s. No credit debit. Gemini polish (light edit); empty description + title generates a body.
- **Publish.** Generate Post still `POST /posts/manual` with HTML stripped to plain text. Composed body cap 3000.
- **Contract.** `.agent/contracts/C-posts-improve.md`.

## TS-10 — Post Generation image policy: JPEG/PNG; USER nginx 10m (2026-08-31)

- **JPEG/PNG only.** Post Generation (`POST /posts/manual`) accepts only `image/jpeg` and `image/png`. GIF, WebP, and `image/jpg` are rejected. Backend: HTTP 400 `{"detail":"Image must be JPEG or PNG"}` before save (`posts.py` `_save_uploaded_image`). USER tab file input `accept` is `image/jpeg,image/png,.jpg,.jpeg,.png`; a disallowed file (including GIF) toasts `Image must be JPEG or PNG` and does not call `postsApi.manualPublish`.
- **USER nginx 10m.** USER `frontend/user/nginx.conf` (`server` listen 3005) has `client_max_body_size 10m;` immediately after `index index.html;`. ADMIN nginx is unchanged (compiled default 1m). No app or UI byte-size check. No new env var.
- **Oversize may still 413.** A request body over USER nginx `10m` is still nginx HTTP 413 (`text/html`). There is no friendly oversize toast; axios may still show `Request failed with status code 413`.
- **Rollback.** Remove the single line `client_max_body_size 10m;` from USER `frontend/user/nginx.conf` (after `index index.html;`), then rebuild `linkedin-user`. ADMIN nginx was never changed.
- **Contract.** Image policy: [`.agent/contracts/C-posts-manual.md`](../../../../../.agent/contracts/C-posts-manual.md). Multipart field remains `image` (not base64). No debit on generate/publish.

## TS-8 — Remove USER Overview; PostgreSQL billing catalog (2026-08-31)

- **USER Overview gone.** The USER workspace Overview page is unrouted and deleted. `/dashboard` navigates to `/dashboard/agents/post-gen`. The sidebar is a static list (Post Gen, Lead Gen Soon, Analytics Soon, Connections) and no longer fetches tenant overview.
- **`GET /tenant/overview` deleted.** The tenant overview handler is removed (no stub). `GET /tenant/credits` remains. Shared client `tenantApi.overview` is gone. Contract: `.agent/contracts/C-overview-removal.md`.
- **Catalog from PostgreSQL.** Post Gen Subscription and Credits tabs read `GET /tenant/catalog` (`{plans, packs, action_costs}`). Mock billing files and banners are gone. Envelope and field shapes: `.agent/contracts/C-billing-catalog.md` §2–§3.
- **Admin `/billing`.** ADMIN login/home still land on `/overview`. Control nav **Billing** opens a catalog CRUD page at `/billing` (`GET /admin/catalog`, POST/PATCH plans/packs/action_costs). No DELETE; soft-off via `is_active`. Writes: staff `tech` / `finance`. Contract: `.agent/contracts/C-billing-catalog.md` §4.
- **Dummy packs.** Locked seed (`013_billing_catalog_seed_locked`): active pack `taster_100` Taster ₹100 / $1 / 200 credits (`price_inr_minor=10000`, `price_usd_minor=100`). 011 packs `taster_99`, `creator_499`, `pro_999`, `agency_2499` stay in the table with `is_active=false`.
- **Display-only purchases.** Upgrade / Current / Purchase stay visible and toast `Catalog only — billing is not charged yet.` `select_plan`, `purchase_pack`, and `consume_for_action` are not mounted on any tenant or admin route.
- **Dual INR/USD.** Catalog rows use `price_inr_minor` and `price_usd_minor` (paise / cents). USER UI formats INR only (`price_inr_minor / 100` with ₹). ADMIN edits both columns. `currency` and `price_minor` are dropped (migration `012_billing_catalog_dual_price`).
- **Meter 50/1/10.** Active Post Gen action costs: `manual_post=50`, `text_post=1`, `image_post=10`. `text_regenerate` / `image_regenerate` are inactive, not deleted.
