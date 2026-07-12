-- Likes on individual comments. One row per (comment, person); counts are read
-- via an embedded aggregate. Public read so counts show for everyone; a signed-in
-- user may like/unlike only as themselves.

create table comment_likes (
  comment_id uuid not null references comments(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, profile_id)
);

create index comment_likes_comment_idx on comment_likes(comment_id);

alter table comment_likes enable row level security;

create policy "comment likes are public" on comment_likes
  for select using (true);
create policy "users like as themselves" on comment_likes
  for insert with check (auth.uid() = profile_id);
create policy "users unlike their own" on comment_likes
  for delete using (auth.uid() = profile_id);
