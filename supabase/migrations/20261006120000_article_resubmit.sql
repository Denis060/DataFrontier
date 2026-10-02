-- Closing the review loop the other way. When a writer resubmits after
-- "Request changes" they can say what they changed (author_note), and the
-- editor can see exactly what changed: review_snapshot keeps the body as it
-- was when it was sent back. Additive and idempotent.

alter table articles add column if not exists author_note text;
alter table articles add column if not exists review_snapshot text;

-- Writers must not be able to rewrite the editor's note or the snapshot the
-- diff is taken against. Extends the guard from 20261003130000.
create or replace function guard_review_note()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if not current_role_is(array['admin','editor']::user_role[]) then
    if new.review_note is distinct from old.review_note then
      new.review_note := old.review_note;
    end if;
    if new.review_snapshot is distinct from old.review_snapshot then
      new.review_snapshot := old.review_snapshot;
    end if;
  end if;
  return new;
end;
$$;
