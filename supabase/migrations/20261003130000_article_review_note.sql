-- The editor's note when requesting changes on an article. Shown to the
-- writer in the editor and sent to them by email. Additive and idempotent.
--
-- Writers can't tamper with it: enforce_publish_rights does not cover this
-- column, so a guard trigger keeps non-staff from changing it.

alter table articles add column if not exists review_note text;

create or replace function guard_review_note()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if new.review_note is distinct from old.review_note
     and not current_role_is(array['admin','editor']::user_role[]) then
    new.review_note := old.review_note;
  end if;
  return new;
end;
$$;

drop trigger if exists articles_guard_review_note on articles;
create trigger articles_guard_review_note before update on articles
  for each row execute function guard_review_note();
