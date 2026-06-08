-- ============================================================================
-- Sello — manual upgrade approvals (no self-upgrade) + admin role
-- Users "request" an upgrade; an admin approves after payment. Run AFTER 0012.
--
-- AFTER running this, make yourself an admin:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'agulati68@gmail.com'
--   on conflict do nothing;
-- ============================================================================

-- Admins -------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self" on public.admins
  for select using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

grant execute on function public.is_admin() to authenticated;

-- Upgrade requests ---------------------------------------------------------
create table if not exists public.upgrade_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  email       text,
  plan_id     text not null references public.plans (id),
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  note        text,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);

create index if not exists idx_upgrade_requests_status on public.upgrade_requests (status);
create index if not exists idx_upgrade_requests_user   on public.upgrade_requests (user_id);

alter table public.upgrade_requests enable row level security;

drop policy if exists "ur_select" on public.upgrade_requests;
create policy "ur_select" on public.upgrade_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "ur_insert_own" on public.upgrade_requests;
create policy "ur_insert_own" on public.upgrade_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "ur_update_admin" on public.upgrade_requests;
create policy "ur_update_admin" on public.upgrade_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- Let admins change any user's subscription (for approvals) -----------------
drop policy if exists "subscriptions_admin_update" on public.subscriptions;
create policy "subscriptions_admin_update" on public.subscriptions
  for update using (public.is_admin()) with check (public.is_admin());
