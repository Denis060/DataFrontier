-- Cheat sheets get the same review loop as articles.
--
-- Until now any author could create a cheat sheet with published = true, or
-- edit one that was already live: RLS ("cheat sheets write": own rows) gates
-- which rows, never which values. Now:
--   * status: draft -> in_review -> published (or changes_requested), with an
--     editor's review_note. `published` stays as the public flag the read
--     policy and every query use; a trigger keeps it equal to status.
--   * Authors can't publish, and can't edit a live sheet, unless an admin has
--     marked them trusted (profiles.trusted). Editors and admins can do both.
--   * Only an admin can change profiles.trusted.
-- Additive and idempotent.

alter table cheat_sheets add column if not exists status text not null default 'draft'
  check (status in ('draft', 'in_review', 'changes_requested', 'published'));
alter table cheat_sheets add column if not exists review_note text;
alter table cheat_sheets add column if not exists submitted_at timestamptz;
update cheat_sheets set status = 'published' where published and status <> 'published';
create index if not exists cheat_sheets_status_idx on cheat_sheets (status);

alter table profiles add column if not exists trusted boolean not null default false;

-- ── Who may change profiles.trusted ─────────────────────────────────────────
create or replace function guard_profile_trusted()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.trusted then
      raise exception 'New profiles cannot start as trusted' using errcode = '42501';
    end if;
  elsif new.trusted is distinct from old.trusted and not current_role_is(array['admin']::user_role[]) then
    raise exception 'Only an admin may mark a writer as trusted' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_trusted on profiles;
create trigger profiles_guard_trusted
  before insert or update on profiles
  for each row execute function guard_profile_trusted();

-- ── Publishing rights on cheat sheets ───────────────────────────────────────
create or replace function enforce_cheat_sheet_rights()
returns trigger
language plpgsql
as $$
declare
  can_publish boolean;
begin
  -- `published` always follows status, whoever writes the row.
  new.published := (new.status = 'published');

  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  can_publish := current_role_is(array['admin','editor']::user_role[])
    or exists (select 1 from profiles where id = auth.uid() and trusted);

  if not can_publish then
    if tg_op = 'UPDATE' then
      -- A live sheet changes only through an editor (or a trusted writer).
      if old.status = 'published' then
        raise exception 'This cheat sheet is live. Ask an editor to change it.' using errcode = '42501';
      end if;
      -- The editor's note is the editor's.
      if new.review_note is distinct from old.review_note then
        new.review_note := old.review_note;
      end if;
    end if;
    -- Moving into these states is the editor's call (saving edits while a
    -- sheet sits in changes_requested is fine).
    if new.status in ('published', 'changes_requested')
       and (tg_op = 'INSERT' or new.status is distinct from old.status) then
      raise exception 'Only an editor can publish or send back a cheat sheet. Submit it for review.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists cheat_sheets_enforce_rights on cheat_sheets;
create trigger cheat_sheets_enforce_rights
  before insert or update on cheat_sheets
  for each row execute function enforce_cheat_sheet_rights();

-- Taking a live sheet down is also an editor's (or trusted writer's) call.
create or replace function enforce_cheat_sheet_delete()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return old;
  end if;
  if old.status = 'published'
     and not current_role_is(array['admin','editor']::user_role[])
     and not exists (select 1 from profiles where id = auth.uid() and trusted) then
    raise exception 'This cheat sheet is live. Ask an editor to remove it.' using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists cheat_sheets_enforce_delete on cheat_sheets;
create trigger cheat_sheets_enforce_delete
  before delete on cheat_sheets
  for each row execute function enforce_cheat_sheet_delete();
