-- ============================================================================
-- Sello — AI entitlements & usage metering
--  • plans.ai_features      → the "cheap four" AI features (paid tiers)
--  • plans.ai_assistant_limit → monthly "Ask Sello" queries (0 = off, null = ∞)
--  • ai_usage               → logs metered AI calls (Ask Sello) for the cap
-- Run AFTER 0011.
-- ============================================================================

alter table public.plans add column if not exists ai_features        boolean not null default false;
alter table public.plans add column if not exists ai_assistant_limit integer; -- null = unlimited, 0 = not allowed

update public.plans set ai_features = case id
    when 'free' then false else true end,
  ai_assistant_limit = case id
    when 'free'     then 0
    when 'starter'  then 0
    when 'pro'      then 500
    when 'business' then null
    else ai_assistant_limit end;

create table if not exists public.ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null default 'ask_sello',
  created_at  timestamptz not null default now()
);

create index if not exists idx_ai_usage_user_created on public.ai_usage (user_id, created_at);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using (auth.uid() = user_id);

drop policy if exists "ai_usage_insert_own" on public.ai_usage;
create policy "ai_usage_insert_own" on public.ai_usage
  for insert with check (auth.uid() = user_id);
