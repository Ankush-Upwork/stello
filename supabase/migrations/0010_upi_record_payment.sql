-- ============================================================================
-- Sello — record_payment(): mark a pending amount as received
-- Atomically bumps the sale's paid amount and the customer's running totals.
-- Run AFTER 0009.
-- ============================================================================
create or replace function public.record_payment(p_sale_id uuid, p_amount numeric)
returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_sale public.sales%rowtype;
  v_amt  numeric(12,2);
begin
  select * into v_sale from public.sales where id = p_sale_id and user_id = v_user;
  if not found then raise exception 'Sale not found'; end if;

  -- Never record more than what's pending.
  v_amt := least(greatest(coalesce(p_amount, 0), 0), v_sale.pending_amount);
  if v_amt <= 0 then return; end if;

  update public.sales
    set paid_amount = paid_amount + v_amt,
        pending_amount = pending_amount - v_amt
    where id = p_sale_id;

  if v_sale.customer_id is not null then
    update public.customers
      set total_paid_amount = total_paid_amount + v_amt,
          total_pending_amount = greatest(total_pending_amount - v_amt, 0)
      where id = v_sale.customer_id;
  end if;
end;
$$;

grant execute on function public.record_payment(uuid, numeric) to authenticated;
