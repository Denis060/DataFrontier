-- Double opt-in and one-click unsubscribe need unguessable tokens in the
-- confirm/unsubscribe links. The subscriber row id is a primary key used
-- elsewhere, so dedicated random tokens keep those links from leaking or
-- being enumerable.

alter table newsletter_subscribers
  add column confirm_token     uuid not null default gen_random_uuid(),
  add column unsubscribe_token uuid not null default gen_random_uuid();

create unique index newsletter_confirm_token_idx on newsletter_subscribers(confirm_token);
create unique index newsletter_unsub_token_idx on newsletter_subscribers(unsubscribe_token);
