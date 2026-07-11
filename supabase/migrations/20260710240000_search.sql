-- Universal full-text search across articles, cheat sheets, and events.
-- Generated tsvector columns + GIN indexes give ranked, stemmed search that
-- stays fast as content grows (no per-query scan-and-compute).

alter table articles add column search_tsv tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' ||
      coalesce(excerpt, '') || ' ' || coalesce(kicker, '') || ' ' ||
      coalesce(body, ''))
  ) stored;
create index articles_search_idx on articles using gin(search_tsv);

alter table cheat_sheets add column search_tsv tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;
create index cheat_sheets_search_idx on cheat_sheets using gin(search_tsv);

alter table events add column search_tsv tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, ''))
  ) stored;
create index events_search_idx on events using gin(search_tsv);

-- One RPC returns a unified, ranked result set. security definer so it runs
-- with a consistent view, but it only ever exposes PUBLISHED content — anon
-- can't find drafts through it.
create or replace function search_content(q text, max_results int default 30)
returns table (
  kind        text,
  title       text,
  description text,
  url         text,
  category    text,
  rank        real
)
language sql
stable
security definer
set search_path = public
as $$
  with tsq as (select websearch_to_tsquery('english', q) as query)
  select * from (
    select
      'article'::text as kind,
      a.title,
      a.excerpt as description,
      '/article/' || a.slug as url,
      c.name as category,
      ts_rank(a.search_tsv, tsq.query) as rank
    from articles a
    cross join tsq
    left join categories c on c.id = a.category_id
    where a.status = 'published' and a.search_tsv @@ tsq.query

    union all
    select
      'cheat-sheet', cs.title, cs.description,
      '/cheat-sheets/' || cs.slug, c2.name,
      ts_rank(cs.search_tsv, tsq.query)
    from cheat_sheets cs
    cross join tsq
    left join categories c2 on c2.id = cs.category_id
    where cs.published = true and cs.search_tsv @@ tsq.query

    union all
    select
      'event', e.title, e.summary,
      '/events/' || e.slug, c3.name,
      ts_rank(e.search_tsv, tsq.query)
    from events e
    cross join tsq
    left join categories c3 on c3.id = e.category_id
    where e.published = true and e.search_tsv @@ tsq.query
  ) results
  where q <> ''
  order by rank desc, title
  limit greatest(1, least(max_results, 50));
$$;

grant execute on function search_content(text, int) to anon, authenticated;
