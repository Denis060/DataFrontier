-- Accountability features promised on /about.
--
-- corrections: a public, dated record of what changed when a piece was
--   wrong. Shown on the article and listed on /corrections.
-- predictions: the "what would make me wrong" claims, tracked over time on
--   /scoreboard. Rows start unpublished, so pre-filled or draft claims stay
--   private until the editor reviews and switches them on.
--
-- Both are readable by anyone only when their article is published; only
-- admins and editors write. Additive: nothing existing changes.

create table if not exists corrections (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references articles(id) on delete cascade,
  corrected_on date not null default current_date,
  note         text not null check (length(trim(note)) > 0),
  created_at   timestamptz not null default now()
);

create index if not exists corrections_article_idx on corrections (article_id, corrected_on desc);
create index if not exists corrections_date_idx on corrections (corrected_on desc);

alter table corrections enable row level security;

create policy "read corrections on published articles" on corrections
  for select using (
    exists (select 1 from articles a where a.id = article_id and a.status = 'published')
    or current_role_is(array['admin','editor']::user_role[])
  );

create policy "staff write corrections" on corrections
  for all using (current_role_is(array['admin','editor']::user_role[]))
  with check (current_role_is(array['admin','editor']::user_role[]));


create table if not exists predictions (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references articles(id) on delete cascade,
  claim        text not null check (length(trim(claim)) > 0),
  -- open: not yet testable or untested; held: the evidence so far supports
  -- the piece; wrong: the stated condition happened and the piece was wrong.
  status       text not null default 'open' check (status in ('open', 'held', 'wrong')),
  verdict_note text,
  checked_on   date,
  published    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists predictions_article_idx on predictions (article_id, sort_order);
create index if not exists predictions_public_idx on predictions (published, status);

alter table predictions enable row level security;

create policy "read published predictions" on predictions
  for select using (
    (published and exists (select 1 from articles a where a.id = article_id and a.status = 'published'))
    or current_role_is(array['admin','editor']::user_role[])
  );

create policy "staff write predictions" on predictions
  for all using (current_role_is(array['admin','editor']::user_role[]))
  with check (current_role_is(array['admin','editor']::user_role[]));

create trigger predictions_touch before update on predictions
  for each row execute function touch_updated_at();
