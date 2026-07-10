-- CRITICAL: privilege escalation.
--
-- The `users update own profile` policy is `for update using (auth.uid() = id)`.
-- RLS decides which *rows* you may touch, never which *columns* or *values* —
-- so any signed-in user could PATCH their own profile row and set
-- role = 'admin'. Verified against the live API: an `author` account promoted
-- itself to `admin` in a single request.
--
-- Same shape of bug as articles.status, and the same shape of fix.

create or replace function enforce_profile_role_rights()
returns trigger
language plpgsql
-- Not security definer: `current_user` must be the role PostgREST switched
-- into (anon / authenticated / service_role), not the function owner.
as $$
begin
  -- Trusted server contexts: service-role key, migrations, the signup trigger
  -- (handle_new_user is security definer, so it runs as the owner).
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Nobody may self-assign anything but the default on the way in.
    if new.role <> 'reader' then
      raise exception 'New profiles must start as reader' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role then
    if not current_role_is(array['admin']::user_role[]) then
      raise exception 'Only an admin may change a user role' using errcode = '42501';
    end if;
  end if;

  -- `is_active` is an access control too: a suspended user must not revive
  -- themselves.
  if new.is_active is distinct from old.is_active then
    if not current_role_is(array['admin']::user_role[]) then
      raise exception 'Only an admin may activate or suspend an account'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_enforce_role_rights
  before insert or update on profiles
  for each row execute function enforce_profile_role_rights();

comment on function enforce_profile_role_rights is
  'Roles and account status are admin-only; RLS alone cannot constrain column values.';
