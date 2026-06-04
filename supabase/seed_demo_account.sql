-- ============================================================================
-- Sello — DEMO DATA for an existing account
--
-- IMPORTANT: do NOT create the auth user from SQL (it corrupts Supabase auth).
-- Instead:
--   1. In the app, SIGN UP:  demo@sello.app  /  Sello@Demo123
--   2. Then run this file in the Supabase SQL Editor.
--
-- It sets that account to Pro and adds a shop, ~24 products (incl. variants),
-- 12 customers, 5 suppliers, ~6 purchases and ~45 sales over the last 60 days.
-- Safe to re-run (skips if data already exists). Change v_email if you used a
-- different email when signing up.
-- ============================================================================
do $$
declare
  v_email    text := 'demo@sello.app';
  v_user uuid;
  v_biz  uuid;
  v_cust uuid;
  v_sup  uuid;
  v_prod public.products%rowtype;
  v_sale uuid;
  v_purch uuid;
  v_pid uuid;
  v_qty int; v_unit numeric; v_line numeric; v_sub numeric; v_paid numeric;
  v_items int; v_date timestamptz; v_mode text;
  v_modes text[] := array['Cash','UPI','Card','Credit'];
  i int; j int;
begin
  -- 1) Find the user (must be signed up via the app first) --------------------
  select id into v_user from auth.users where email = v_email;
  if v_user is null then
    raise exception 'No user "%" yet. Sign up that email in the app first, then re-run this file.', v_email;
  end if;

  -- 2) Profile + Pro subscription --------------------------------------------
  insert into public.profiles (id, full_name) values (v_user, 'Demo Owner')
    on conflict (id) do nothing;
  insert into public.subscriptions (user_id, plan_id) values (v_user, 'pro')
    on conflict (user_id) do update set plan_id = 'pro';

  -- 3) Business ---------------------------------------------------------------
  select id into v_biz from public.businesses where user_id = v_user order by created_at limit 1;
  if v_biz is null then
    insert into public.businesses (user_id, business_name, owner_name, business_type, phone, city, state, gstin, upi_id)
    values (v_user, 'Demo Boutique', 'Demo Owner', 'boutique', '9876500000', 'Surat', 'Gujarat', '24ABCDE1234F1Z5', 'demoboutique@upi')
    returning id into v_biz;
  end if;

  -- Don't double-seed
  if exists (select 1 from public.products where user_id = v_user) then
    raise notice 'Data already exists for % — skipping.', v_email;
    return;
  end if;

  -- 4) Products ---------------------------------------------------------------
  insert into public.products
    (user_id, business_id, product_name, category, color, size, purchase_price, selling_price, quantity, low_stock_threshold, gst_rate, hsn_code, status, image_url)
  select v_user, v_biz, p.name, p.cat, p.color, p.size, p.pp, p.sp, p.qty, 5, p.gst, p.hsn, 'active',
         'https://picsum.photos/seed/sello' || p.n::text || '/500/500'
  from (values
    (1,'Cotton Anarkali Kurti','Kurti','Red','L',500,1200,40,5,'6109'),
    (2,'Silk Saree','Saree','Maroon','Free',1200,2999,30,12,'5007'),
    (3,'Chiffon Saree','Saree','Blue','Free',900,2200,25,12,'5007'),
    (4,'Denim Jeans','Jeans','Blue','32',600,1299,35,12,'6203'),
    (5,'Slim Fit Jeans','Jeans','Black','34',650,1499,30,12,'6203'),
    (6,'Casual Top','Top','White','M',250,699,50,5,'6106'),
    (7,'Crop Top','Top','Pink','S',200,599,45,5,'6106'),
    (8,'Leather Sandals','Footwear','Brown','8',400,999,28,18,'6403'),
    (9,'Running Shoes','Footwear','Grey','9',800,1999,22,18,'6404'),
    (10,'Kolhapuri Chappal','Footwear','Tan','7',300,799,26,18,'6403'),
    (11,'Matte Lipstick Set','Cosmetics','Assorted','',150,399,60,18,'3304'),
    (12,'Kajal','Cosmetics','Black','',40,120,80,18,'3304'),
    (13,'Compact Powder','Cosmetics','Beige','',120,299,40,18,'3304'),
    (14,'Leather Handbag','Accessories','Black','',700,1799,18,18,'4202'),
    (15,'Party Clutch','Accessories','Gold','',300,799,20,18,'4202'),
    (16,'Embroidered Juttis','Footwear','Pink','6',350,899,24,18,'6405'),
    (17,'Printed Dupatta','Accessories','Yellow','',150,499,40,5,'6214'),
    (18,'Palazzo Pants','Bottoms','Teal','Free',200,549,35,5,'6204'),
    (19,'Leggings','Bottoms','Black','Free',120,349,70,5,'6104'),
    (20,'Nightwear Set','Nightwear','Purple','L',350,899,25,12,'6108'),
    (21,'Kids Frock','Kids','Pink','S',250,699,30,5,'6111'),
    (22,'Decorative Wall Clock','Gift','Wood','',200,549,15,18,'9105')
  ) as p(n,name,cat,color,size,pp,sp,qty,gst,hsn);

  -- Variant products
  insert into public.products (user_id, business_id, product_name, category, has_variants, low_stock_threshold, gst_rate, hsn_code, status, image_url)
  values (v_user, v_biz, 'Designer Kurti', 'Kurti', true, 4, 5, '6109', 'active', 'https://picsum.photos/seed/sellokurti/500/500')
  returning id into v_pid;
  insert into public.product_variants (user_id, product_id, size, color, quantity, purchase_price, selling_price) values
    (v_user, v_pid, 'S', 'Red', 8, 550, 1350),
    (v_user, v_pid, 'M', 'Red', 10, 550, 1350),
    (v_user, v_pid, 'L', 'Blue', 6, 560, 1399),
    (v_user, v_pid, 'XL', 'Green', 4, 560, 1399);

  insert into public.products (user_id, business_id, product_name, category, has_variants, low_stock_threshold, gst_rate, hsn_code, status, image_url)
  values (v_user, v_biz, 'Formal Shirt', 'Top', true, 4, 12, '6205', 'active', 'https://picsum.photos/seed/selloshirt/500/500')
  returning id into v_pid;
  insert into public.product_variants (user_id, product_id, size, color, quantity, purchase_price, selling_price) values
    (v_user, v_pid, '38', 'White', 12, 400, 999),
    (v_user, v_pid, '40', 'White', 10, 400, 999),
    (v_user, v_pid, '42', 'Blue', 5, 420, 1049);

  -- 5) Customers --------------------------------------------------------------
  insert into public.customers (user_id, business_id, name, phone, city)
  select v_user, v_biz, c.name, c.phone, c.city
  from (values
    ('Priya Sharma','9876543210','Surat'),
    ('Meena Patel','9823011223','Ahmedabad'),
    ('Rahul Verma','9911223344','Mumbai'),
    ('Anjali Gupta','9900112233','Delhi'),
    ('Sunita Rao','9812345678','Pune'),
    ('Kavita Singh','9765432109','Jaipur'),
    ('Deepak Nair','9701234567','Kochi'),
    ('Pooja Mehta','9888776655','Rajkot'),
    ('Neha Joshi','9090909091','Nagpur'),
    ('Ramesh Iyer','9123456780','Chennai'),
    ('Sneha Reddy','9234567810','Hyderabad'),
    ('Farah Khan','9345678120','Lucknow')
  ) as c(name,phone,city);

  -- 6) Suppliers --------------------------------------------------------------
  insert into public.suppliers (user_id, business_id, name, phone)
  select v_user, v_biz, s.name, s.phone
  from (values
    ('Surat Textiles','9800000001'),
    ('Mumbai Footwear Co','9800000002'),
    ('Delhi Cosmetics Hub','9800000003'),
    ('Jaipur Handlooms','9800000004'),
    ('Rajkot Accessories','9800000005')
  ) as s(name,phone);

  -- 7) Sales (~45 over the last 60 days) -------------------------------------
  for i in 1..45 loop
    v_date := now() - ((random() * 60)::int) * interval '1 day' - ((random() * 12)::int) * interval '1 hour';
    if random() < 0.72 then
      select id into v_cust from public.customers where user_id = v_user order by random() limit 1;
    else
      v_cust := null;
    end if;
    v_mode := v_modes[1 + floor(random() * 4)::int];

    insert into public.sales (user_id, business_id, customer_id, invoice_number, sale_date, payment_mode, delivery_status)
    values (v_user, v_biz, v_cust, 'SL-DEMO-' || lpad(i::text, 4, '0'), v_date, v_mode, 'Delivered')
    returning id into v_sale;

    v_sub := 0;
    v_items := 1 + floor(random() * 3)::int;
    for j in 1..v_items loop
      select * into v_prod from public.products
        where user_id = v_user and has_variants = false and quantity > 0
        order by random() limit 1;
      if not found then exit; end if;
      v_qty := least(1 + floor(random() * 3)::int, v_prod.quantity);
      v_unit := v_prod.selling_price;
      v_line := v_qty * v_unit;
      v_sub := v_sub + v_line;
      insert into public.sale_items
        (sale_id, product_id, product_name_snapshot, size_snapshot, color_snapshot, quantity, unit_price, purchase_price_snapshot, line_total, line_profit, gst_rate)
      values
        (v_sale, v_prod.id, v_prod.product_name, v_prod.size, v_prod.color, v_qty, v_unit, v_prod.purchase_price, v_line, v_line - (v_prod.purchase_price * v_qty), v_prod.gst_rate);
      update public.products set quantity = quantity - v_qty where id = v_prod.id;
    end loop;

    if v_sub = 0 then
      delete from public.sales where id = v_sale;
      continue;
    end if;

    -- 55% paid in full, 25% partial, 20% unpaid
    v_paid := case
      when random() < 0.55 then v_sub
      when random() < 0.80 then round((v_sub * 0.5)::numeric, 0)
      else 0 end;

    update public.sales
      set subtotal = v_sub, total_amount = v_sub, paid_amount = v_paid, pending_amount = v_sub - v_paid
      where id = v_sale;

    if v_cust is not null then
      update public.customers
        set total_purchase_amount = total_purchase_amount + v_sub,
            total_paid_amount = total_paid_amount + v_paid,
            total_pending_amount = total_pending_amount + (v_sub - v_paid)
        where id = v_cust;
    end if;
  end loop;

  -- 8) Purchases (~6) ---------------------------------------------------------
  for i in 1..6 loop
    select id into v_sup from public.suppliers where user_id = v_user order by random() limit 1;
    insert into public.purchases (user_id, business_id, supplier_id, purchase_date)
    values (v_user, v_biz, v_sup, now() - ((random() * 50)::int) * interval '1 day')
    returning id into v_purch;

    v_sub := 0;
    v_items := 2 + floor(random() * 3)::int;
    for j in 1..v_items loop
      select * into v_prod from public.products
        where user_id = v_user and has_variants = false
        order by random() limit 1;
      if not found then exit; end if;
      v_qty := 5 + floor(random() * 15)::int;
      v_unit := v_prod.purchase_price;
      v_line := v_qty * v_unit;
      v_sub := v_sub + v_line;
      insert into public.purchase_items
        (purchase_id, product_id, product_name_snapshot, size_snapshot, color_snapshot, quantity, purchase_price, line_total)
      values
        (v_purch, v_prod.id, v_prod.product_name, v_prod.size, v_prod.color, v_qty, v_unit, v_line);
      update public.products set quantity = quantity + v_qty where id = v_prod.id;
    end loop;

    v_paid := case when random() < 0.6 then v_sub else round((v_sub * 0.5)::numeric, 0) end;
    update public.purchases
      set total_amount = v_sub, paid_amount = v_paid, pending_amount = v_sub - v_paid
      where id = v_purch;
    if v_sup is not null then
      update public.suppliers
        set total_purchase_amount = total_purchase_amount + v_sub,
            total_paid_amount = total_paid_amount + v_paid,
            total_pending_amount = total_pending_amount + (v_sub - v_paid)
        where id = v_sup;
    end if;
  end loop;

  raise notice 'Demo data added for %', v_email;
end $$;

-- ============================================================================
-- To remove this demo account + all its data later:
--   delete from auth.users where email = 'demo@sello.app';  -- cascades everything
-- ============================================================================
