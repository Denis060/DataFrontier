-- Where a free offer is promoted: articles whose title, subtitle, kicker,
-- excerpt or tags mention one of these words (comma-separated) show the offer
-- in place of the generic newsletter box. Empty means "only on its own page".
-- Additive and idempotent.

alter table lead_magnets add column if not exists topics text;

update lead_magnets
   set topics = 'sql, postgres, postgresql, duckdb'
 where slug = 'sql-pack' and topics is null;
