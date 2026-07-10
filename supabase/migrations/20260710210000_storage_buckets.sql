-- Storage buckets + RLS. These were documented as a manual dashboard step and
-- never created; doing it in SQL makes them reproducible with the rest.
--
-- Image uploads land here (article covers, inline images, avatars, logos).
-- Public buckets are world-readable by URL; writes are gated by role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('article-images', 'article-images', true,  5242880,  array['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('avatars',        'avatars',        true,  2097152,  array['image/jpeg','image/png','image/webp']),
  ('cheat-sheets',   'cheat-sheets',   true,  10485760, array['image/jpeg','image/png','image/webp','image/gif','application/pdf']),
  ('company-logos',  'company-logos',  true,  1048576,  array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- ── Reads ────────────────────────────────────────────────────
-- The buckets are public, so anonymous GETs by URL already work. These SELECT
-- policies let the client SDK list/inspect objects in them too.
create policy "public buckets are readable" on storage.objects
  for select using (
    bucket_id in ('article-images', 'avatars', 'cheat-sheets', 'company-logos')
  );

-- ── Writes ───────────────────────────────────────────────────
-- Staff (author/editor/admin) may upload and replace article images, cheat
-- sheets, and company logos. `current_role_is` is defined in the init migration.
create policy "staff write article images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('article-images', 'cheat-sheets', 'company-logos')
    and current_role_is(array['admin','editor','author']::user_role[])
  );

create policy "staff update article images" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('article-images', 'cheat-sheets', 'company-logos')
    and current_role_is(array['admin','editor','author']::user_role[])
  );

create policy "staff delete article images" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('article-images', 'cheat-sheets', 'company-logos')
    and current_role_is(array['admin','editor','author']::user_role[])
  );

-- ── Avatars ──────────────────────────────────────────────────
-- Anyone signed in may manage their own avatar. Convention: the object path is
-- prefixed with the user's id, e.g. `avatars/<uid>/photo.webp`, so the first
-- path segment must match auth.uid().
create policy "users write own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
