-- The "Write for us" flow. A reader applies; an admin/editor reviews and, if
-- approved, promotes them (profiles.role reader -> author is a separate action,
-- admin-only via the trigger in 20260710180000).

create type application_status as enum ('pending', 'approved', 'rejected');

create table author_applications (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  bio           text not null,
  topics        text not null,          -- what they want to cover
  writing_links text,                   -- samples / portfolio
  status        application_status not null default 'pending',
  reviewer_id   uuid references profiles(id) on delete set null,
  review_note   text,                   -- feedback on rejection
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);

-- One live application per person: they may reapply only after a decision.
create unique index author_applications_one_pending
  on author_applications (profile_id)
  where status = 'pending';

create index author_applications_status_idx
  on author_applications (status, created_at desc);

alter table author_applications enable row level security;

-- An applicant may create their own application and read their own history.
create policy "apply as self" on author_applications
  for insert with check (auth.uid() = profile_id);

create policy "read own or staff reads all" on author_applications
  for select using (
    auth.uid() = profile_id
    or current_role_is(array['admin','editor']::user_role[])
  );

-- Only staff decide. Applicants cannot edit an application after submitting —
-- otherwise the review note or status could be tampered with.
create policy "staff review applications" on author_applications
  for update using (current_role_is(array['admin','editor']::user_role[]));

create policy "staff delete applications" on author_applications
  for delete using (current_role_is(array['admin']::user_role[]));

-- The applicant sets neither the outcome nor who reviewed it.
create or replace function guard_application_review()
returns trigger language plpgsql as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'pending' or new.reviewer_id is not null then
      raise exception 'An application starts pending and unreviewed'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger author_applications_guard
  before insert on author_applications
  for each row execute function guard_application_review();
