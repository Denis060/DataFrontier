-- Cache the rendered, sanitized HTML for article bodies. Populated at save
-- time from the safe Markdown pipeline (lib/markdown.ts), so the article page
-- serves a string instead of compiling per request. The Markdown source stays
-- in `body` as the editable source of truth.

alter table articles add column body_html text;

comment on column articles.body_html is
  'Sanitized HTML rendered from body at save time. Never author-edited directly.';
