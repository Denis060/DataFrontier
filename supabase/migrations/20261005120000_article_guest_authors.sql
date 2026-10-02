-- Guest co-authors: people credited on an article who don't have a writer
-- account (a one-off collaborator, a research co-author). Stored on the
-- article as a small list of { name, url }; shown in the byline, with the
-- name linking to their own profile when a link is given.
-- Additive and idempotent. Writes follow the articles policies and the
-- live-article lock like every other article column.

alter table articles add column if not exists guest_authors jsonb not null default '[]'::jsonb;
