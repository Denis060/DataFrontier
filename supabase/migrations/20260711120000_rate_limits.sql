-- Server-side rate limiting for public writes (comments, subscribe, apply,
-- contact). A fixed-window counter keyed by "<action>:<ip>". Called only from
-- trusted server code via the security-definer function; the table itself is
-- locked (RLS on, no policies).

create table rate_limits (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);

alter table rate_limits enable row level security;
-- No policies: only the security-definer function below (and the service role)
-- can read/write this table.

-- Atomically records a hit and reports whether it's allowed. Returns true if
-- the caller is under the limit for the current window, false if throttled.
create or replace function check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec rate_limits%rowtype;
begin
  select * into rec from rate_limits where key = p_key for update;

  if not found then
    insert into rate_limits (key, count, window_start) values (p_key, 1, now());
    return true;
  end if;

  -- Window elapsed: reset.
  if rec.window_start < now() - make_interval(secs => p_window_seconds) then
    update rate_limits set count = 1, window_start = now() where key = p_key;
    return true;
  end if;

  if rec.count >= p_limit then
    return false;
  end if;

  update rate_limits set count = count + 1 where key = p_key;
  return true;
end;
$$;

-- Housekeeping: drop stale windows so the table doesn't grow unbounded.
create or replace function prune_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from rate_limits where window_start < now() - interval '1 day';
$$;
