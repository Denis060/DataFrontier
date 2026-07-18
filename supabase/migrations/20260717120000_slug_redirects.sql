-- Old-slug -> new-slug map so re-slugging a published post never breaks its URL
-- or loses its ranking. The article route 301s any old slug to the current one.
create table if not exists public.slug_redirects (
  old_slug text primary key,
  new_slug text not null,
  created_at timestamptz not null default now()
);

alter table public.slug_redirects enable row level security;

-- Public read: the article route looks these up on a miss. Writes go through the
-- service role in the save action, so no write policy is needed.
drop policy if exists "slug_redirects are public" on public.slug_redirects;
create policy "slug_redirects are public" on public.slug_redirects
  for select using (true);
