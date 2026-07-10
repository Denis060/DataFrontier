import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Accent = Database["public"]["Enums"]["accent_color"];
export type MenuLocation = Database["public"]["Enums"]["menu_location"];

/** Shared shape for every article card on the site. */
const ARTICLE_SELECT = `
  id, slug, title, excerpt, kicker, reading_time, published_at, featured,
  author:profiles!articles_author_id_fkey (full_name, slug, title),
  category:categories (name, slug, color),
  format:formats (name, slug, color)
` as const;

export type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  kicker: string | null;
  reading_time: number | null;
  published_at: string | null;
  featured: boolean;
  author: { full_name: string; slug: string | null; title: string | null } | null;
  category: { name: string; slug: string; color: string | null } | null;
  format: { name: string; slug: string; color: Accent } | null;
};

/**
 * The homepage reads from nine tables. Every query is independent, so they all
 * go out at once — the page is only as slow as the slowest one.
 */
export async function getHomeData() {
  const db = await createClient();

  const published = () =>
    db.from("articles").select(ARTICLE_SELECT).eq("status", "published");

  const countIn = (categoryId: string) =>
    db
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("category_id", categoryId);

  const [settingsRes, categoriesRes, tickerRes, menusRes, jobsRes, jobCountRes, resourcesRes, issuesRes, subsRes] =
    await Promise.all([
      db.from("site_settings").select("*").eq("id", true).single(),
      db.from("categories").select("id, name, slug, color, icon").order("sort_order"),
      db.from("ticker_items").select("id, text, url").eq("is_active", true).order("sort_order"),
      db.from("menu_links").select("id, location, label, url, icon, is_external, is_button").eq("is_active", true).order("sort_order"),
      db.from("jobs").select("*").eq("is_active", true).order("posted_at", { ascending: false }).limit(3),
      db.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
      db.from("resources").select("*").eq("is_active", true).order("sort_order"),
      db.from("newsletter_issues").select("open_rate").not("sent_at", "is", null),
      db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    ]);

  const settings = settingsRes.data;
  const categories = categoriesRes.data ?? [];
  const byslug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const [heroRes, latestRes, spotlightRes, editorRes, ...columnRes] = await Promise.all([
    settings?.hero_article_id
      ? published().eq("id", settings.hero_article_id).maybeSingle()
      : published().eq("featured", true).order("published_at", { ascending: false }).limit(1).maybeSingle(),
    published().eq("featured", false).order("published_at", { ascending: false }).limit(4),
    byslug["ai-in-africa"]
      ? published().eq("category_id", byslug["ai-in-africa"]).order("published_at", { ascending: false }).limit(4)
      : Promise.resolve({ data: [] }),
    settings?.editor_profile_id
      ? db.from("profiles").select("full_name, slug, title, bio, avatar_url").eq("id", settings.editor_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
    ...["agentic-ai", "ml-data", "research"].map((slug) =>
      byslug[slug]
        ? published().eq("category_id", byslug[slug]).order("published_at", { ascending: false }).limit(3)
        : Promise.resolve({ data: [] }),
    ),
  ]);

  const counts = await Promise.all(categories.map((c) => countIn(c.id)));

  const issues = issuesRes.data ?? [];
  const rates = issues.map((i) => i.open_rate).filter((r): r is number => r != null);

  return {
    settings,
    hero: (heroRes.data ?? null) as ArticleCard | null,
    latest: (latestRes.data ?? []) as ArticleCard[],
    spotlight: (spotlightRes.data ?? []) as ArticleCard[],
    columns: columnRes.map((r) => (r.data ?? []) as ArticleCard[]),
    editor: editorRes.data ?? null,
    categories: categories.map((c, i) => ({ ...c, count: counts[i].count ?? 0 })),
    ticker: tickerRes.data ?? [],
    menus: menusRes.data ?? [],
    jobs: jobsRes.data ?? [],
    jobCount: jobCountRes.count ?? 0,
    resources: resourcesRes.data ?? [],
    stats: {
      subscribers: subsRes.count ?? 0,
      issues: issues.length,
      openRate: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null,
    },
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;

/**
 * RLS already hides unpublished rows from anonymous readers, and shows them to
 * their own author — so this deliberately does not filter on status. A draft is
 * previewable by the person writing it, and invisible to everyone else.
 */
export async function getArticle(slug: string) {
  const db = await createClient();
  // One `author` alias only — PostgREST rejects a relationship embedded twice
  // under the same name ("table name articles_author_1 specified more than once").
  const { data, error } = await db
    .from("articles")
    .select(
      `id, slug, title, subtitle, excerpt, kicker, body, status, category_id, author_id,
       cover_image, cover_alt, reading_time, published_at, featured, view_count,
       meta_title, meta_description, canonical_url, og_image,
       author:profiles!articles_author_id_fkey (full_name, slug, title, bio, avatar_url),
       category:categories (name, slug, color),
       format:formats (name, slug, color)`,
    )
    .eq("slug", slug)
    .maybeSingle();

  // A malformed query must not masquerade as a missing article.
  if (error) throw new Error(`getArticle(${slug}): ${error.message}`);
  return data;
}

export type FullArticle = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

/** Same category, newest first, excluding the article being read. */
export async function getRelated(articleId: string, categoryId: string | null, limit = 3) {
  if (!categoryId) return [];
  const db = await createClient();
  const { data } = await db
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", articleId)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ArticleCard[];
}

/** Other pieces by the same author, for the article rail. */
export async function getMoreByAuthor(authorId: string, excludeId: string, limit = 3) {
  const db = await createClient();
  const { data } = await db
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("author_id", authorId)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ArticleCard[];
}

export async function getJobs() {
  const db = await createClient();
  const { data } = await db
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("posted_at", { ascending: false });
  return data ?? [];
}

export async function getNewsletterIssues() {
  const db = await createClient();
  const { data } = await db
    .from("newsletter_issues")
    .select("issue_number, title, slug, summary, sent_at, open_rate")
    .not("sent_at", "is", null)
    .order("issue_number", { ascending: false });
  return data ?? [];
}

export async function getCheatSheets() {
  const db = await createClient();
  const { data } = await db
    .from("cheat_sheets")
    .select("id, title, slug, description, image_url, thumb_url, download_url, category:categories(name, color)")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

const EVENT_SELECT =
  "id, slug, title, summary, description, cover_image, host, location, is_online, starts_at, ends_at, timezone, register_url, is_featured, category:categories(name, slug, color)";

/** Upcoming and past events, split by start time. */
export async function getEvents() {
  const db = await createClient();
  const nowIso = new Date().toISOString();
  const [upcoming, past] = await Promise.all([
    db.from("events").select(EVENT_SELECT).eq("published", true).gte("starts_at", nowIso).order("starts_at", { ascending: true }),
    db.from("events").select(EVENT_SELECT).eq("published", true).lt("starts_at", nowIso).order("starts_at", { ascending: false }).limit(12),
  ]);
  return { upcoming: upcoming.data ?? [], past: past.data ?? [] };
}

export async function getEvent(slug: string) {
  const db = await createClient();
  const { data } = await db.from("events").select(EVENT_SELECT).eq("slug", slug).maybeSingle();
  return data;
}

/** Header and footer chrome, for pages that aren't the homepage. */
export async function getChrome() {
  const db = await createClient();
  const [settingsRes, menusRes, tickerRes] = await Promise.all([
    db.from("site_settings").select("*").eq("id", true).single(),
    db.from("menu_links").select("id, location, label, url, icon, is_external, is_button").eq("is_active", true).order("sort_order"),
    db.from("ticker_items").select("id, text, url").eq("is_active", true).order("sort_order"),
  ]);
  return {
    settings: settingsRes.data,
    menus: menusRes.data ?? [],
    ticker: tickerRes.data ?? [],
  };
}

export type Chrome = Awaited<ReturnType<typeof getChrome>>;

export const PER_PAGE = 12;

type Page<T> = { items: T[]; total: number; page: number; perPage: number };

const range = (page: number, perPage: number): [number, number] => [
  (page - 1) * perPage,
  page * perPage - 1,
];

export async function getCategory(slug: string) {
  const db = await createClient();
  const { data, error } = await db
    .from("categories")
    .select("id, name, slug, description, color, icon")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getCategory(${slug}): ${error.message}`);
  return data;
}

export async function getArticlesByCategory(
  categoryId: string,
  page = 1,
): Promise<Page<ArticleCard>> {
  const db = await createClient();

  // PostgREST 416s when `range` starts past the last row, so the total is
  // established first and an out-of-range page short-circuits to empty.
  const { count } = await db
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("category_id", categoryId);

  const total = count ?? 0;
  if ((page - 1) * PER_PAGE >= total) {
    return { items: [], total, page, perPage: PER_PAGE };
  }

  const { data, error } = await db
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .order("published_at", { ascending: false })
    .range(...range(page, PER_PAGE));

  if (error) throw new Error(`getArticlesByCategory: ${error.message}`);
  return { items: (data ?? []) as ArticleCard[], total, page, perPage: PER_PAGE };
}

export async function getAuthor(slug: string) {
  const db = await createClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, slug, title, bio, avatar_url, socials, role")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getAuthor(${slug}): ${error.message}`);
  return data;
}

/**
 * An author's page must include pieces they co-wrote, not just those where
 * they are `articles.author_id`. Co-authorship lives in a join table, so the
 * ids are collected first and folded into a single `or` — which keeps the
 * count and the pagination in SQL rather than in JS.
 */
export async function getArticlesByAuthor(
  profileId: string,
  page = 1,
): Promise<Page<ArticleCard>> {
  const db = await createClient();

  const { data: coAuthored } = await db
    .from("article_authors")
    .select("article_id")
    .eq("profile_id", profileId);

  const ids = (coAuthored ?? []).map((r) => r.article_id);
  const filter = ids.length
    ? `author_id.eq.${profileId},id.in.(${ids.join(",")})`
    : `author_id.eq.${profileId}`;

  const { count } = await db
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .or(filter);

  const total = count ?? 0;
  if ((page - 1) * PER_PAGE >= total) {
    return { items: [], total, page, perPage: PER_PAGE };
  }

  const { data, error } = await db
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .or(filter)
    .order("published_at", { ascending: false })
    .range(...range(page, PER_PAGE));

  if (error) throw new Error(`getArticlesByAuthor: ${error.message}`);
  return { items: (data ?? []) as ArticleCard[], total, page, perPage: PER_PAGE };
}

export function menuFor(menus: HomeData["menus"], location: MenuLocation) {
  return menus.filter((m) => m.location === location);
}
