# Everyday Data Science — Build Report

**Live:** https://everydaydatascience.com
**Repo:** github.com/Denis060/Everyday Data Science
**Date:** July 2026

A publication platform for AI, ML, and data science, rebuilt from an empty scaffold into a full content system — public magazine, admin newsroom, accounts and roles, newsletter, and site-wide search — deployed and reading live from its own database.

I'm sharing this to get a second opinion: **what should we avoid, what's missing, and what's worth adding before we push growth.**

---

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **Supabase** — Postgres, Auth, Storage
- **Tailwind CSS v4**
- **MDX** for article bodies (`next-mdx-remote`, compiled per-request in a Server Component)
- **Tiptap v3** for the WYSIWYG editor (round-trips to Markdown)
- **Resend** for transactional + newsletter email
- **Playwright** for end-to-end tests
- **Vercel** hosting

By the numbers: 13 feature commits, ~30 pages + 7 API routes, 20 Postgres tables, 12 schema migrations, 4 E2E test suites.

---

## What's built

### Public / reading side
- **Homepage** — magazine layout: hero feature, live "Latest" ticker, category grid with live counts, "Africa AI Spotlight," curated jobs band, "From the Editor" block. Every band reads from the database.
- **Article page** — MDX rendering (syntax-highlighted code via Shiki, Callout/Aside components, GFM tables, autolinked headings). Sticky right rail with share, "More in category," "More by author," newsletter CTA. Per-article view counting. Real SEO/OpenGraph metadata with fallbacks. Draft preview for the author only (via RLS).
- **Category** and **Author** pages — paginated lists; author pages include co-authored pieces.
- **Cheat sheets** — a browsable library; each links to a detail page showing the infographic full-size, with Download and Share.
- **Events** — upcoming/past split by start time; detail pages with a register button that only shows for future events.
- **Jobs board**, **Newsletter archive**, **Write for Us**, and standard pages: Contact, Advertise, Privacy, Terms.
- **RSS feed** (`/rss`) — real RSS 2.0 of the latest published articles.
- **Universal search** — a header search bar with a debounced instant-results dropdown + a full `/search` page. Backed by Postgres full-text search (tsvector + GIN indexes) across articles, cheat sheets, and events, ranked by `ts_rank`. Only published content is exposed.

### Admin / newsroom
- **Article editor** — write in a **WYSIWYG rich mode (Tiptap)** or **raw Markdown**, with a live preview rendered by the exact same component as the public page. Image upload by drag-and-drop or button, stored in Supabase Storage. Slug auto-generates; reading time computes on save. Draft → in-review → published workflow.
- **Cheat-sheet manager** — CRUD with infographic upload and a publish toggle.
- **Newsletter** — send an issue to all confirmed subscribers; subscriber counts.
- **Contributor applications** — review queue; approving an applicant promotes them to author in one action.
- Role-scoped admin nav (authors see only their own drafts; editors/admins see everything).

### Accounts, roles, newsletter
- **Auth** — email/password now; Google + GitHub ready to enable in the Supabase dashboard.
- **Role ladder** — reader → author → editor → admin; every promotion is admin-controlled.
- **Newsletter** — double opt-in (subscribe → confirmation email → confirmed), one-click unsubscribe, wired through Resend (degrades gracefully with no key: subscriptions still record, confirm URL logs to the server console).

---

## Governing principles (held throughout)

1. **Nothing but article content is hardcoded.** Navigation, the ticker, footer menus, social links, spotlight copy, editor bio and badges, resources — all live in the database (`site_settings`, `menu_links`, `ticker_items`, etc.) and are edited from the admin.
2. **Stats are computed, never invented.** The original design mocked up "12K subscribers / 94% open rate." Real numbers are computed from the DB, and a stat tile is hidden rather than shown as zero — no fabricated social proof.

---

## Data model (20 tables)

profiles, articles, article_authors, article_tags, categories, tags, series, formats, cheat_sheets, events, jobs, comments, guidebooks, resources, newsletter_subscribers, newsletter_issues, author_applications, site_settings, menu_links, ticker_items.

Article/newsletter bodies are **MDX text**. `formats` is separate from `categories` (a piece can be an Agentic-AI *Tutorial*). A `site_settings` singleton row drives the configurable front-end.

---

## Security posture

- **Row-Level Security on all 20 tables.**
- Writing the role ladder out as a spec and testing the *live* database against it surfaced **four privilege-escalation bugs**, all reachable from the public REST API with a normal user's token:
  - An **author could PATCH their own `profiles.role` to `admin`** in one request.
  - Authors could **self-publish** (set `articles.status = 'published'`), bypassing review.
  - Any author could **add themselves as co-author** on someone else's article.
  - Editors **couldn't moderate comments** (no policy existed).
- Root cause: **RLS gates which _rows_ you can touch, never which _column values_ you can write.** Each was fixed with a `BEFORE` trigger and re-verified by minting a real non-admin JWT and attempting the escalation — a passing build proves nothing here.
- Post-login redirects are guarded against open-redirect vectors. Admin is gated at two layers (proxy for session, page for role). Storage uploads are RLS-gated (staff-only write, public read) and size/type-limited.

---

## Testing

- **Playwright E2E:** (1) full write flow — log in, write a body, upload an image, publish, reopen, and assert the body + loaded image survive; (2) responsive overflow across all key pages at phone + desktop widths; (3) the WYSIWYG round-trip and the MDX-component guard; (4) search-open overflow.
- These exist because **two data-loss bugs and four layout bugs slipped past checks that only read code** — so a real browser now does the looking. Every feature was also verified against the live database/API, not just by a green build.

---

## Deployment

Live on Vercel with production env vars set. Auto-deploy on push to `main` can be enabled via Git integration (currently deploys are manual via CLI).

---

## Known open items

**Only the site owner can do these:**
- Rotate credentials shared during the build (DB password, Supabase + Vercel tokens).
- Add the live Vercel URL to Supabase Auth's redirect list so OAuth/email login works in production.
- Add the `RESEND_API_KEY` to turn on newsletter sending.
- Replace the three placeholder (stock) cheat-sheet images with real infographics via the admin.

**Deliberately deferred (Phase 2 — endorsed earlier):**
- Engagement counts on cards (reactions/comments), save-for-later bookmarks ("Library"), follow-a-topic / follow-an-author. Retention mechanics, to add once an audience arrives.

---

## Questions for review

1. **What should we _avoid_?** Any anti-patterns, scope traps, or things that will hurt at scale?
2. **What's missing for a credible v1 launch** — moderation tooling, analytics, sitemap/SEO depth, accessibility, rate-limiting, spam protection on comments/subscribe, image optimization/CDN, error monitoring?
3. **Is the Phase-2 ordering right**, or should something jump ahead?
4. **Anything about the architecture** (MDX-as-text, RLS + triggers, single-repo, Supabase-everything) you'd flag before we build more on top of it?
