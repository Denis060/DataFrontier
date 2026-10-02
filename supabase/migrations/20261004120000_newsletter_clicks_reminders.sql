-- Newsletter follow-ups from the owner review (idempotent; safe to re-run).
--
-- 1. Click tracking. Resend posts email.clicked webhooks once click tracking
--    is enabled on the sending domain. Each click is stored once (keyed by the
--    Svix message id, like email_events), and newsletter_issues.clicked_count
--    counts UNIQUE clickers, the same way opened_count counts unique openers.
-- 2. Confirmation reminders: one nudge to subscribers who never clicked their
--    double-opt-in link, tracked so nobody is reminded twice.

alter table newsletter_issues add column if not exists clicked_count int not null default 0;
alter table newsletter_sends  add column if not exists clicked_at timestamptz;
alter table newsletter_subscribers add column if not exists confirm_reminder_sent_at timestamptz;

create table if not exists email_link_clicks (
  id         text primary key,                  -- svix-id
  issue_id   uuid references newsletter_issues(id) on delete cascade,
  link       text not null,
  created_at timestamptz not null default now()
);
create index if not exists email_link_clicks_issue_idx on email_link_clicks (issue_id);

alter table email_link_clicks enable row level security;
drop policy if exists "clicks staff read" on email_link_clicks;
create policy "clicks staff read" on email_link_clicks
  for select using (current_role_is(array['admin','editor']::user_role[]));
-- Writes come only from record_email_event (security definer).

-- Same function as 20260711180000, plus a p_link argument and the
-- email.clicked branch. The old 4-argument version is dropped so callers
-- always reach this one.
drop function if exists record_email_event(text, text, text, boolean);

create or replace function record_email_event(
  p_event_id  text,
  p_resend_id text,
  p_type      text,
  p_hard      boolean,
  p_link      text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue   uuid;
  v_email   text;
  v_opened  timestamptz;
  v_clicked timestamptz;
begin
  insert into email_events (id, resend_id, type)
    values (p_event_id, p_resend_id, p_type)
    on conflict (id) do nothing;
  if not found then
    return false;  -- duplicate webhook delivery; already counted
  end if;

  select issue_id, email, opened_at, clicked_at
    into v_issue, v_email, v_opened, v_clicked
    from newsletter_sends
    where resend_id = p_resend_id;
  if v_issue is null then
    return true;   -- processed, but not one of our newsletter sends
  end if;

  if p_type = 'email.delivered' then
    update newsletter_sends set status = 'delivered'
      where resend_id = p_resend_id
        and status not in ('delivered', 'bounced', 'complained');
    if found then
      update newsletter_issues set delivered_count = delivered_count + 1 where id = v_issue;
    end if;

  elsif p_type = 'email.opened' then
    if v_opened is null then
      update newsletter_sends set opened_at = now()
        where resend_id = p_resend_id and opened_at is null;
      if found then
        update newsletter_issues set opened_count = opened_count + 1 where id = v_issue;
      end if;
    end if;

  elsif p_type = 'email.clicked' then
    if p_link is not null then
      insert into email_link_clicks (id, issue_id, link) values (p_event_id, v_issue, p_link)
        on conflict (id) do nothing;
    end if;
    if v_clicked is null then
      update newsletter_sends set clicked_at = now()
        where resend_id = p_resend_id and clicked_at is null;
      if found then
        update newsletter_issues set clicked_count = clicked_count + 1 where id = v_issue;
      end if;
    end if;

  elsif p_type = 'email.bounced' then
    update newsletter_sends set status = 'bounced', error = 'bounced' where resend_id = p_resend_id;
    update newsletter_issues set bounced_count = bounced_count + 1 where id = v_issue;
    if p_hard then
      insert into email_suppressions (email, reason) values (v_email, 'hard_bounce')
        on conflict (email) do nothing;
    end if;

  elsif p_type = 'email.complained' then
    update newsletter_sends set status = 'complained', error = 'complaint' where resend_id = p_resend_id;
    update newsletter_issues set complained_count = complained_count + 1 where id = v_issue;
    insert into email_suppressions (email, reason) values (v_email, 'complaint')
      on conflict (email) do nothing;
  end if;

  return true;
end;
$$;
