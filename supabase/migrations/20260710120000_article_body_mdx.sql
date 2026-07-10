-- Article bodies are authored as MDX (GitHub-flavoured Markdown plus embedded
-- React components), compiled per-request in a Server Component.
--
-- jsonb suited a block editor; MDX is source text. Every existing body is null,
-- so this is a free conversion today and a data migration later.

alter table articles
  alter column body type text using body #>> '{}';

comment on column articles.body is
  'MDX source. Rendered server-side; only author/editor/admin may write it (see RLS).';

-- Newsletter issues share the same authoring pipeline.
alter table newsletter_issues
  alter column body type text using body #>> '{}';
