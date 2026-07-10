-- Closes the gaps between the homepage design and the initial schema.
-- Everything the design renders must be editable from the admin, not hardcoded.

-- ─────────────────────────────────────────────────────────────
-- Shared accent colors. The design only ever uses these three,
-- and a check constraint keeps a typo from rendering an unstyled pill.
-- ─────────────────────────────────────────────────────────────
create type accent_color as enum ('gold', 'teal', 'red');

-- ─────────────────────────────────────────────────────────────
-- 1. Formats — the colored pill on every article card.
--    Orthogonal to category: an Agentic AI piece may be a Tutorial
--    or an Analysis, so this cannot live on `categories`.
-- ─────────────────────────────────────────────────────────────
create table formats (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  color      accent_color not null default 'gold',
  sort_order int not null default 0
);

insert into formats (name, slug, color, sort_order) values
  ('Deep Dive',       'deep-dive',       'gold', 1),
  ('Tutorial',        'tutorial',        'gold', 2),
  ('Analysis',        'analysis',        'gold', 3),
  ('Explainer',       'explainer',       'gold', 4),
  ('Opinion',         'opinion',         'gold', 5),
  ('Research',        'research',        'gold', 6),
  ('arXiv Breakdown', 'arxiv-breakdown', 'teal', 7),
  ('New Release',     'new-release',     'teal', 8),
  ('Benchmark Watch', 'benchmark-watch', 'teal', 9),
  ('Research Brief',  'research-brief',  'teal', 10),
  ('Policy Brief',    'policy-brief',    'teal', 11),
  ('Guest Analysis',  'guest-analysis',  'teal', 12),
  ('News',            'news',            'teal', 13),
  ('Careers',         'careers',         'red',  14);

alter table articles
  add column format_id uuid references formats(id) on delete set null,
  -- The short editorial label after the reading time: "Infrastructure",
  -- "Code-Along", "Nigeria · Fintech", "Sierra Leone".
  add column kicker text;

create index articles_format_idx on articles(format_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Resources — the "Tools & Resources" column on the homepage.
-- ─────────────────────────────────────────────────────────────
create table resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  emoji       text,
  description text,
  url         text not null,
  cta_label   text not null default 'Learn more →',
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index resources_active_idx on resources(is_active, sort_order);

insert into resources (title, emoji, description, url, cta_label, sort_order) values
  ('Agentic AI: Concepts, Architectures & Applications', '📚',
   'Ibrahim Kamara''s book — the definitive practitioner guide to building agent systems.',
   '#', 'Get the book →', 1),
  ('Open-Source Toolkits', '🔧',
   'Curated repos, starter templates, and evaluation harnesses for agentic workloads.',
   '#', 'Explore toolkit →', 2),
  ('Data Science Learning Path', '🎓',
   'From Python fundamentals to production ML. Structured, self-paced curriculum.',
   '#', 'Start learning →', 3),
  ('Weekly Data Viz Challenge', '📊',
   'A new dataset every Monday. Submit your visualization, get community feedback.',
   '#', 'Join challenge →', 4);

-- ─────────────────────────────────────────────────────────────
-- 3. Newsletter issues — powers the "Issues Published" stat and
--    the archive page the footer links to.
-- ─────────────────────────────────────────────────────────────
create table newsletter_issues (
  id           uuid primary key default gen_random_uuid(),
  issue_number int not null unique,
  title        text not null,
  slug         text not null unique,
  summary      text,
  body         jsonb,
  sent_at      timestamptz,
  recipients   int,
  open_rate    numeric(5, 2),   -- percent, backfilled from Resend
  created_at   timestamptz not null default now()
);

create index newsletter_issues_sent_idx on newsletter_issues(sent_at desc nulls last);

-- ─────────────────────────────────────────────────────────────
-- 4. Editor badges + job brand color
-- ─────────────────────────────────────────────────────────────
alter table site_settings
  -- [{"label":"Agentic AI","color":"gold"}, ...]
  add column editor_badges jsonb not null default '[]'::jsonb;

alter table jobs
  -- Hex used to tint the letter tile, e.g. '#00B4D8' for Anthropic.
  add column brand_color text;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS for the new tables
-- ─────────────────────────────────────────────────────────────
alter table formats           enable row level security;
alter table resources         enable row level security;
alter table newsletter_issues enable row level security;

create policy "formats public read" on formats for select using (true);
create policy "formats staff write" on formats
  for all using (current_role_is(array['admin','editor']::user_role[]));

create policy "resources public read" on resources
  for select using (is_active = true or current_role_is(array['admin','editor']::user_role[]));
create policy "resources staff write" on resources
  for all using (current_role_is(array['admin','editor']::user_role[]));

-- Only sent issues are public; drafts stay with staff.
create policy "sent issues public read" on newsletter_issues
  for select using (sent_at is not null or current_role_is(array['admin','editor']::user_role[]));
create policy "issues staff write" on newsletter_issues
  for all using (current_role_is(array['admin','editor']::user_role[]));
