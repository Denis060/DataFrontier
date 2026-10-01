-- A learning path needs two descriptions with different jobs: `description` is
-- the one-or-two-line blurb used on cards and as the page meta description,
-- while `long_description` is the full editorial introduction rendered on the
-- path's own page (Markdown, through the same sanitized pipeline as articles).
-- Additive and idempotent: existing paths keep working with it null.

alter table series add column if not exists long_description text;

comment on column series.long_description is
  'Markdown introduction shown on the series page. `description` stays the short blurb used on cards and in meta tags.';
