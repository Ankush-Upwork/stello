-- ============================================================================
-- Sello — Phase 9: suppliers + purchases (stock inward)
-- create_purchase() is the inverse of create_sale(): it ADDS stock, refreshes
-- the product/variant cost to the latest purchase price, and updates the
-- supplier's running totals — atomically. Run AFTER 0006.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  business_id            uuid not null references public.businesses (id) on delete cascade,
  name                   text not null,
  phone                  text,
  address                text,
  notes                  text,
  total_purchase_amount  numeric(12, 2) not null default 0,
  total_paid_amount      numeric(12, 2) not null default 0,
  total_pending_amount   numeric(12, 2) not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_suppliers_user_id     on public.suppliers (user_id);
create index if not exists idx_suppliers_business_id on public.suppliers (business_id);

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- purchases + purchase_items
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  business_id     uuid not null references public.businesses (id) on delete cascade,
  supplier_id     uuid references public.suppliers (id) on delete set null,
  purchase_date   timestamptz not null default now(),
  total_amount    numeric(12, 2) not null default 0,
  paid_amount     numeric(12, 2) not null default 0,
  pending_amount  numeric(12, 2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_purchases_user_id     on public.purchases (user_id);
create index if not exists idx_purchases_supplier_id on public.purchases (supplier_id);
create index if not exists idx_purchases_date        on public.purchases (purchase_date);

drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

create table if not exists public.purchase_items (
  id                    uuid primary key default gen_random_uuid(),
  purchase_id           uuid not null references public.purchases (id) on delete cascade,
  product_id            uuid references public.products (id) on delete set null,
  variant_id            uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  size_snapshot         text,
  color_snapshot        text,
  quantity              integer not null,
  purchase_price        numeric(12, 2) not null default 0,
  line_total            numeric(12, 2) not null default 0,
  created_at            timestamptz not null default now()
);

create index if not exists idx_purchase_items_purchase_id on public.purchase_items (purchase_id);
create index if not exists idx_purchase_items_product_id  on public.purchase_items (product_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

drop policy if exists "suppliers_select_own" on public.suppliers;
create policy "suppliers_select_own" on public.suppliers for select using (auth.uid() = user_id);
drop policy if exists "suppliers_insert_own" on public.suppliers;
create policy "suppliers_insert_own" on public.suppliers for insert with check (auth.uid() = user_id);
drop policy if exists "suppliers_update_own" on public.suppliers;
create policy "suppliers_update_own" on public.suppliers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "suppliers_delete_own" on public.suppliers;
create policy "suppliers_delete_own" on public.suppliers for delete using (auth.uid() = user_id);

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own" on public.purchases for select using (auth.uid() = user_id);
drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own" on public.purchases for insert with check (auth.uid() = user_id);
drop policy if exists "purchases_update_own" on public.purchases;
create policy "purchases_update_own" on public.purchases for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "purchases_delete_own" on public.purchases;
create policy "purchases_delete_own" on public.purchases for delete using (auth.uid() = user_id);

drop policy if exists "purchase_items_select_own" on public.purchase_items;
create policy "purchase_items_select_own" on public.purchase_items for select using (
  exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = auth.uid())
);
drop policy if exists "purchase_items_insert_own" on public.purchase_items;
create policy "purchase_items_insert_own" on public.purchase_items for insert with check (
  exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = auth.uid())
);
drop policy if exists "purchase_items_delete_own" on public.purchase_items;
create policy "purchase_items_delete_own" on public.purchase_items for delete using (
  exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = auth.uid())
);

