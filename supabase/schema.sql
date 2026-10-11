-- Run this whole file in Supabase Dashboard -> SQL Editor -> New query.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username)),
  created_at timestamptz not null default now()
);

create table if not exists public.game_content (
  id integer primary key check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.game_content enable row level security;
alter table public.player_saves enable row level security;

-- Players can only read their own profile.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (user_id = auth.uid());

-- Signed-in players can read the shared game catalog.
drop policy if exists "authenticated read game content" on public.game_content;
create policy "authenticated read game content" on public.game_content
  for select to authenticated using (true);

-- Only the account named blobby can publish global game content.
drop policy if exists "blobby inserts game content" on public.game_content;
create policy "blobby inserts game content" on public.game_content
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.username = 'blobby'));

drop policy if exists "blobby updates game content" on public.game_content;
create policy "blobby updates game content" on public.game_content
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.username = 'blobby'))
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.username = 'blobby'));

-- Every account can read and change only its own player save.
drop policy if exists "read own player save" on public.player_saves;
create policy "read own player save" on public.player_saves
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "insert own player save" on public.player_saves;
create policy "insert own player save" on public.player_saves
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "update own player save" on public.player_saves;
create policy "update own player save" on public.player_saves
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.profiles to authenticated;
grant select on public.game_content to authenticated;
grant insert, update on public.game_content to authenticated;
grant select, insert, update on public.player_saves to authenticated;
