-- The `authors edit own drafts` policy grants UPDATE on an author's own row,
-- which includes the `status` column. An author could therefore publish or
-- archive their own work, bypassing review — straight from the public API,
-- with no admin UI involved.
--
-- RLS gates *which rows* you may touch, not *which values* you may write,
-- so the constraint lives in a trigger.

create or replace function enforce_publish_rights()
returns trigger
language plpgsql
-- Deliberately NOT security definer: we need `current_user` to be the role
-- PostgREST switched into (anon / authenticated / service_role), not the
-- function owner. `current_role_is` is security definer and reads profiles.
as $$
begin
  -- Trusted server contexts: the service-role key, migrations, seeds.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  -- Editors and admins may move an article to any status.
  if current_role_is(array['admin','editor']::user_role[]) then
    return new;
  end if;

  -- Everyone else may only ever leave it in a pre-publication state.
  if new.status in ('published', 'archived') then
    raise exception 'Only an editor or admin may publish or archive an article'
      using errcode = '42501';  -- insufficient_privilege
  end if;

  -- ...and may not forge or backdate a publication timestamp.
  -- OLD is unassigned on INSERT, so the two paths must be separate.
  if tg_op = 'INSERT' then
    if new.published_at is not null then
      raise exception 'Only an editor or admin may set published_at'
        using errcode = '42501';
    end if;
  elsif new.published_at is distinct from old.published_at then
    raise exception 'Only an editor or admin may change published_at'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger articles_enforce_publish_rights
  before insert or update on articles
  for each row execute function enforce_publish_rights();

comment on function enforce_publish_rights is
  'Authors may write drafts and submit for review; only editors/admins publish.';
