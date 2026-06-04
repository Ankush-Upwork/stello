-- ============================================================================
-- Sello — switch invoice number prefix from SS- to SL- (rebrand)
-- Re-creates create_sale() identical to 0009 but with the SL- prefix.
-- Existing SS-… invoices are left untouched. Run AFTER 0010.
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

  select count(*) + 1 into v_seq
  from public.sales
  where business_id = v_business
    and (sale_date at time zone 'Asia/Kolkata')::date
        = (v_date at time zone 'Asia/Kolkata')::date;

  v_invoice := 'SL-'
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
      purchase_price_snapshot, discount_amount, line_total, line_profit, gst_rate
    ) values (
      v_sale_id, v_product.id, v_variant_id, v_product.product_name,
      v_size, v_color, v_qty, v_unit,
      v_purchase, v_disc, v_line_total,
      v_line_total - (v_purchase * v_qty), coalesce(v_product.gst_rate, 0)
    );
  end loop;

  v_total   := greatest(v_subtotal - v_sale_disc, 0);
  v_pending := v_total - v_paid;

  update public.sales
    set subtotal = v_subtotal, total_amount = v_total,
        paid_amount = v_paid, pending_amount = v_pending
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
