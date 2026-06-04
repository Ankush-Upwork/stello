-- ============================================================================
-- Sello — Phase 2 schema
-- Table: products  +  Storage bucket: product-images
-- Run this in the Supabase SQL Editor AFTER 0001.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Table: products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  business_id          uuid not null references public.businesses (id) on delete cascade,
  product_name         text not null,
  category             text,
  sku                  text,
  barcode              text,
  size                 text,
  color                text,
  design               text,
  brand                text,
  material             text,
  purchase_price       numeric(12, 2) not null default 0,
  selling_price        numeric(12, 2) not null default 0,
  quantity             integer not null default 0,
  low_stock_threshold  integer not null default 5,
  supplier_name        text,
  supplier_phone       text,
  image_url            text,
  status               text not null default 'active'
                         check (status in ('active', 'inactive')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_products_user_id      on public.products (user_id);
create index if not exists idx_products_business_id  on public.products (business_id);
create index if not exists idx_products_product_name on public.products (product_name);
create index if not exists idx_products_category     on public.products (category);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: a user can only touch their own products
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own" on public.products
  for select using (auth.uid() = user_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products
  for insert with check (auth.uid() = user_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Storage: product images
-- Public bucket so images can be shown via public URLs. Writes are restricted
-- to the owner: files must live under a top-level folder named after the
-- user's id, e.g.  product-images/<auth.uid()>/<uuid>.jpg
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read of product images
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Owner can upload into their own folder
drop policy if exists "product_images_insert_own" on storage.objects;
create policy "product_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can update their own files
drop policy if exists "product_images_update_own" on storage.objects;
create policy "product_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can delete their own files
drop policy if exists "product_images_delete_own" on storage.objects;
create policy "product_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
