-- Web Push subscriptions (browser notifications when a new post lands). One row
-- per browser endpoint; profile_id is optional so anonymous readers can opt in.
-- Managed only by the service role (the subscribe action + the sender); no
-- public policies.

create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_profile_idx on push_subscriptions(profile_id);

alter table push_subscriptions enable row level security;
-- No policies: only createAdminClient() (service role) touches this table.
