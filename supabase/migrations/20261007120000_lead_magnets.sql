-- Free offers ("lead magnets"): a landing page at /free/<slug> where a reader
-- leaves their email to get something only subscribers receive. The download
-- is unlocked by confirming the email (double opt-in, as for every signup).
-- After confirming, subscribers can answer a short optional survey (role,
-- field, experience) so the audience can be described to sponsors.
-- Additive and idempotent.

create table if not exists lead_magnets (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title       text not null check (length(trim(title)) > 0),
  tagline     text,
  description text,
  -- What's inside, one item per line.
  includes    text,
  cover_image text,
  -- Image or PDF links, one per line, merged in order into one PDF download.
  files       text,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table lead_magnets enable row level security;

drop policy if exists "read active lead magnets" on lead_magnets;
create policy "read active lead magnets" on lead_magnets
  for select using (is_active or current_role_is(array['admin','editor']::user_role[]));

drop policy if exists "staff write lead magnets" on lead_magnets;
create policy "staff write lead magnets" on lead_magnets
  for all using (current_role_is(array['admin','editor']::user_role[]))
  with check (current_role_is(array['admin','editor']::user_role[]));

-- Which offer brought a subscriber in, and their survey answers.
alter table newsletter_subscribers add column if not exists magnet_id uuid references lead_magnets(id) on delete set null;
alter table newsletter_subscribers add column if not exists survey jsonb;
alter table newsletter_subscribers add column if not exists survey_at timestamptz;
create index if not exists newsletter_subscribers_magnet_idx on newsletter_subscribers (magnet_id);

-- The first offer: the two SQL cheat sheets as one PDF.
insert into lead_magnets (slug, title, tagline, description, includes, files, sort_order)
select
  'sql-pack',
  'The Everyday SQL Pack',
  'The SQL that does most of the work, and the logic that makes it click.',
  'Two one-page references in a single PDF: the five clauses that answer most business questions, and the five ideas that explain why SQL behaves the way it does. Print it, pin it, keep it open next to your editor.',
  E'The 20% of SQL that does 80% of the work: SELECT, WHERE, GROUP BY, JOIN and HAVING\nThe order SQL actually runs your query in, and why it matters\nWHERE vs HAVING, settled\nSubqueries, sets not rows, and how NULL really behaves\nA worked query that uses all of it',
  (select string_agg(image_url, E'\n' order by case slug when 'the-20-of-sql-that-does-80-of-the-work' then 1 else 2 end)
     from cheat_sheets
    where slug in ('the-20-of-sql-that-does-80-of-the-work', 'sql-foundations-the-logic-behind-it')),
  0
where not exists (select 1 from lead_magnets where slug = 'sql-pack');
