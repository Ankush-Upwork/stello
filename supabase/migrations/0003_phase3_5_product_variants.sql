-- ============================================================================
-- Sello — Phase 3.5 schema: optional product variants
-- A product can OPTIONALLY have a size/colour grid. When products.has_variants
-- is false, the product row itself carries stock/price (Phase 2 behaviour).
-- When true, each row in product_variants carries its own stock/price.
-- Run AFTER 0002.
-- ============================================================================

alter table public.products
  add column if not exists has_variants boolean not null default false;

create table if not exists public.product_variants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  product_id      uuid not null references public.products (id) on delete cascade,
  size            text,
  color           text,
  sku             text,
  barcode         text,
  quantity        integer not null default 0,
  purchase_price  numeric(12, 2) not null default 0,
  selling_price   numeric(12, 2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_product_variants_product_id on public.product_variants (product_id);
create index if not exists idx_product_variants_user_id    on public.product_variants (user_id);

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.product_variants enable row level security;

drop policy if exists "product_variants_select_own" on public.product_variants;
create policy "product_variants_select_own" on public.product_variants
  for select using (auth.uid() = user_id);

drop policy if exists "product_variants_insert_own" on public.product_variants;
create policy "product_variants_insert_own" on public.product_variants
  for insert with check (auth.uid() = user_id);

drop policy if exists "product_variants_update_own" on public.product_variants;
create policy "product_variants_update_own" on public.product_variants
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "product_variants_delete_own" on public.product_variants;
create policy "product_variants_delete_own" on public.product_variants
  for delete using (auth.uid() = user_id);
