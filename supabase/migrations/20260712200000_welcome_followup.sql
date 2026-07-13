-- A single, light follow-up email a couple of days after someone confirms —
-- a "welcome series" of exactly two touches (welcome, then this). One column
-- marks it sent so the cron never sends it twice.

alter table newsletter_subscribers add column if not exists welcome_followup_sent_at timestamptz;
