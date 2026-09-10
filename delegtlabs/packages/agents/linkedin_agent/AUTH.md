# Authentication & multi-tenancy (user side)

How a customer gets into the LinkedIn agent, and how their workspace is kept separate
from everyone else's. Introduced by migration `007_user_auth_tenancy`.

## The model

```
users                one row per human
  auth_identities      how they prove it (email, linkedin) — many per user
  tenant_members       which workspaces they belong to, and in what role
tenants              one workspace per signup; the signer is its owner
user_sessions        server-side session handle, so logout can revoke
email_otps           short-lived hashed sign-in codes
```

The three-layer split is what makes both entry paths land on the **same** account:

- Sign up with email, connect LinkedIn later → a second row in `auth_identities`.
- Sign up with LinkedIn directly → the LinkedIn identity is created first, and the
  workspace is provisioned right after LinkedIn confirms who you are.

## Sign-in flow

One unified entry screen at `/signin` — there is no separate sign-up page, because the
backend already knows whether the address is new.

```
POST /auth/email/start   { email }
      -> { ok, is_new, resend_in_seconds, dev_mode }
      -> emails a 6-digit code

POST /auth/email/verify  { email, code, full_name? }
      -> sets the antgrav_session cookie
      -> new address: creates the user, provisions "<Name>'s Workspace", role owner
      -> known address: signs in to the existing workspace

GET  /auth/me            -> { authenticated, user, tenant, tenants }
POST /auth/profile       { full_name }   -> finishes a profile created without a name
POST /auth/signout       -> revokes the session row, clears cookies
```

`full_name` is collected on the client only when `is_new` is true, so returning users
never see it.

### LinkedIn as the identity provider

`GET /auth/linkedin/login` serves two intents, chosen from the session — never from a
query parameter:

| Session | Intent | Result |
|---|---|---|
| signed out | `login` | resolve/create the user, provision a workspace, sign in **and** connect |
| signed in | `connect` | attach LinkedIn to the workspace already in the session |

The intent is stored on the `oauth_states` row and read back in the callback, so a
`login` state cannot be replayed as a `connect` against someone else's tenant.

**Account linking.** A LinkedIn identity attaches to an existing user only when LinkedIn
asserts `email_verified` for a matching address. An unverified assertion creates a new
account instead — otherwise anyone able to set an email at an IdP could take over an
account. See `resolve_login` in `backend/app/services/users.py`.

## Tenancy

The active tenant comes from the **session**, and is checked against `tenant_members` on
every request (`backend/app/api/auth_context.py`).

`X-Tenant-Id` is honoured **only for platform staff**, who legitimately act across
tenants. Before 007 that header was read for everybody with no membership check, so any
authenticated caller could act on any tenant by setting it.

## OTP security

| Control | Setting | Default |
|---|---|---|
| Code length | `OTP_LENGTH` | 6 |
| Lifetime | `OTP_TTL_SECONDS` | 600 (10 min) |
| Attempts per code | `OTP_MAX_ATTEMPTS` | 5, then the code is burned |
| Resend cooldown | `OTP_RESEND_COOLDOWN_SECONDS` | 60s |
| Per-address budget | `OTP_MAX_PER_EMAIL_HOUR` | 5/hour |
| Per-IP budget | `OTP_MAX_PER_IP_HOUR` | 20/hour |

Codes are stored only as a peppered SHA-256 bound to the email address, so a code minted
for one address cannot be replayed against another. Issuing a new code consumes any
outstanding one. A correct code is consumed on use and cannot be replayed.

### Local development

```bash
OTP_DEV_MODE=true      # accept 123456, and log codes instead of emailing
```

A code must still have been **requested** for that address first — dev mode does not turn
the endpoint into "sign me in as anyone".

> `OTP_DEV_MODE` is keyed off its own flag, never `NODE_ENV`, so enabling it is always a
> deliberate act. Turn it off in production.

## SMTP

Delivery goes through `backend/app/services/mailer.py`. Leave `SMTP_HOST` blank and mail
is logged rather than sent; set it and `SmtpMailer` takes over with no call-site change.

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM_EMAIL=no-reply@yourdomain.com
SMTP_STARTTLS=true
```

## Sessions

A 7-day httpOnly cookie (`antgrav_session`) carrying `sub` (user), `tid` (tenant), and
`sid` (session). Both halves are required on every request: the JWT must verify **and**
the `user_sessions` row must still be live — so sign-out revokes immediately instead of
waiting for expiry.

## Migration

```bash
# forward — applied automatically on backend startup
python -m app.db.migrate

# rollback (DESTRUCTIVE: drops all users, identities, sessions)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f app/db/rollbacks/007_user_auth_tenancy_rollback.sql
```

The rollback deliberately lives **outside** `app/db/migrations/`, because `migrate.py`
applies every `.sql` file in that directory in sorted order.

Existing local data is preserved: 007 seeds a real user (`dev@local.test`) as owner of
the pre-existing Default Workspace, so content created before the cutover stays reachable.

## Known gaps

- **RLS is defence-in-depth only, not active enforcement.** The policies from
  `003_saas_rls_seed.sql` (and the ones 007 adds) require `app.user_id` / `app.tenant_id`
  session variables that only `rls_session()` sets — and it currently has no callers;
  every query goes through `execute_raw`, which does not set them. The app also connects
  as the table owner, which bypasses RLS regardless. **Isolation today rests on the
  application-level tenant checks described above**, not on Postgres. Closing this means
  routing endpoints through `rls_session()` and giving the app a non-owner role.
- `POST /auth/admin-login` and `GET /auth/admin-me` still use the shared `owner` identity
  and auto-elevate when `NODE_ENV=development`. That is the admin surface, deliberately
  left alone here.
- Team invitations are not implemented — every signup currently produces a workspace with
  exactly one member. `tenant_members` already supports more.
