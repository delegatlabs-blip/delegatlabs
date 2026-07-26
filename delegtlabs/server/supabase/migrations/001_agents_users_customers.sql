-- Delegate Labs agents + users + customers schema for Supabase
-- Run in Supabase SQL editor when your project is ready.

create extension if not exists "pgcrypto";

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  version text not null default '1.0.0',
  description text not null default '',
  short_description text not null default '',
  detailed_description text not null default '',
  tags jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  redirect_url text not null default '',
  demo_url text not null default '',
  documentation_url text not null default '',
  payment_type text not null default 'subscription' check (payment_type in ('subscription', 'credit')),
  subscription_plans jsonb not null default '[]'::jsonb,
  credit_packs jsonb not null default '[]'::jsonb,
  price numeric not null default 0,
  currency text not null default 'USD',
  billing_interval text not null default 'monthly',
  plan_name text not null default '',
  listed_on_website boolean not null default true,
  featured boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agents_slug_idx on public.agents (slug);
create index if not exists agents_listed_idx on public.agents (listed_on_website, status);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  company text not null default '',
  role text not null default 'Viewer',
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_idx on public.users (email);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  company text not null default '',
  plan text not null default 'Starter' check (plan in ('Free', 'Starter', 'Pro', 'Enterprise')),
  status text not null default 'active' check (status in ('active', 'trial', 'churned', 'suspended')),
  agents_purchased integer not null default 0,
  total_spend numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_idx on public.customers (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
before update on public.agents
for each row execute function public.set_updated_at();

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- Public read for website (optional — web API uses service role for now)
alter table public.agents enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;

drop policy if exists "Public can read listed agents" on public.agents;
create policy "Public can read listed agents"
on public.agents for select
using (listed_on_website = true and status = 'active');
