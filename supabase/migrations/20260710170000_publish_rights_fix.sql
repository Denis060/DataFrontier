-- The first version of enforce_publish_rights() tested `new.status`, which is
-- already 'published' on every update to a published article. An author could
-- therefore not fix a typo in their own live piece.
--
-- The rule is about the *transition*, not the current value:
--   • a non-staff writer may never move an article INTO published/archived
--   • nor move one OUT of published/archived (no silent unpublishing)
--   • nor touch published_at
--   • but may freely edit content at any status

create or replace function enforce_publish_rights()
returns trigger
language plpgsql
as $$
declare
  writable_states article_status[] := array['draft','in_review','changes_requested']::article_status[];
begin
  -- Trusted server contexts: the service-role key, migrations, seeds.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  -- Editors and admins may move an article to any status.
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

  -- UPDATE: the status may only change within the writable set.
  if new.status is distinct from old.status then
    if not (new.status = any (writable_states)) then
      raise exception 'Only an editor or admin may publish or archive an article'
        using errcode = '42501';
    end if;
    if not (old.status = any (writable_states)) then
      raise exception 'Only an editor or admin may change the status of a published article'
        using errcode = '42501';
    end if;
  end if;

  if new.published_at is distinct from old.published_at then
    raise exception 'Only an editor or admin may change published_at'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
