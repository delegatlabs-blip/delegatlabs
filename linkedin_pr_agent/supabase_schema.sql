create extension if not exists pgcrypto;

create table if not exists public.linkedin_accounts (
  account_id text primary key,
  member_urn text not null,
  encrypted_access_token bytea not null,
  expires_at timestamptz not null,
  scope text,
  profile jsonb not null default '{}'::jsonb,
  reconsent_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.linkedin_accounts enable row level security;
revoke all on public.linkedin_accounts from anon, authenticated;
grant all on public.linkedin_accounts to service_role;

create or replace function public.upsert_linkedin_account(
  p_account_id text,
  p_access_token text,
  p_expires_at timestamptz,
  p_member_urn text,
  p_encryption_key text,
  p_scope text default null,
  p_profile jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.linkedin_accounts (
    account_id,
    member_urn,
    encrypted_access_token,
    expires_at,
    scope,
    profile,
    reconsent_notified_at,
    updated_at
  )
  values (
    p_account_id,
    p_member_urn,
    pgp_sym_encrypt(p_access_token, p_encryption_key),
    p_expires_at,
    p_scope,
    coalesce(p_profile, '{}'::jsonb),
    null,
    now()
  )
  on conflict (account_id) do update set
    member_urn = excluded.member_urn,
    encrypted_access_token = excluded.encrypted_access_token,
    expires_at = excluded.expires_at,
    scope = excluded.scope,
    profile = excluded.profile,
    reconsent_notified_at = null,
    updated_at = now();
end;
$$;

create or replace function public.get_linkedin_account(
  p_account_id text,
  p_encryption_key text
)
returns table (
  account_id text,
  access_token text,
  expires_at timestamptz,
  member_urn text,
  scope text,
  profile jsonb,
  reconsent_notified_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    la.account_id,
    pgp_sym_decrypt(la.encrypted_access_token, p_encryption_key) as access_token,
    la.expires_at,
    la.member_urn,
    la.scope,
    la.profile,
    la.reconsent_notified_at
  from public.linkedin_accounts la
  where la.account_id = p_account_id;
$$;

create or replace function public.mark_linkedin_account_notified(p_account_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.linkedin_accounts
  set reconsent_notified_at = now()
  where account_id = p_account_id;
$$;

revoke all on function public.upsert_linkedin_account(
  text, text, timestamptz, text, text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.get_linkedin_account(text, text) from public, anon, authenticated;
revoke all on function public.mark_linkedin_account_notified(text) from public, anon, authenticated;

grant execute on function public.upsert_linkedin_account(
  text, text, timestamptz, text, text, text, jsonb
) to service_role;
grant execute on function public.get_linkedin_account(text, text) to service_role;
grant execute on function public.mark_linkedin_account_notified(text) to service_role;
