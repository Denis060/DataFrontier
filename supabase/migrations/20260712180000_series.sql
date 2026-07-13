-- Series / learning paths: ordered collections of articles (e.g. "Intro to
-- Agentic AI, 5 parts"). An article belongs to at most one series, at a position.
-- Written idempotently so a partial apply can be safely completed.

create table if not exists series (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table articles add column if not exists series_id uuid references series(id) on delete set null;
alter table articles add column if not exists series_position int;
create index if not exists articles_series_idx on articles(series_id, series_position);

alter table series enable row level security;

drop policy if exists "series public read" on series;
create policy "series public read" on series
  for select using (true);

drop policy if exists "series staff write" on series;
create policy "series staff write" on series
  for all using (current_role_is(array['admin', 'editor']::user_role[]));
