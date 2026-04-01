-- pokemon_v2 growth / billing / share backend
-- Apply after backing up production.

begin;

create extension if not exists pgcrypto;

alter table public.users
  add column if not exists current_plan text not null default 'free',
  add column if not exists plan_status text not null default 'free',
  add column if not exists daily_free_limit integer not null default 3,
  add column if not exists last_ticket_reset_at timestamptz,
  add column if not exists pro_ai_addons jsonb not null default '[]'::jsonb;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_provider_check check (provider in ('stripe')),
  constraint subscriptions_plan_code_check check (
    plan_code in (
      'free',
      'basic',
      'pro',
      'pro_ai_single_default',
      'pro_ai_single_aggressive',
      'pro_ai_single_conservative',
      'pro_ai_single_tournament',
      'pro_ai_bundle'
    )
  )
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_provider_subscription_id on public.subscriptions(provider_subscription_id);
create index if not exists idx_subscriptions_plan_code on public.subscriptions(plan_code);

create table if not exists public.feature_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_code text not null,
  source_type text not null,
  source_ref text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint feature_entitlements_source_type_check check (source_type in ('plan', 'addon', 'promo', 'reward')),
  constraint feature_entitlements_feature_code_check check (
    feature_code in (
      'analysis.daily.free',
      'analysis.advanced',
      'analysis.unlimited',
      'analysis.no_ads',
      'analysis.history',
      'analysis.deck_compare',
      'analysis.environment_compare',
      'analysis.priority_queue',
      'opening_simulation.full',
      'coach.basic',
      'coach.pro',
      'coach.log_replay',
      'coach.pro_persona.default',
      'coach.pro_persona.aggressive',
      'coach.pro_persona.conservative',
      'coach.pro_persona.tournament'
    )
  )
);

create index if not exists idx_feature_entitlements_user_id on public.feature_entitlements(user_id);
create index if not exists idx_feature_entitlements_feature_code on public.feature_entitlements(feature_code);
create index if not exists idx_feature_entitlements_source_ref on public.feature_entitlements(source_ref);

create table if not exists public.analysis_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  deck_name text not null,
  summary_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_analysis_snapshots_user_id on public.analysis_snapshots(user_id);
create index if not exists idx_analysis_snapshots_slug on public.analysis_snapshots(slug);

create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  share_type text not null,
  slug text not null unique references public.analysis_snapshots(slug) on delete cascade,
  template_id text not null,
  share_text text not null,
  clicked_count integer not null default 0,
  signup_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint share_events_share_type_check check (share_type in ('analysis', 'board', 'simulation'))
);

create index if not exists idx_share_events_user_id on public.share_events(user_id);
create index if not exists idx_share_events_slug on public.share_events(slug);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_webhook_events_event_type on public.billing_webhook_events(event_type);

alter table public.ai_analysis_logs
  add column if not exists consumption_type text,
  add column if not exists analysis_kind text,
  add column if not exists share_slug text,
  add column if not exists share_score integer,
  add column if not exists paywall_surface text,
  add column if not exists template_id text,
  add column if not exists coach_mode text,
  add column if not exists analysis_depth text;

create index if not exists idx_ai_analysis_logs_user_consumption_created_at
  on public.ai_analysis_logs(user_id, consumption_type, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

 drop trigger if exists trg_subscriptions_set_updated_at on public.subscriptions;
 create trigger trg_subscriptions_set_updated_at
 before update on public.subscriptions
 for each row
 execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
alter table public.feature_entitlements enable row level security;
alter table public.analysis_snapshots enable row level security;
alter table public.share_events enable row level security;
alter table public.billing_webhook_events enable row level security;

drop policy if exists "users can select own subscriptions" on public.subscriptions;
create policy "users can select own subscriptions"
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "users can select own entitlements" on public.feature_entitlements;
create policy "users can select own entitlements"
on public.feature_entitlements
for select
using (auth.uid() = user_id);

drop policy if exists "users can select own snapshots" on public.analysis_snapshots;
create policy "users can select own snapshots"
on public.analysis_snapshots
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own snapshots" on public.analysis_snapshots;
create policy "users can insert own snapshots"
on public.analysis_snapshots
for insert
with check (auth.uid() = user_id);

drop policy if exists "users can select own share events" on public.share_events;
create policy "users can select own share events"
on public.share_events
for select
using (auth.uid() = user_id);

drop policy if exists "users can insert own share events" on public.share_events;
create policy "users can insert own share events"
on public.share_events
for insert
with check (auth.uid() = user_id);

commit;
