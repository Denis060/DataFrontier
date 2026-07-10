-- The Data Frontier — initial schema
-- Order matters: extensions → enums → profiles → taxonomy → articles → the rest → RLS.

-- ─────────────────────────────────────────────────────────────
-- 1. Extensions & enums
-- ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'editor', 'author', 'reader');
create type article_status as enum ('draft', 'in_review', 'changes_requested', 'published', 'archived');
create type subscriber_status as enum ('pending', 'confirmed', 'unsubscribed');
create type menu_location as enum ('header', 'footer_topics', 'footer_resources', 'footer_company', 'social');

-- ─────────────────────────────────────────────────────────────
-- 2. Profiles
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'reader',
  full_name  text not null,
  slug       text unique,
  avatar_url text,
  bio        text,
  title      text,
  socials    jsonb not null default '{}'::jsonb,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_slug_idx on profiles(slug);
create index profiles_role_idx on profiles(role);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 3. Taxonomy
-- ─────────────────────────────────────────────────────────────
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  color       text,
  icon        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table series (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  cover_url   text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

insert into categories (name, slug, color, icon, sort_order) values
  ('Agentic AI',        'agentic-ai',   'gold', '🤖', 1),
  ('ML & Data Science', 'ml-data',      'teal', '📊', 2),
  ('AI in Africa',      'ai-in-africa', 'teal', '🌍', 3),
  ('Careers & Skills',  'careers',      'red',  '💼', 4),
  ('Research Digest',   'research',     'gold', '🔬', 5);

-- ─────────────────────────────────────────────────────────────
-- 4. Articles
-- ─────────────────────────────────────────────────────────────
create table articles (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  subtitle         text,
  excerpt          text,
  body             jsonb,
  cover_image      text,
  cover_alt        text,
  author_id        uuid not null references profiles(id) on delete restrict,
  category_id      uuid references categories(id) on delete set null,
  series_id        uuid references series(id) on delete set null,
  series_order     int,
  status           article_status not null default 'draft',
  featured         boolean not null default false,
  reading_time     int,
  view_count       bigint not null default 0,
  meta_title       text,
  meta_description text,
  canonical_url    text,
  og_image         text,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index articles_status_pub_idx on articles(status, published_at desc);
create index articles_author_idx     on articles(author_id);
create index articles_category_idx   on articles(category_id);
create index articles_featured_idx   on articles(featured) where featured = true;

create table article_authors (
  article_id uuid references articles(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (article_id, profile_id)
);

create table article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id     uuid references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ─────────────────────────────────────────────────────────────
-- 5. Cheat sheets
-- ─────────────────────────────────────────────────────────────
create table cheat_sheets (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  description  text,
  image_url    text not null,
  thumb_url    text,
  category_id  uuid references categories(id) on delete set null,
  author_id    uuid references profiles(id) on delete set null,
  download_url text,
  view_count   bigint not null default 0,
  published    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index cheat_sheets_published_idx on cheat_sheets(published, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 6. Comments
-- ─────────────────────────────────────────────────────────────
create table comments (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null references articles(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references comments(id) on delete cascade,
  body        text not null,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now()
);

create index comments_article_idx on comments(article_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- 7. Newsletter & guidebooks
-- ─────────────────────────────────────────────────────────────
create table newsletter_subscribers (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  status       subscriber_status not null default 'pending',
  source       text,
  confirmed_at timestamptz,
  created_at   timestamptz not null default now()
);

create table guidebooks (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  description    text,
  cover_url      text,
  file_url       text not null,
  download_count bigint not null default 0,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 8. Jobs
-- ─────────────────────────────────────────────────────────────
create table jobs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  company      text not null,
  company_logo text,
  location     text,
  is_remote    boolean not null default false,
  salary_range text,
  tags         text[] not null default '{}',
  apply_url    text not null,
  is_active    boolean not null default true,
  posted_at    timestamptz not null default now()
);

create index jobs_active_idx on jobs(is_active, posted_at desc);

-- ─────────────────────────────────────────────────────────────
-- 8a. Site settings, menus, ticker
-- ─────────────────────────────────────────────────────────────
create table site_settings (
  id boolean primary key default true,
  constraint settings_singleton check (id),
  site_name                text not null default 'The DataFrontier',
  tagline                  text,
  established_year         int,
  contact_email            text,
  logo_url                 text,
  socials                  jsonb not null default '{}'::jsonb,
  default_meta_title       text,
  default_meta_description text,
  default_og_image         text,
  newsletter_headline      text,
  newsletter_subtext       text,
  newsletter_show_stats    boolean not null default true,
  newsletter_stat_override jsonb,
  hero_article_id          uuid references articles(id) on delete set null,
  spotlight_headline       text,
  spotlight_body           text,
  spotlight_cta_url        text,
  editor_profile_id        uuid references profiles(id) on delete set null,
  editor_headline          text,
  editor_bio               text,
  updated_at               timestamptz not null default now()
);

insert into site_settings (id, tagline, established_year, socials)
values (
  true,
  'Agentic AI, Data Science, and the future of intelligent systems — written by practitioners.',
  2026,
  '{"twitter":"","linkedin":"","github":"","youtube":""}'::jsonb
);

create table menu_links (
  id          uuid primary key default gen_random_uuid(),
  location    menu_location not null,
  label       text not null,
  url         text not null,
  icon        text,
  is_external boolean not null default false,
  is_button   boolean not null default false,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);

create index menu_links_loc_idx on menu_links(location, sort_order);

insert into menu_links (location, label, url, sort_order, is_button) values
  ('header', 'Agentic AI',       '/category/agentic-ai',   1, false),
  ('header', 'ML & Data',        '/category/ml-data',      2, false),
  ('header', 'Africa AI',        '/category/ai-in-africa', 3, false),
  ('header', 'Careers',          '/category/careers',      4, false),
  ('header', 'Newsletter',       '/newsletter',            5, false),
  ('header', 'Subscribe Free →', '/newsletter',            6, true);

create table ticker_items (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  url        text,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 10. Triggers & RPCs
-- ─────────────────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_touch before update on articles
  for each row execute function touch_updated_at();
create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();

create or replace function increment_view(article_slug text)
returns void language sql security definer set search_path = public as $$
  update articles set view_count = view_count + 1 where slug = article_slug;
$$;

-- ─────────────────────────────────────────────────────────────
-- 9. Row-Level Security
-- ─────────────────────────────────────────────────────────────
create or replace function current_role_is(check_roles user_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = any(check_roles)
  );
$$;

alter table profiles               enable row level security;
alter table articles               enable row level security;
alter table categories             enable row level security;
alter table tags                   enable row level security;
alter table series                 enable row level security;
alter table article_authors        enable row level security;
alter table article_tags           enable row level security;
alter table cheat_sheets           enable row level security;
alter table comments               enable row level security;
alter table newsletter_subscribers enable row level security;
alter table guidebooks             enable row level security;
alter table jobs                   enable row level security;
alter table site_settings          enable row level security;
alter table menu_links             enable row level security;
alter table ticker_items           enable row level security;

-- Profiles
create policy "profiles are public" on profiles
  for select using (true);
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);
create policy "admins manage profiles" on profiles
  for all using (current_role_is(array['admin']::user_role[]));

-- Articles
create policy "published articles are public" on articles
  for select using (
    status = 'published'
    or auth.uid() = author_id
    or current_role_is(array['admin','editor']::user_role[])
  );
create policy "authors create articles" on articles
  for insert with check (
    auth.uid() = author_id
    and current_role_is(array['author','editor','admin']::user_role[])
  );
create policy "authors edit own drafts" on articles
  for update using (
    auth.uid() = author_id
    or current_role_is(array['admin','editor']::user_role[])
  );
create policy "editors delete articles" on articles
  for delete using (current_role_is(array['admin','editor']::user_role[]));

-- Article join tables follow their parent article's staff permissions
create policy "article authors public read" on article_authors
  for select using (true);
create policy "article authors staff write" on article_authors
  for all using (current_role_is(array['admin','editor','author']::user_role[]));
create policy "article tags public read" on article_tags
  for select using (true);
create policy "article tags staff write" on article_tags
  for all using (current_role_is(array['admin','editor','author']::user_role[]));

-- Taxonomy
create policy "categories public read" on categories for select using (true);
create policy "categories staff write" on categories
  for all using (current_role_is(array['admin','editor']::user_role[]));
create policy "tags public read" on tags for select using (true);
create policy "tags staff write" on tags
  for all using (current_role_is(array['admin','editor']::user_role[]));
create policy "series public read" on series for select using (true);
create policy "series staff write" on series
  for all using (current_role_is(array['admin','editor']::user_role[]));

-- Cheat sheets
create policy "cheat sheets public read" on cheat_sheets
  for select using (
    published = true
    or current_role_is(array['admin','editor','author']::user_role[])
  );
create policy "cheat sheets staff write" on cheat_sheets
  for all using (current_role_is(array['admin','editor','author']::user_role[]));

-- Comments — sign-in required to post, which is the spam gate
create policy "approved comments public" on comments
  for select using (
    is_approved = true
    or auth.uid() = profile_id
    or current_role_is(array['admin','editor']::user_role[])
  );
create policy "signed-in users comment" on comments
  for insert with check (auth.uid() = profile_id);
create policy "users edit own comments" on comments
  for update using (auth.uid() = profile_id);
create policy "users delete own / staff moderate" on comments
  for delete using (
    auth.uid() = profile_id
    or current_role_is(array['admin','editor']::user_role[])
  );

-- Newsletter — anyone subscribes, only admins read the list
create policy "anyone can subscribe" on newsletter_subscribers
  for insert with check (true);
create policy "only admins read subscribers" on newsletter_subscribers
  for select using (current_role_is(array['admin']::user_role[]));
create policy "only admins manage subscribers" on newsletter_subscribers
  for update using (current_role_is(array['admin']::user_role[]));

-- Guidebooks & jobs
create policy "guidebooks public read" on guidebooks for select using (true);
create policy "guidebooks staff write" on guidebooks
  for all using (current_role_is(array['admin','editor']::user_role[]));
create policy "jobs public read" on jobs
  for select using (is_active = true or current_role_is(array['admin','editor']::user_role[]));
create policy "jobs staff write" on jobs
  for all using (current_role_is(array['admin','editor']::user_role[]));

-- Site settings, menus, ticker
create policy "settings public read" on site_settings for select using (true);
create policy "settings admin write" on site_settings
  for all using (current_role_is(array['admin']::user_role[]));
create policy "menus public read" on menu_links
  for select using (is_active = true or current_role_is(array['admin']::user_role[]));
create policy "menus admin write" on menu_links
  for all using (current_role_is(array['admin']::user_role[]));
create policy "ticker public read" on ticker_items
  for select using (is_active = true or current_role_is(array['admin']::user_role[]));
create policy "ticker admin write" on ticker_items
  for all using (current_role_is(array['admin']::user_role[]));
