-- Live articles change only through an editor.
--
-- 20260710170000 deliberately let authors edit their own published pieces
-- (to fix typos). That contradicts the public promise on /write that an
-- editor reviews everything published under a writer's name: an author could
-- rewrite a live piece and it went out unreviewed. Now a non-staff writer
-- cannot update a published or archived article at all; they ask an editor.
--
-- Unchanged: trusted contexts (service role, and SECURITY DEFINER functions
-- such as increment_view, which run as their owner) and editors/admins.
-- Idempotent: it only redefines the function the existing trigger calls.

create or replace function enforce_publish_rights()
returns trigger
language plpgsql
as $$
declare
  writable_states article_status[] := array['draft','in_review','changes_requested']::article_status[];
begin
  -- Trusted server contexts: the service-role key, migrations, seeds, and
  -- SECURITY DEFINER functions owned by postgres.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  -- Editors and admins may change anything.
  if current_role_is(array['admin','editor']::user_role[]) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not (new.status = any (writable_states)) then
      raise exception 'Only an editor or admin may publish or archive an article'
        using errcode = '42501';
    end if;
    if new.published_at is not null then
      raise exception 'Only an editor or admin may set published_at'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE: a live (or archived) piece is locked for writers.
  if not (old.status = any (writable_states)) then
    raise exception 'This article is live. Ask an editor to make changes to it'
      using errcode = '42501';
  end if;

  -- Otherwise the status may only move within the writable set.
  if new.status is distinct from old.status and not (new.status = any (writable_states)) then
    raise exception 'Only an editor or admin may publish or archive an article'
      using errcode = '42501';
  end if;

  if new.published_at is distinct from old.published_at then
    raise exception 'Only an editor or admin may change published_at'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
