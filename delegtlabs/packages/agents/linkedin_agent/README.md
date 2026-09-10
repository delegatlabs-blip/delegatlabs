# LinkedIn agent

Post Gen workspace plus an internal admin catalog. Sign-in and tenancy: [AUTH.md](AUTH.md). Layout: [STRUCTURE.md](STRUCTURE.md). Releases: [CHANGELOG.md](CHANGELOG.md).

## Post Generation image policy (TS-10)

Generate Post on the Post Generation tab uploads an optional image as multipart field `image` to `POST /posts/manual` (not `POST /posts/generate`). Policy is locked in [`.agent/contracts/C-posts-manual.md`](../../../../../.agent/contracts/C-posts-manual.md).

- **JPEG/PNG only.** Allowed MIME strings after normalize (strip, lowercase, cut at first `;`) are exact `image/jpeg` and `image/png`. GIF is rejected. USER file input `accept` is `image/jpeg,image/png,.jpg,.jpeg,.png` (`PostGenerationTab.tsx`). A disallowed type (GIF included) toasts `Image must be JPEG or PNG` and does not call `manualPublish`. Backend gate: HTTP 400 `{"detail":"Image must be JPEG or PNG"}` (`posts.py` `_save_uploaded_image`). Persist map: `image/jpeg` → `.jpg`, `image/png` → `.png`. No GIF→`.png` remap. No magic-byte sniff.
- **USER nginx 10m.** USER `frontend/user/nginx.conf` (`listen 3005`) has `client_max_body_size 10m;` after `index index.html;`. ADMIN nginx has no `client_max_body_size`. There is no application or UI byte-size check.
- **Oversize may still 413.** A body larger than USER nginx `10m` is still nginx HTTP 413 (`text/html`, no FastAPI `{detail}`). Axios may still show `Request failed with status code 413`. That is not rewritten to a friendly toast.
- **Rollback.** Remove `client_max_body_size 10m;` from USER `frontend/user/nginx.conf` (the line after `index index.html;`), then rebuild `linkedin-user`. ADMIN nginx was never changed.

## USER Overview removal

USER Overview is gone. `/` still navigates to `/dashboard`; `/dashboard` navigates to `/dashboard/agents/post-gen`. `TenantOverview` is unrouted and the page file is deleted. Lead Gen and Analytics routes remain; the sidebar marks them Soon.

`GET /tenant/overview` is deleted (no 410/stub). `GET /tenant/credits` stays. Contract: [`.agent/contracts/C-overview-removal.md`](../../../../../.agent/contracts/C-overview-removal.md). Handler evidence: `backend/app/api/endpoints/tenant.py` (catalog at line 23; credits at line 34; no overview route).

## Catalog (PostgreSQL)

Post Gen keeps four tabs: posts, subscription, credits, generation. Subscription and Credits read the PostgreSQL catalog through `GET /tenant/catalog` — not mock billing.

API shapes (do not invent extra keys): [`.agent/contracts/C-billing-catalog.md`](../../../../../.agent/contracts/C-billing-catalog.md). Quota columns: [`.agent/contracts/C-subscription-quota-schema.md`](../../../../../.agent/contracts/C-subscription-quota-schema.md). Cron / manual debit: [`.agent/contracts/C-subscription-quota.md`](../../../../../.agent/contracts/C-subscription-quota.md).

| Caller | Method | Path | Body |
|--------|--------|------|------|
| USER (session) | `GET` | `/tenant/catalog` | `{ "plans", "packs", "action_costs" }` — active only; plans and action_costs `agent_kind=post_gen` (`tenant.py` `catalog`) |
| ADMIN (any staff) | `GET` | `/admin/catalog` | same three keys, including inactive, all `agent_kind` |
| ADMIN (`tech` / `finance`) | `POST` / `PATCH` | `/admin/catalog/plans`, `/packs`, `/action_costs` | one plan / pack / action_cost |

Unauthenticated catalog GET is 401. USER has no catalog write routes. `select_plan` / `purchase_pack` stay unmounted as HTTP. `consume_for_action` is still not an HTTP path; `POST /posts/manual` calls it in Python after a successful LinkedIn `publish_post` (`action_key=manual_post`, 50 credits). USER `POST /posts/generate` may debit `text_post` (10) or `image_post` (30) after a successful generate save. Cron does not debit. Forbidden on catalog JSON: `currency`, `price_minor`, `subscription`, `balance`.

Plan objects include `daily_text`, `daily_image`, `weekly_image` (ints ≥ 0). `monthly_credits` remains in JSON and is seeded **0**; it is not the USER plan benefit. Subscription cards show the quota mix (`SubscriptionTab.tsx`), not N credits/month.

USER prices are INR from `price_inr_minor`. Upgrade / Purchase are display-only (toast: `Catalog only — billing is not charged yet.`). Empty copy: `No plans yet.` / `No credit packs yet.`

Scheduled drafts use the existing in-process scheduler: job id `generate_job`, `CronTrigger(minute=0, timezone="UTC")` (`scheduler.py`). At most one draft per tenant per UTC hour (`generate_job.py`). `DISABLE_SCHEDULER=true` skips that scheduler, including `generate_job`. No new env var.

ADMIN `/billing` is the catalog page (Control nav **Billing**). Login still goes to `/overview`. Dual prices are edited as major units and stored as minor ints. Staff may edit quota ints plus `monthly_credits`. Support can read; writes are disabled when `adminAuthApi.me.role === "support"`. No DELETE SKU control.

## Catalog seed (013 + 019 packs; 017 plan quotas; 018 meter)

Live Post Gen plans (migration `017_subscription_quota`): `free` **Free** 0/0/0 default + quotas 0/0/1; `starter` 49900/499/0 + 1/0/3; `growth` 149900/1499/0 + 3/2/0; `scale` 399900/3999/0 + 20/10/0 (`price_inr_minor` / `price_usd_minor` / `monthly_credits`, then `daily_text` / `daily_image` / `weekly_image`). Free description: `1 high-quality image post per week. No expiry.` Active packs: `taster_100` Taster 10000/100/200 (013); `starter_pack_200` Starter pack 20000/200/500 and `growth_pack_500` Growth pack 50000/500/1500 (019). Meter after `018_meter_text_image_costs`: **50 / 10 / 30** (`manual_post` / `text_post` / `image_post`). Cron does not consume `text_post` / `image_post`. USER generate on Next does. Rollback 019: `app/db/rollbacks/019_credit_packs_topup_rollback.sql` (deletes the two volume packs). Rollback 018: `app/db/rollbacks/018_meter_text_image_costs_rollback.sql` (restores 1 / 10). Rollback 017: `app/db/rollbacks/017_subscription_quota_rollback.sql` (restores 013 plan name/credits; drops quota columns and `posts.tenant_id`).
