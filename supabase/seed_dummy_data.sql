-- ============================================================================
-- Sello — DUMMY DATA (for trying out the app)
-- Run ONCE in the Supabase SQL Editor. Safe to delete later (see bottom).
-- It attaches demo products, customers and sales to YOUR account + business.
-- Change the email below if your login email is different.
-- ============================================================================
do $$
declare
  v_user uuid;
  v_biz  uuid;
  c1 uuid; c2 uuid; c3 uuid;
  p_saree uuid; p_clutch uuid; p_lip uuid; p_jeans uuid; p_kurti uuid;
  vS uuid; vM uuid; vL uuid;
  s_id uuid;
begin
  select id into v_user from auth.users where email = 'agulati68@gmail.com';
  if v_user is null then
    raise exception 'No user found. Update the email in this script to your login email.';
  end if;

  select id into v_biz from public.businesses where user_id = v_user order by created_at limit 1;
  if v_biz is null then
    insert into public.businesses (user_id, business_name, owner_name, business_type, phone, city, state)
    values (v_user, 'Demo Boutique', 'Demo Owner', 'boutique', '9876500000', 'Surat', 'Gujarat')
    returning id into v_biz;
  end if;

  -- ---- Customers ----------------------------------------------------------
  insert into public.customers (user_id, business_id, name, phone, city)
    values (v_user, v_biz, 'Priya Sharma', '9876543210', 'Surat') returning id into c1;
  insert into public.customers (user_id, business_id, name, phone, city)
    values (v_user, v_biz, 'Meena Patel', '9823011223', 'Ahmedabad') returning id into c2;
  insert into public.customers (user_id, business_id, name, phone, city)
    values (v_user, v_biz, 'Rahul Verma', '9911223344', 'Mumbai') returning id into c3;

  -- ---- Simple products ----------------------------------------------------
  insert into public.products (user_id, business_id, product_name, category, color, size, purchase_price, selling_price, quantity, low_stock_threshold, status)
    values (v_user, v_biz, 'Cotton Saree', 'Saree', 'Maroon', 'Free', 800, 1500, 12, 3, 'active') returning id into p_saree;
  insert into public.products (user_id, business_id, product_name, category, color, purchase_price, selling_price, quantity, low_stock_threshold, status)
    values (v_user, v_biz, 'Party Clutch', 'Accessories', 'Gold', 300, 799, 4, 5, 'active') returning id into p_clutch; -- low stock
  insert into public.products (user_id, business_id, product_name, category, color, purchase_price, selling_price, quantity, low_stock_threshold, status)
    values (v_user, v_biz, 'Matte Lipstick Set', 'Cosmetics', 'Assorted', 150, 399, 0, 3, 'active') returning id into p_lip; -- out of stock
  insert into public.products (user_id, business_id, product_name, category, color, size, purchase_price, selling_price, quantity, low_stock_threshold, status)
    values (v_user, v_biz, 'Denim Jeans', 'Jeans', 'Blue', '32', 600, 1299, 20, 4, 'active') returning id into p_jeans;

  -- ---- Variant product (Kurti in sizes/colours) ---------------------------
  insert into public.products (user_id, business_id, product_name, category, has_variants, low_stock_threshold, status)
    values (v_user, v_biz, 'Anarkali Kurti', 'Kurti', true, 3, 'active') returning id into p_kurti;
  insert into public.product_variants (user_id, product_id, size, color, quantity, purchase_price, selling_price)
    values (v_user, p_kurti, 'S', 'Red', 5, 500, 1200) returning id into vS;
  insert into public.product_variants (user_id, product_id, size, color, quantity, purchase_price, selling_price)
    values (v_user, p_kurti, 'M', 'Red', 8, 500, 1200) returning id into vM;
  insert into public.product_variants (user_id, product_id, size, color, quantity, purchase_price, selling_price)
    values (v_user, p_kurti, 'L', 'Blue', 2, 550, 1250) returning id into vL;

  -- ---- Helper to add a sale ------------------------------------------------
  -- Sale 1: today, Priya, 2x Anarkali M/Red, partial payment (UPI)
  insert into public.sales (user_id, business_id, customer_id, invoice_number, sale_date, subtotal, total_amount, paid_amount, pending_amount, payment_mode, delivery_status)
    values (v_user, v_biz, c1, 'SL-DEMO-0001', now(), 2400, 2400, 1000, 1400, 'UPI', 'Delivered') returning id into s_id;
  insert into public.sale_items (sale_id, product_id, variant_id, product_name_snapshot, size_snapshot, color_snapshot, quantity, unit_price, purchase_price_snapshot, line_total, line_profit)
    values (s_id, p_kurti, vM, 'Anarkali Kurti', 'M', 'Red', 2, 1200, 500, 2400, 1400);
  update public.product_variants set quantity = quantity - 2 where id = vM;
  update public.customers set total_purchase_amount = total_purchase_amount + 2400,
    total_paid_amount = total_paid_amount + 1000, total_pending_amount = total_pending_amount + 1400 where id = c1;

  -- Sale 2: 2 days ago, Meena, 1x Cotton Saree, paid full (Cash)
  insert into public.sales (user_id, business_id, customer_id, invoice_number, sale_date, subtotal, total_amount, paid_amount, pending_amount, payment_mode, delivery_status)
    values (v_user, v_biz, c2, 'SL-DEMO-0002', now() - interval '2 days', 1500, 1500, 1500, 0, 'Cash', 'Delivered') returning id into s_id;
  insert into public.sale_items (sale_id, product_id, product_name_snapshot, size_snapshot, color_snapshot, quantity, unit_price, purchase_price_snapshot, line_total, line_profit)
    values (s_id, p_saree, 'Cotton Saree', 'Free', 'Maroon', 1, 1500, 800, 1500, 700);
  update public.products set quantity = quantity - 1 where id = p_saree;
  update public.customers set total_purchase_amount = total_purchase_amount + 1500,
    total_paid_amount = total_paid_amount + 1500 where id = c2;

  -- Sale 3: this month, walk-in, 1x Denim Jeans, paid full (Card)
  insert into public.sales (user_id, business_id, invoice_number, sale_date, subtotal, total_amount, paid_amount, pending_amount, payment_mode, delivery_status)
    values (v_user, v_biz, 'SL-DEMO-0003', now() - interval '6 days', 1299, 1299, 1299, 0, 'Card', 'Delivered') returning id into s_id;
  insert into public.sale_items (sale_id, product_id, product_name_snapshot, size_snapshot, color_snapshot, quantity, unit_price, purchase_price_snapshot, line_total, line_profit)
    values (s_id, p_jeans, 'Denim Jeans', '32', 'Blue', 1, 1299, 600, 1299, 699);
  update public.products set quantity = quantity - 1 where id = p_jeans;

  -- Sale 4: 5 days ago, Rahul, 1x Party Clutch, fully pending (Credit)
  insert into public.sales (user_id, business_id, customer_id, invoice_number, sale_date, subtotal, total_amount, paid_amount, pending_amount, payment_mode, delivery_status)
    values (v_user, v_biz, c3, 'SL-DEMO-0004', now() - interval '5 days', 799, 799, 0, 799, 'Credit', 'Delivered') returning id into s_id;
  insert into public.sale_items (sale_id, product_id, product_name_snapshot, color_snapshot, quantity, unit_price, purchase_price_snapshot, line_total, line_profit)
    values (s_id, p_clutch, 'Party Clutch', 'Gold', 1, 799, 300, 799, 499);
  update public.products set quantity = quantity - 1 where id = p_clutch;
  update public.customers set total_purchase_amount = total_purchase_amount + 799,
    total_pending_amount = total_pending_amount + 799 where id = c3;

  raise notice 'Demo data added for business %', v_biz;
end $$;

-- ============================================================================
-- To remove the demo data later, run:
--   delete from public.sales where invoice_number like 'SL-DEMO-%';
--   delete from public.products where product_name in
--     ('Cotton Saree','Party Clutch','Matte Lipstick Set','Denim Jeans','Anarkali Kurti');
--   delete from public.customers where name in ('Priya Sharma','Meena Patel','Rahul Verma');
-- (sale_items and product_variants cascade automatically)
-- ============================================================================
