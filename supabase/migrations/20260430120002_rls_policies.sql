-- Vetly RLS policies
-- Every table is user-scoped. Service role (used by the ingest webhook and the
-- cron-triggered digest function) bypasses RLS automatically; user JWTs are
-- restricted to their own rows by these policies.

alter table public.profiles       enable row level security;
alter table public.user_settings  enable row level security;
alter table public.ingest_batches enable row level security;
alter table public.creators       enable row level security;

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- profiles.id IS the user id (1:1 with auth.users), so the policy keys on id.
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = id);

-- ─── user_settings ───────────────────────────────────────────────────────────
create policy user_settings_select_own on public.user_settings
  for select using (auth.uid() = user_id);

create policy user_settings_insert_own on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy user_settings_update_own on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_settings_delete_own on public.user_settings
  for delete using (auth.uid() = user_id);

-- ─── ingest_batches ──────────────────────────────────────────────────────────
create policy ingest_batches_select_own on public.ingest_batches
  for select using (auth.uid() = user_id);

create policy ingest_batches_insert_own on public.ingest_batches
  for insert with check (auth.uid() = user_id);

create policy ingest_batches_update_own on public.ingest_batches
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy ingest_batches_delete_own on public.ingest_batches
  for delete using (auth.uid() = user_id);

-- ─── creators ────────────────────────────────────────────────────────────────
create policy creators_select_own on public.creators
  for select using (auth.uid() = user_id);

create policy creators_insert_own on public.creators
  for insert with check (auth.uid() = user_id);

create policy creators_update_own on public.creators
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy creators_delete_own on public.creators
  for delete using (auth.uid() = user_id);
