-- Reactions (claps/likes) on articles. One per (article, person); public read
-- so counts show as social proof on cards; a signed-in reader reacts only as
-- themselves.

create table article_reactions (
  article_id uuid not null references articles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, profile_id)
);

create index article_reactions_article_idx on article_reactions(article_id);

alter table article_reactions enable row level security;

create policy "article reactions are public" on article_reactions
  for select using (true);
create policy "users react as themselves" on article_reactions
  for insert with check (auth.uid() = profile_id);
create policy "users unreact their own" on article_reactions
  for delete using (auth.uid() = profile_id);
