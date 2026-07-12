-- Retire the dead newsletter_issues columns. `open_rate` was never populated by
-- the real sending engine (webhooks track delivered_count/opened_count instead,
-- and the homepage now computes the rate from those); `body` was the old
-- freeform content, replaced long ago by the structured `content` JSONB.
-- No code references either after this migration.

alter table newsletter_issues drop column if exists open_rate;
alter table newsletter_issues drop column if exists body;
