-- Vetly initial schema
-- Tables: profiles, user_settings, ingest_batches, creators.
-- RLS is enabled in 20260430120002_rls_policies.sql.
-- Profile / settings auto-create trigger lives in 20260430120003_profile_trigger.sql.

create extension if not exists pgcrypto with schema extensions;

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth.users; created by the on_auth_user_created trigger.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ─── user_settings ───────────────────────────────────────────────────────────
-- Per-user config: ICP, filters, daily-send schedule, webhook secret.
-- webhook_secret defaults to a random 48-char hex token; the ingest function
-- looks up the user_id by matching this against the x-webhook-secret header.
create table public.user_settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  product_description  text,
  icp_description      text,
  follower_min         integer,
  follower_max         integer,
  min_engagement_rate  numeric,
  recipient_email      text,
  daily_send_enabled   boolean not null default true,
  daily_send_hour      integer not null default 12 check (daily_send_hour between 0 and 23),
  digest_size          integer not null default 8 check (digest_size between 1 and 50),
  webhook_secret       text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  updated_at           timestamptz not null default now()
);

-- The webhook lookup is only useful if the secret is unique across users.
create unique index user_settings_webhook_secret_uniq
  on public.user_settings (webhook_secret);

-- ─── updated_at touch helper ─────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function public.touch_updated_at();

-- ─── ingest_batches ──────────────────────────────────────────────────────────
-- One row per CSV / webhook import. Used for traceability and the import history.
create table public.ingest_batches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  source          text,
  source_label    text,
  row_count       integer not null default 0,
  imported_count  integer not null default 0,
  status          text not null default 'pending',
  notes           text,
  created_at      timestamptz not null default now()
);

create index ingest_batches_user_id_created_at_idx
  on public.ingest_batches (user_id, created_at desc);

-- ─── creators ────────────────────────────────────────────────────────────────
-- One row per Creator per user. Upserted by the ingest function on
-- (user_id, platform, handle); scored by the score function in batches.
create table public.creators (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  batch_id              uuid references public.ingest_batches(id) on delete set null,

  handle                text not null,
  platform              text not null check (platform in ('instagram', 'tiktok')),
  display_name          text,
  profile_url           text,
  bio                   text,
  niche                 text,

  follower_count        integer,
  following_count       integer,
  post_count            integer,
  avg_likes             numeric,
  avg_comments          numeric,
  engagement_rate       numeric,

  score_fit             integer check (score_fit between 0 and 100),
  score_engagement      integer check (score_engagement between 0 and 100),
  score_audience        integer check (score_audience between 0 and 100),
  score_recency         integer check (score_recency between 0 and 100),
  score_overall         integer check (score_overall between 0 and 100),
  ai_reasoning          text,
  scored_at             timestamptz,

  status                text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'contacted')),
  included_in_digest_at timestamptz,

  raw                   jsonb,
  created_at            timestamptz not null default now()
);

-- Upsert key for the ingest webhook.
create unique index creators_user_platform_handle_uniq
  on public.creators (user_id, platform, handle);

-- Dashboard filtering by status.
create index creators_user_status_idx
  on public.creators (user_id, status);

-- Top-N digest assembly query.
create index creators_user_score_overall_idx
  on public.creators (user_id, score_overall desc nulls last);

-- Hot path for the score function: pull all unscored Creators for a user.
create index creators_user_unscored_idx
  on public.creators (user_id)
  where score_overall is null;
