-- ============================================================================
-- Sello — add placeholder images to products (for testing only)
-- Gives every product of yours that has no image a stable demo photo from
-- picsum.photos. Run in the Supabase SQL Editor. Change the email if needed.
-- (Replace real photos later via Products → Edit → Upload photo.)
-- ============================================================================
update public.products
set image_url = 'https://picsum.photos/seed/' || id::text || '/600/600'
where user_id = (select id from auth.users where email = 'agulati68@gmail.com')
  and (image_url is null or image_url = '');

-- To clear these demo images again:
--   update public.products set image_url = null
--   where image_url like 'https://picsum.photos/%';
