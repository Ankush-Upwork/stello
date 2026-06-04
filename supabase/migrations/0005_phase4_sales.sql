-- ============================================================================
-- Sello — Phase 4 schema: sales + sale_items, with atomic RPCs
-- A sale is created via create_sale() so that stock deduction, customer-total
-- updates and invoice numbering all happen in ONE transaction (any failure,
-- e.g. insufficient stock, rolls the whole thing back).
-- Run AFTER 0004.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.sales (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  business_id     uuid not null references public.businesses (id) on delete cascade,
  customer_id     uuid references public.customers (id) on delete set null,
  invoice_number  text not null,
  sale_date       timestamptz not null default now(),
  subtotal        numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  total_amount    numeric(12, 2) not null default 0,
  paid_amount     numeric(12, 2) not null default 0,
  pending_amount  numeric(12, 2) not null default 0,
  payment_mode    text,
  delivery_status text not null default 'Delivered',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create index if not exists idx_sales_user_id     on public.sales (user_id);
create index if not exists idx_sales_business_id on public.sales (business_id);
create index if not exists idx_sales_customer_id on public.sales (customer_id);
create index if not exists idx_sales_sale_date   on public.sales (sale_date);

drop trigger if exists trg_sales_updated_at on public.sales;
create trigger trg_sales_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

create table if not exists public.sale_items (
  id                      uuid primary key default gen_random_uuid(),
  sale_id                 uuid not null references public.sales (id) on delete cascade,
  product_id              uuid references public.products (id) on delete set null,
  variant_id              uuid references public.product_variants (id) on delete set null,
  product_name_snapshot   text not null,
  size_snapshot           text,
  color_snapshot          text,
  quantity                integer not null,
  unit_price              numeric(12, 2) not null default 0,
  purchase_price_snapshot numeric(12, 2) not null default 0,
  discount_amount         numeric(12, 2) not null default 0,
  line_total              numeric(12, 2) not null default 0,
  line_profit             numeric(12, 2) not null default 0,
  created_at              timestamptz not null default now()
);

create index if not exists idx_sale_items_sale_id    on public.sale_items (sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items (product_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists "sales_select_own" on public.sales;
create policy "sales_select_own" on public.sales
  for select using (auth.uid() = user_id);

drop policy if exists "sales_insert_own" on public.sales;
create policy "sales_insert_own" on public.sales
  for insert with check (auth.uid() = user_id);

drop policy if exists "sales_update_own" on public.sales;
create policy "sales_update_own" on public.sales
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sales_delete_own" on public.sales;
create policy "sales_delete_own" on public.sales
  for delete using (auth.uid() = user_id);

-- sale_items are owned through their parent sale
drop policy if exists "sale_items_select_own" on public.sale_items;
create policy "sale_items_select_own" on public.sale_items
  for select using (
    exists (select 1 from public.sales s where s.id = sale_id and s.user_id = auth.uid())
  );

drop policy if exists "sale_items_insert_own" on public.sale_items;
create policy "sale_items_insert_own" on public.sale_items
  for insert with check (
    exists (select 1 from public.sales s where s.id = sale_id and s.user_id = auth.uid())
  );

drop policy if exists "sale_items_delete_own" on public.sale_items;
create policy "sale_items_delete_own" on public.sale_items
  for delete using (
    exists (select 1 from public.sales s where s.id = sale_id and s.user_id = auth.uid())
  );

-- ============================================================================
-- create_sale(payload jsonb) -> uuid
-- payload = {
--   business_id, customer_id?, sale_date?, discount_amount?, paid_amount?,
--   payment_mode?, delivery_status?, notes?,
--   items: [{ product_id, variant_id?, quantity, unit_price, discount_amount? }]
-- }
-- ============================================================================
create or replace function public.create_sale(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_user        uuid := auth.uid();
  v_business    uuid;
  v_customer    uuid;
  v_date        timestamptz;
  v_sale_disc   numeric(12,2);
  v_paid        numeric(12,2);
  v_sale_id     uuid;
  v_seq         integer;
  v_invoice     text;
  v_subtotal    numeric(12,2) := 0;
  v_total       numeric(12,2);
  v_pending     numeric(12,2);
  item          jsonb;
  v_product     public.products%rowtype;
  v_variant     public.product_variants%rowtype;
  v_variant_id  uuid;
  v_qty         integer;
  v_unit        numeric(12,2);
  v_disc        numeric(12,2);
  v_purchase    numeric(12,2);
  v_size        text;
  v_color       text;
  v_line_total  numeric(12,2);
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  v_business  := (payload->>'business_id')::uuid;
  v_customer  := nullif(payload->>'customer_id', '')::uuid;
  v_date      := coalesce(nullif(payload->>'sale_date','')::timestamptz, now());
  v_sale_disc := coalesce(nullif(payload->>'discount_amount','')::numeric, 0);
  v_paid      := coalesce(nullif(payload->>'paid_amount','')::numeric, 0);

  perform 1 from public.businesses where id = v_business and user_id = v_user;
  if not found then raise exception 'Invalid business'; end if;

  if jsonb_array_length(coalesce(payload->'items','[]'::jsonb)) = 0 then
    raise exception 'Add at least one product to the sale';
  end if;

  -- Invoice number: SS-YYYYMMDD-#### (per business, per IST day)
  select count(*) + 1 into v_seq
  from public.sales
  where business_id = v_business
    and (sale_date at time zone 'Asia/Kolkata')::date
        = (v_date at time zone 'Asia/Kolkata')::date;

  v_invoice := 'SS-'
            || to_char(v_date at time zone 'Asia/Kolkata', 'YYYYMMDD')
            || '-' || lpad(v_seq::text, 4, '0');

  insert into public.sales (
    user_id, business_id, customer_id, invoice_number, sale_date,
    discount_amount, payment_mode, delivery_status, notes
  ) values (
    v_user, v_business, v_customer, v_invoice, v_date,
    v_sale_disc,
    nullif(payload->>'payment_mode',''),
    coalesce(nullif(payload->>'delivery_status',''), 'Delivered'),
    nullif(payload->>'notes','')
  )
  returning id into v_sale_id;

  for item in select * from jsonb_array_elements(payload->'items')
  loop
    v_qty        := (item->>'quantity')::integer;
    v_unit       := coalesce((item->>'unit_price')::numeric, 0);
    v_disc       := coalesce(nullif(item->>'discount_amount','')::numeric, 0);
    v_variant_id := nullif(item->>'variant_id', '')::uuid;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantity must be at least 1';
    end if;

    select * into v_product
    from public.products
    where id = (item->>'product_id')::uuid and user_id = v_user;
    if not found then raise exception 'Product not found'; end if;

    if v_variant_id is not null then
      select * into v_variant
      from public.product_variants
      where id = v_variant_id and product_id = v_product.id and user_id = v_user;
      if not found then raise exception 'Variant not found'; end if;
      if v_variant.quantity < v_qty then
        raise exception 'Not enough stock for % (% available)',
          v_product.product_name, v_variant.quantity;
      end if;
      v_purchase := v_variant.purchase_price;
      v_size := v_variant.size; v_color := v_variant.color;
      update public.product_variants
        set quantity = quantity - v_qty where id = v_variant_id;
    else
      if v_product.has_variants then
        raise exception 'Choose a size/colour for %', v_product.product_name;
      end if;
      if v_product.quantity < v_qty then
        raise exception 'Not enough stock for % (% available)',
          v_product.product_name, v_product.quantity;
      end if;
      v_purchase := v_product.purchase_price;
      v_size := v_product.size; v_color := v_product.color;
      update public.products
        set quantity = quantity - v_qty where id = v_product.id;
    end if;

    v_line_total := (v_qty * v_unit) - v_disc;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.sale_items (
      sale_id, product_id, variant_id, product_name_snapshot,
      size_snapshot, color_snapshot, quantity, unit_price,
      purchase_price_snapshot, discount_amount, line_total, line_profit
    ) values (
      v_sale_id, v_product.id, v_variant_id, v_product.product_name,
      v_size, v_color, v_qty, v_unit,
      v_purchase, v_disc, v_line_total,
      v_line_total - (v_purchase * v_qty)
    );
  end loop;

  v_total   := greatest(v_subtotal - v_sale_disc, 0);
  v_pending := v_total - v_paid;

  update public.sales
    set subtotal = v_subtotal,
        total_amount = v_total,
        paid_amount = v_paid,
        pending_amount = v_pending
    where id = v_sale_id;

  if v_customer is not null then
    update public.customers
      set total_purchase_amount = total_purchase_amount + v_total,
          total_paid_amount     = total_paid_amount + v_paid,
          total_pending_amount  = total_pending_amount + v_pending
      where id = v_customer and user_id = v_user;
  end if;

  return v_sale_id;
end;
$$;

-- ============================================================================
-- delete_sale(p_sale_id uuid, p_restore boolean)
-- Deletes a sale; optionally returns its items to stock and reverses the
-- customer's running totals.
-- ============================================================================
create or replace function public.delete_sale(p_sale_id uuid, p_restore boolean default true)
returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_sale public.sales%rowtype;
  item   record;
begin
  select * into v_sale from public.sales where id = p_sale_id and user_id = v_user;
  if not found then raise exception 'Sale not found'; end if;

  if p_restore then
    for item in select * from public.sale_items where sale_id = p_sale_id loop
      if item.variant_id is not null then
        update public.product_variants
          set quantity = quantity + item.quantity where id = item.variant_id;
      elsif item.product_id is not null then
        update public.products
          set quantity = quantity + item.quantity where id = item.product_id;
      end if;
    end loop;
  end if;

  if v_sale.customer_id is not null then
    update public.customers
      set total_purchase_amount = greatest(total_purchase_amount - v_sale.total_amount, 0),
          total_paid_amount     = greatest(total_paid_amount - v_sale.paid_amount, 0),
          total_pending_amount  = greatest(total_pending_amount - v_sale.pending_amount, 0)
      where id = v_sale.customer_id;
  end if;

  delete from public.sales where id = p_sale_id; -- cascades sale_items
end;
$$;

grant execute on function public.create_sale(jsonb) to authenticated;
grant execute on function public.delete_sale(uuid, boolean) to authenticated;
