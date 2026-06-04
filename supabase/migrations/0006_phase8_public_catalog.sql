-- ============================================================================
-- Sello — Phase 8: public shareable catalog
-- A SECURITY DEFINER function returns ONLY customer-safe fields for a business's
-- active products (never purchase price, supplier, cost, etc.). Granted to anon
-- so the catalog link works without logging in. RLS on the base tables is
-- untouched — this is the single, curated public window.
-- Run AFTER 0005.
-- ============================================================================

create or replace function public.public_catalog(p_business_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'business', (
      select jsonb_build_object(
        'name', b.business_name,
        'type', b.business_type,
        'phone', b.phone,
        'city', b.city
      )
      from public.businesses b
      where b.id = p_business_id
    ),
    'products', coalesce((
      select jsonb_agg(prod order by prod->>'name')
      from (
        select jsonb_build_object(
          'id', p.id,
          'name', p.product_name,
          'category', p.category,
          'image_url', p.image_url,
          'has_variants', p.has_variants,
          'size', p.size,
          'color', p.color,
          'selling_price', p.selling_price,
          'quantity', p.quantity,
          'variants', coalesce((
            select jsonb_agg(jsonb_build_object(
              'size', v.size,
              'color', v.color,
              'selling_price', v.selling_price,
              'quantity', v.quantity
            ) order by v.created_at)
            from public.product_variants v
            where v.product_id = p.id and v.quantity > 0
          ), '[]'::jsonb)
        ) as prod
        from public.products p
        where p.business_id = p_business_id
          and p.status = 'active'
      ) sub
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.public_catalog(uuid) to anon, authenticated;
