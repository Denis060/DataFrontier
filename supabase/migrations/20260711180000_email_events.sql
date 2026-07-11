-- Webhook-sourced delivery events → real per-issue stats + auto-suppression.
-- Resend delivers webhooks at-least-once, so processing MUST be idempotent:
-- email_events is keyed by the Svix message id, and every counter increment is
-- guarded so a duplicate delivery can never double-count.

create table if not exists email_events (
  id         text primary key,          -- svix-id: stable across provider retries
  resend_id  text,                       -- correlates to newsletter_sends.resend_id
  type       text not null,              -- email.delivered | email.opened | email.bounced | email.complained
  created_at timestamptz not null default now()
);

-- First-open timestamp, so opened_count is UNIQUE openers (a real open rate),
-- not raw open events (a recipient can open many times).
alter table newsletter_sends add column if not exists opened_at timestamptz;

-- ── Record one delivery event, atomically and idempotently ───────────────────
-- Returns true if this event was newly processed, false if it was a duplicate
-- delivery already accounted for. p_hard is set by the caller only for a
-- permanent (hard) bounce — soft bounces are counted but NOT suppressed, so a
-- transient failure (full mailbox, greylisting) never drops a good subscriber.
create or replace function record_email_event(
  p_event_id  text,
  p_resend_id text,
  p_type      text,
  p_hard      boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue  uuid;
  v_email  text;
  v_opened timestamptz;
begin
  insert into email_events (id, resend_id, type)
    values (p_event_id, p_resend_id, p_type)
    on conflict (id) do nothing;
  if not found then
    return false;  -- duplicate webhook delivery; already counted
  end if;

  select issue_id, email, opened_at
    into v_issue, v_email, v_opened
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
