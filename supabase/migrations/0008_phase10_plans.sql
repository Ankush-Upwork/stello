-- ============================================================================
-- Sello — Phase 10: plans + subscriptions (SaaS readiness)
-- No payment gateway. Plans drive usage limits and the pricing page.
-- Run AFTER 0007.
-- ============================================================================

create table if not exists public.plans (
  id                  text primary key,           -- 'free' | 'starter' | 'pro' | 'business'
  name                text not null,
  price_monthly       integer not null default 0, -- INR/month (placeholder)
  product_limit       integer,                    -- null = unlimited
  monthly_sales_limit integer,                    -- null = unlimited
  features            text[] not null default '{}',
  sort_order          integer not null default 0
);

-- Seed / upsert the tiers
insert into public.plans (id, name, price_monthly, product_limit, monthly_sales_limit, features, sort_order) values
  ('free', 'Free', 0, 50, 50,
    array['Up to 50 products','50 sales per month','Basic dashboard','WhatsApp invoices'], 1),
  ('starter', 'Starter', 499, 500, null,
    array['Up to 500 products','Unlimited sales','WhatsApp invoices','Low stock alerts','Reports'], 2),
  ('pro', 'Pro', 999, null, null,
    array['Everything in Starter','Unlimited products','AI sale assistant','Supplier & purchase management','Advanced reports','Staff login (soon)'], 3),
  ('business', 'Business', 2499, null, null,
    array['Everything in Pro','Multi-store','WhatsApp API','Custom branding','Priority support'], 4)
on conflict (id) do update set
  name = excluded.name,
  price_monthly = excluded.price_monthly,
  product_limit = excluded.product_limit,
  monthly_sales_limit = excluded.monthly_sales_limit,
  features = excluded.features,
  sort_order = excluded.sort_order;

create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  plan_id     text not null references public.plans (id) default 'free',
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

-- Plans are public reference data — readable by anyone signed in (and anon).
drop policy if exists "plans_read_all" on public.plans;
create policy "plans_read_all" on public.plans for select using (true);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);
drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Give new users a Free subscription automatically (extends 0001 trigger fn)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan_id)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Backfill a Free subscription for any existing users who don't have one.
insert into public.subscriptions (user_id, plan_id)
select id, 'free' from auth.users
on conflict (user_id) do nothing;
