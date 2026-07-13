-- The `series` table was scaffolded in the init migration without a sort_order;
-- the learning-paths feature orders paths by it. Add it (unused table, 0 rows).

alter table series add column if not exists sort_order int not null default 0;
