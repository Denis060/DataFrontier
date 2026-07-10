-- Three gaps found by probing the live API as a real `author` account.

-- ─────────────────────────────────────────────────────────────
-- 1. Co-authorship and tagging were open to ANY author.
--
-- `article_authors staff write` granted every author full write on the join
-- table, so an author could insert themselves as co-author of someone else's
-- article — putting their byline on it and listing it on their author page.
-- Writes must be scoped to the article's own primary author, or to staff.
-- ─────────────────────────────────────────────────────────────
drop policy if exists "article authors staff write" on article_authors;
drop policy if exists "article tags staff write" on article_tags;

create policy "article authors write" on article_authors
  for all using (
    exists (
      select 1 from articles a
      where a.id = article_authors.article_id
        and (a.author_id = auth.uid() or current_role_is(array['admin','editor']::user_role[]))
    )
  );

create policy "article tags write" on article_tags
  for all using (
    exists (
      select 1 from articles a
      where a.id = article_tags.article_id
        and (a.author_id = auth.uid() or current_role_is(array['admin','editor']::user_role[]))
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2. Cheat sheets were writable by any author, including other people's.
-- ─────────────────────────────────────────────────────────────
drop policy if exists "cheat sheets staff write" on cheat_sheets;

create policy "cheat sheets write" on cheat_sheets
  for all using (
    author_id = auth.uid() or current_role_is(array['admin','editor']::user_role[])
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Editors could not moderate comments.
--
-- The only UPDATE policy was `auth.uid() = profile_id`, so `is_approved` could
-- never be flipped by staff — the moderation flag was unreachable.
-- ─────────────────────────────────────────────────────────────
create policy "staff moderate comments" on comments
  for update using (current_role_is(array['admin','editor']::user_role[]));
