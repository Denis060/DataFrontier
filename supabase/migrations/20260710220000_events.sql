-- Events: AI/data-science events, hosted by us or found online, that readers
-- can attend. Public read (published only), staff write.

create table events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,                 -- MDX, same pipeline as articles
  summary      text,                 -- card blurb
  cover_image  text,
  host         text,                 -- organiser, e.g. "The Data Frontier" or "PyData"
  location     text,                 -- city, or "Online"
  is_online    boolean not null default false,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  timezone     text,                 -- IANA name, for display
  register_url text,                 -- where to sign up / join
  category_id  uuid references categories(id) on delete set null,
  is_featured  boolean not null default false,
  published    boolean not null default false,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index events_published_start_idx on events(published, starts_at);
create index events_start_idx on events(starts_at);

create trigger events_touch before update on events
  for each row execute function touch_updated_at();

alter table events enable row level security;

create policy "published events are public" on events
  for select using (
    published = true or current_role_is(array['admin','editor','author']::user_role[])
  );

create policy "staff write events" on events
  for all using (current_role_is(array['admin','editor','author']::user_role[]));
