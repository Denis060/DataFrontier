# Everyday Data Science

Agentic AI, Data Science, and the future of intelligent systems — written by practitioners.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind v4 · Resend · Vercel

## Setup

1. `npm install`
2. `cp .env.example .env.local` and fill in the Supabase and Resend keys.
3. Apply the schema — either paste [`supabase/migrations/20260709000000_init.sql`](supabase/migrations/20260709000000_init.sql) into the Supabase SQL Editor, or run `supabase db push` with the CLI linked.
4. In the Supabase dashboard, enable the **Google**, **GitHub**, and **Email** auth providers.
5. Create the storage buckets: `article-images`, `avatars`, `cheat-sheets`, `company-logos` (public) and `guidebooks` (private, served via signed URLs).
6. `npm run db:types` to generate `src/lib/supabase/database.types.ts`.
7. `npm run dev`

## Layout

```
src/
  app/              routes (App Router)
  lib/supabase/     browser client, server client, generated types
  proxy.ts          session refresh + /admin route guard
supabase/
  migrations/       schema, RLS policies, triggers
```

New sign-ups land as `role = 'reader'`. Promote people to `author` / `editor` / `admin` in the `profiles` table.
