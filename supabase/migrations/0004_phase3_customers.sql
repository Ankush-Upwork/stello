-- ============================================================================
-- Sello — Phase 3 schema: customers
-- The three running totals are system-managed: they stay 0 in Phase 3 and are
-- updated automatically by sales in Phase 4.
-- Run AFTER 0003.
-- ============================================================================

create table if not exists public.customers (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  business_id            uuid not null references public.businesses (id) on delete cascade,
  name                   text not null,
  phone                  text,
  email                  text,
  address                text,
  city                   text,
  notes                  text,
  total_purchase_amount  numeric(12, 2) not null default 0,
  total_paid_amount      numeric(12, 2) not null default 0,
  total_pending_amount   numeric(12, 2) not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_customers_user_id     on public.customers (user_id);
create index if not exists idx_customers_business_id on public.customers (business_id);
create index if not exists idx_customers_phone       on public.customers (phone);
create index if not exists idx_customers_name        on public.customers (name);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;

drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own" on public.customers
  for select using (auth.uid() = user_id);

drop policy if exists "customers_insert_own" on public.customers;
create policy "customers_insert_own" on public.customers
  for insert with check (auth.uid() = user_id);

drop policy if exists "customers_update_own" on public.customers;
create policy "customers_update_own" on public.customers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "customers_delete_own" on public.customers;
create policy "customers_delete_own" on public.customers
  for delete using (auth.uid() = user_id);