-- ============================================================================
-- create_purchase(payload jsonb) -> uuid
-- payload = { business_id, supplier_id?, purchase_date?, paid_amount?, notes?,
--   items: [{ product_id, variant_id?, quantity, purchase_price }] }
-- ============================================================================
create or replace function public.create_purchase(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_user       uuid := auth.uid();
  v_business   uuid;
  v_supplier   uuid;
  v_date       timestamptz;
  v_paid       numeric(12,2);
  v_purchase   uuid;
  v_subtotal   numeric(12,2) := 0;
  v_total      numeric(12,2);
  v_pending    numeric(12,2);
  item         jsonb;
  v_product    public.products%rowtype;
  v_variant_id uuid;
  v_qty        integer;
  v_price      numeric(12,2);
  v_size       text;
  v_color      text;
  v_line       numeric(12,2);
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  v_business := (payload->>'business_id')::uuid;
  v_supplier := nullif(payload->>'supplier_id','')::uuid;
  v_date     := coalesce(nullif(payload->>'purchase_date','')::timestamptz, now());
  v_paid     := coalesce(nullif(payload->>'paid_amount','')::numeric, 0);

  perform 1 from public.businesses where id = v_business and user_id = v_user;
  if not found then raise exception 'Invalid business'; end if;

  if jsonb_array_length(coalesce(payload->'items','[]'::jsonb)) = 0 then
    raise exception 'Add at least one item to the purchase';
  end if;

  insert into public.purchases (user_id, business_id, supplier_id, purchase_date, notes)
  values (v_user, v_business, v_supplier, v_date, nullif(payload->>'notes',''))
  returning id into v_purchase;

  for item in select * from jsonb_array_elements(payload->'items')
  loop
    v_qty        := (item->>'quantity')::integer;
    v_price      := coalesce((item->>'purchase_price')::numeric, 0);
    v_variant_id := nullif(item->>'variant_id','')::uuid;

    if v_qty is null or v_qty <= 0 then raise exception 'Quantity must be at least 1'; end if;

    select * into v_product from public.products
      where id = (item->>'product_id')::uuid and user_id = v_user;
    if not found then raise exception 'Product not found'; end if;

    if v_variant_id is not null then
      update public.product_variants
        set quantity = quantity + v_qty, purchase_price = v_price
        where id = v_variant_id and product_id = v_product.id and user_id = v_user
        returning size, color into v_size, v_color;
      if not found then raise exception 'Variant not found'; end if;
    else
      update public.products
        set quantity = quantity + v_qty, purchase_price = v_price
        where id = v_product.id;
      v_size := v_product.size; v_color := v_product.color;
    end if;

    v_line := v_qty * v_price;
    v_subtotal := v_subtotal + v_line;

    insert into public.purchase_items (
      purchase_id, product_id, variant_id, product_name_snapshot,
      size_snapshot, color_snapshot, quantity, purchase_price, line_total
    ) values (
      v_purchase, v_product.id, v_variant_id, v_product.product_name,
      v_size, v_color, v_qty, v_price, v_line
    );
  end loop;

  v_total := v_subtotal;
  v_pending := v_total - v_paid;

  update public.purchases
    set total_amount = v_total, paid_amount = v_paid, pending_amount = v_pending
    where id = v_purchase;

  if v_supplier is not null then
    update public.suppliers
      set total_purchase_amount = total_purchase_amount + v_total,
          total_paid_amount     = total_paid_amount + v_paid,
          total_pending_amount  = total_pending_amount + v_pending
      where id = v_supplier and user_id = v_user;
  end if;

  return v_purchase;
end;
$$;

-- ============================================================================
-- delete_purchase(p_purchase_id uuid, p_remove_stock boolean)
-- ============================================================================
create or replace function public.delete_purchase(p_purchase_id uuid, p_remove_stock boolean default true)
returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_p    public.purchases%rowtype;
  item   record;
begin
  select * into v_p from public.purchases where id = p_purchase_id and user_id = v_user;
  if not found then raise exception 'Purchase not found'; end if;

  if p_remove_stock then
    for item in select * from public.purchase_items where purchase_id = p_purchase_id loop
      if item.variant_id is not null then
        update public.product_variants
          set quantity = greatest(quantity - item.quantity, 0) where id = item.variant_id;
      elsif item.product_id is not null then
        update public.products
          set quantity = greatest(quantity - item.quantity, 0) where id = item.product_id;
      end if;
    end loop;
  end if;

  if v_p.supplier_id is not null then
    update public.suppliers
      set total_purchase_amount = greatest(total_purchase_amount - v_p.total_amount, 0),
          total_paid_amount     = greatest(total_paid_amount - v_p.paid_amount, 0),
          total_pending_amount  = greatest(total_pending_amount - v_p.pending_amount, 0)
      where id = v_p.supplier_id;
  end if;

  delete from public.purchases where id = p_purchase_id;
end;
$$;

grant execute on function public.create_purchase(jsonb) to authenticated;
grant execute on function public.delete_purchase(uuid, boolean) to authenticated;
