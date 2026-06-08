-- ============================================================================
-- Sello — Free plan now includes 5 trial AI requests (enforced in app code).
-- Just updates the displayed feature list. Run AFTER 0013.
-- ============================================================================
update public.plans
set features = array[
  'Up to 50 products',
  '50 sales per month',
  'Basic dashboard',
  'WhatsApp invoices',
  '5 free AI requests'
]
where id = 'free';
