-- Private saved-articles ("Library"). Unlike reactions/likes these are personal,
-- so every policy is scoped to the owner — no public read.

create table bookmarks (
  article_id uuid not null references articles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, profile_id)
);

create index bookmarks_profile_idx on bookmarks(profile_id, created_at desc);

alter table bookmarks enable row level security;

create policy "users read own bookmarks" on bookmarks
  for select using (auth.uid() = profile_id);
create policy "users add own bookmarks" on bookmarks
  for insert with check (auth.uid() = profile_id);
create policy "users remove own bookmarks" on bookmarks
  for delete using (auth.uid() = profile_id);
