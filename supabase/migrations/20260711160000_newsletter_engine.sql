-- Newsletter sending engine: structured issues, scheduling, a per-recipient
-- send ledger that makes duplicates structurally impossible, a suppression
-- list, and atomic claim helpers for a resumable, concurrency-safe dispatcher.

-- ── Issue lifecycle ──────────────────────────────────────────
create type issue_status as enum ('draft', 'scheduled', 'sending', 'sent', 'failed', 'canceled');

alter table newsletter_issues
  add column status       issue_status not null default 'draft',
  add column scheduled_for timestamptz,
  -- Structured six-part content, rendered to BOTH email and web archive from
  -- one source. Shape: { intro, cheat_sheet:{text,image_url,url},
  -- practical_tip:{text}, worth_reading:{text,url}, africa_ai:{text,url},
  -- opportunity:{text,url}, closing_question:{text} }.
  add column content      jsonb not null default '{}'::jsonb,
  -- Real, webhook-sourced counts (Phase 2 wires the webhook).
  add column delivered_count int not null default 0,
  add column opened_count    int not null default 0,
  add column bounced_count    int not null default 0,
  add column complained_count int not null default 0,
  add column started_at   timestamptz;

-- NOTE: the dead `body` column and the fake `open_rate` are removed in Phase 2,
-- together with the webhook stats work that replaces open_rate with real
-- delivered/opened counts. Left intact here so the seed, homepage stats, and
-- archive keep working while the engine lands.

create index newsletter_issues_due_idx
  on newsletter_issues(scheduled_for)
  where status = 'scheduled';

-- ── Send ledger: one row per issue × subscriber ──────────────
-- The unique constraint is the core dedupe guarantee.
create table newsletter_sends (
  id            uuid primary key default gen_random_uuid(),
  issue_id      uuid not null references newsletter_issues(id) on delete cascade,
  subscriber_id uuid not null references newsletter_subscribers(id) on delete cascade,
  email         text not null,
  status        text not null default 'pending',  -- pending | sending | sent | failed | bounced | complained
  resend_id     text,                              -- provider message id, for webhook correlation
  error         text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  unique (issue_id, subscriber_id)
);

create index newsletter_sends_claim_idx on newsletter_sends(issue_id, status);
create index newsletter_sends_resend_idx on newsletter_sends(resend_id) where resend_id is not null;

-- ── Suppression list ─────────────────────────────────────────
create table email_suppressions (
  email      text primary key,
  reason     text not null,   -- hard_bounce | complaint | manual
  created_at timestamptz not null default now()
);

-- ── RLS: staff read; all writes are service-role (dispatcher/webhook) ─────
alter table newsletter_sends enable row level security;
alter table email_suppressions enable row level security;

create policy "sends staff read" on newsletter_sends
  for select using (current_role_is(array['admin','editor']::user_role[]));
create policy "suppressions staff read" on email_suppressions
  for select using (current_role_is(array['admin','editor']::user_role[]));
-- No insert/update/delete policies: only the service role touches these.

-- ── Atomic claim: transition scheduled → sending, once ───────
-- Returns true only for the caller that actually moved a due 'scheduled' issue
-- into 'sending' (or is resuming one already 'sending'). Row lock prevents two
-- concurrent dispatchers from both starting a fresh send.
create or replace function claim_issue_for_sending(p_issue_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cur issue_status;
begin
  select status into cur from newsletter_issues where id = p_issue_id for update;
  if cur is null then return false; end if;
  if cur = 'sending' then return true; end if;               -- resume
  if cur = 'scheduled' then
    update newsletter_issues
      set status = 'sending', started_at = coalesce(started_at, now())
      where id = p_issue_id;
    return true;
  end if;
  return false;                                               -- draft/sent/failed/canceled
end;
$$;

-- ── Claim a batch of unsent ledger rows, exactly once ────────
-- FOR UPDATE SKIP LOCKED hands each pending row to exactly one worker, so
-- concurrent dispatchers never send the same recipient. Rows stuck in 'sending'
-- longer than 10 min (a crashed run) are re-claimable; the dispatcher sends
-- with a per-recipient idempotency key so a re-send never double-delivers.
create or replace function claim_send_batch(p_issue_id uuid, p_limit int)
returns setof newsletter_sends
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update newsletter_sends s
    set status = 'sending'
  where s.id in (
    select id from newsletter_sends
    where issue_id = p_issue_id
      and (status = 'pending'
           or (status = 'sending' and created_at < now() - interval '10 minutes'))
    order by created_at
    limit p_limit
    for update skip locked
  )
  returning s.*;
end;
$$;
