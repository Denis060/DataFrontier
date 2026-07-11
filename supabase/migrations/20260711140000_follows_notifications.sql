-- Follow authors and topics, and get notified when a followed author publishes.

-- ── Follows ──────────────────────────────────────────────────
-- One row = one follower following either an author or a category (exactly one
-- target, enforced by the check).
create table follows (
  id          uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  author_id   uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint follows_one_target
    check ((author_id is not null)::int + (category_id is not null)::int = 1)
);

create unique index follows_author_uniq on follows(follower_id, author_id) where author_id is not null;
create unique index follows_category_uniq on follows(follower_id, category_id) where category_id is not null;
create index follows_author_idx on follows(author_id) where author_id is not null;
create index follows_category_idx on follows(category_id) where category_id is not null;

alter table follows enable row level security;

-- Follow counts are public; who-follows-whom is readable so counts work.
create policy "follows public read" on follows for select using (true);
create policy "users follow as self" on follows for insert with check (auth.uid() = follower_id);
create policy "users unfollow own" on follows for delete using (auth.uid() = follower_id);

-- ── Notifications ────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,   -- recipient
  type       text not null,                                             -- 'new_article'
  title      text not null,
  url        text not null,
  actor_name text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, is_read, created_at desc);

alter table notifications enable row level security;

-- Strictly private: you see and manage only your own.
create policy "own notifications read" on notifications
  for select using (auth.uid() = user_id);
create policy "own notifications update" on notifications
  for update using (auth.uid() = user_id);
create policy "own notifications delete" on notifications
  for delete using (auth.uid() = user_id);
-- Inserts come from trusted server code (service role), which bypasses RLS.
