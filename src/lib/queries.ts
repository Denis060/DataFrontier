import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Accent = Database["public"]["Enums"]["accent_color"];
export type MenuLocation = Database["public"]["Enums"]["menu_location"];

/** Shared shape for every article card on the site. */
const ARTICLE_SELECT = `
  id, slug, title, excerpt, kicker, reading_time, published_at, featured,
  author:profiles!articles_author_id_fkey (full_name, slug, title),
  category:categories (name, slug, color),
  format:formats (name, slug, color),
  reactions:article_reactions(count)
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
  reactions?: { count: number }[];
};

/** Flatten the embedded aggregate to a plain number. */
export const reactionCount = (a: Pick<ArticleCard, "reactions">) => a.reactions?.[0]?.count ?? 0;

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
      db.from("newsletter_issues").select("delivered_count, opened_count").eq("status", "sent"),
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
  // Real open rate = opened ÷ delivered, from webhook counts. Only shown once
  // there's enough delivered volume to be meaningful — below that a tiny test
  // send would publish a misleading number, so the tile stays hidden.
  const OPEN_RATE_MIN_DELIVERED = 50;
  const delivered = issues.reduce((s, i) => s + (i.delivered_count ?? 0), 0);
  const opened = issues.reduce((s, i) => s + (i.opened_count ?? 0), 0);
  const openRate = delivered >= OPEN_RATE_MIN_DELIVERED ? Math.round((opened / delivered) * 100) : null;

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
      openRate,
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
      `id, slug, title, subtitle, excerpt, kicker, body, body_html, status, category_id, author_id,
       cover_image, cover_alt, reading_time, published_at, featured, view_count, series_id, series_position,
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

export type CommentNode = {
  id: string;
  body: string;
  parent_id: string | null;
  profile_id: string;
  is_approved: boolean;
  created_at: string;
  author: { full_name: string; slug: string | null; avatar_url: string | null; role: string } | null;
  like_count: number;
  liked: boolean;
  replies: CommentNode[];
};

/**
 * Visible comments for an article, as a two-level tree. RLS decides visibility:
 * everyone sees approved comments; a signed-in user also sees their own pending
 * ones; staff see all. Returns the count of approved top-level + nested too.
 */
export async function getComments(articleId: string) {
  const db = await createClient();
  const [{ data }, { data: auth }] = await Promise.all([
    db
      .from("comments")
      .select(
        "id, body, parent_id, profile_id, is_approved, created_at, author:profiles(full_name, slug, avatar_url, role), likes:comment_likes(count)",
      )
      .eq("article_id", articleId)
      .order("created_at", { ascending: true }),
    db.auth.getUser(),
  ]);

  type Raw = Omit<CommentNode, "replies" | "like_count" | "liked"> & { likes: { count: number }[] };
  const raw = (data ?? []) as unknown as Raw[];

  // Which of these comments the signed-in reader has liked.
  const me = auth.user?.id ?? null;
  const likedSet = new Set<string>();
  if (me && raw.length) {
    const { data: mine } = await db
      .from("comment_likes")
      .select("comment_id")
      .eq("profile_id", me)
      .in("comment_id", raw.map((r) => r.id));
    for (const l of mine ?? []) likedSet.add(l.comment_id);
  }

  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const r of raw) {
    byId.set(r.id, {
      ...r,
      like_count: r.likes?.[0]?.count ?? 0,
      liked: likedSet.has(r.id),
      replies: [],
    });
  }
  for (const r of raw) {
    const node = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) byId.get(r.parent_id)!.replies.push(node);
    else roots.push(node);
  }

  return { tree: roots, count: raw.filter((r) => r.is_approved).length };
}

export type SeriesSummary = { id: string; title: string; slug: string; description: string | null; count: number };

/** All series (learning paths) with a count of their published articles. */
export async function getAllSeries(): Promise<SeriesSummary[]> {
  const db = await createClient();
  const { data } = await db
    .from("series")
    .select("id, title, slug, description, articles(count)")
    .order("sort_order");
  return (data ?? []).map((s) => {
    const row = s as unknown as { id: string; title: string; slug: string; description: string | null; articles: { count: number }[] };
    return { id: row.id, title: row.title, slug: row.slug, description: row.description, count: row.articles?.[0]?.count ?? 0 };
  });
}

/** One series + its published articles, in path order. */
export async function getSeriesBySlug(slug: string) {
  const db = await createClient();
  const { data: series } = await db.from("series").select("id, title, slug, description").eq("slug", slug).maybeSingle();
  if (!series) return null;
  const { data: articles } = await db
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("series_id", series.id)
    .eq("status", "published")
    .order("series_position", { ascending: true });
  return { series, articles: (articles ?? []) as unknown as ArticleCard[] };
}

/** For an article in a series: the series, this article's spot, and prev/next. */
export async function getArticleSeriesNav(seriesId: string, articleId: string) {
  const db = await createClient();
  const [{ data: series }, { data: items }] = await Promise.all([
    db.from("series").select("title, slug").eq("id", seriesId).maybeSingle(),
    db
      .from("articles")
      .select("id, slug, title, series_position")
      .eq("series_id", seriesId)
      .eq("status", "published")
      .order("series_position", { ascending: true }),
  ]);
  if (!series || !items) return null;
  const idx = items.findIndex((a) => a.id === articleId);
  if (idx === -1) return null;
  return {
    series,
    position: idx + 1,
    total: items.length,
    prev: idx > 0 ? items[idx - 1] : null,
    next: idx < items.length - 1 ? items[idx + 1] : null,
  };
}

/** Reaction count for an article + whether the signed-in reader has reacted. */
export async function getArticleReactions(articleId: string) {
  const db = await createClient();
  const [{ count }, { data: auth }] = await Promise.all([
    db.from("article_reactions").select("*", { count: "exact", head: true }).eq("article_id", articleId),
    db.auth.getUser(),
  ]);
  let reacted = false;
  if (auth.user) {
    const { data } = await db
      .from("article_reactions")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("profile_id", auth.user.id)
      .maybeSingle();
    reacted = !!data;
  }
  return { count: count ?? 0, reacted };
}

export type AuthorInsights = {
  totalViews: number;
  publishedCount: number;
  totalReactions: number;
  totalComments: number;
  topArticles: { slug: string; title: string; views: number; reactions: number }[];
};

/** An author's own performance — their published articles' views, reactions,
 *  and comments. Scoped to the author; no site-wide or subscriber data. */
export async function getAuthorInsights(authorId: string): Promise<AuthorInsights> {
  const db = await createClient();
  const { data } = await db
    .from("articles")
    .select("slug, title, view_count, reactions:article_reactions(count), comments:comments(count)")
    .eq("author_id", authorId)
    .eq("status", "published")
    .order("view_count", { ascending: false });

  type Row = { slug: string; title: string; view_count: number | null; reactions: { count: number }[]; comments: { count: number }[] };
  const arts = (data ?? []) as unknown as Row[];
  const react = (a: Row) => a.reactions?.[0]?.count ?? 0;

  return {
    totalViews: arts.reduce((s, a) => s + (a.view_count ?? 0), 0),
    publishedCount: arts.length,
    totalReactions: arts.reduce((s, a) => s + react(a), 0),
    totalComments: arts.reduce((s, a) => s + (a.comments?.[0]?.count ?? 0), 0),
    topArticles: arts.slice(0, 6).map((a) => ({ slug: a.slug, title: a.title, views: a.view_count ?? 0, reactions: react(a) })),
  };
}

/** Whether the signed-in reader has saved this article. */
export async function isBookmarked(articleId: string): Promise<boolean> {
  const db = await createClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return false;
  const { data } = await db
    .from("bookmarks")
    .select("article_id")
    .eq("article_id", articleId)
    .eq("profile_id", auth.user.id)
    .maybeSingle();
  return !!data;
}

/** The signed-in reader's saved articles (their Library), newest first. */
export async function getLibrary(profileId: string): Promise<ArticleCard[]> {
  const db = await createClient();
  const { data } = await db
    .from("bookmarks")
    .select(`created_at, article:articles(${ARTICLE_SELECT})`)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  return (data ?? [])
    .map((row) => (row as unknown as { article: ArticleCard | null }).article)
    .filter((a): a is ArticleCard => !!a);
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
    .select("issue_number, title, slug, summary, sent_at")
    .eq("status", "sent")
    .order("issue_number", { ascending: false });
  return data ?? [];
}

/** One issue for the public archive, by slug. Only issues that have gone out
 *  (sending or sent) are visible — never drafts or scheduled. Accepts the id
 *  too, so older "view in browser" links built from the id still resolve. */
export async function getNewsletterIssueBySlug(slugOrId: string) {
  const db = await createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const { data } = await db
    .from("newsletter_issues")
    .select("id, issue_number, title, slug, summary, content, sent_at, status")
    .eq(isUuid ? "id" : "slug", slugOrId)
    .in("status", ["sending", "sent"])
    .maybeSingle();
  return data;
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

export async function getCheatSheet(slug: string) {
  const db = await createClient();
  const { data } = await db
    .from("cheat_sheets")
    .select("id, title, slug, description, image_url, download_url, category:categories(name, slug, color), author:profiles(full_name, slug)")
    .eq("slug", slug)
    .maybeSingle();
  return data;
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

/** Follower count for an author or category, and whether the current user follows. */
export async function getFollowState(
  target: { authorId?: string; categoryId?: string },
  viewerId: string | null,
) {
  const db = await createClient();
  const col = target.authorId ? "author_id" : "category_id";
  const val = target.authorId ?? target.categoryId!;

  const [countRes, mineRes] = await Promise.all([
    db.from("follows").select("id", { count: "exact", head: true }).eq(col, val),
    viewerId
      ? db.from("follows").select("id").eq("follower_id", viewerId).eq(col, val).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return { count: countRes.count ?? 0, following: !!mineRes.data };
}

/** The signed-in user's unread notification count. */
export async function getUnreadCount(viewerId: string | null): Promise<number> {
  if (!viewerId) return 0;
  const db = await createClient();
  const { count } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewerId)
    .eq("is_read", false);
  return count ?? 0;
}

/** Articles from the authors and topics a user follows, newest first. */
export async function getFollowingFeed(viewerId: string): Promise<ArticleCard[]> {
  const db = await createClient();
  const { data: follows } = await db
    .from("follows")
    .select("author_id, category_id")
    .eq("follower_id", viewerId);

  const authorIds = (follows ?? []).map((f) => f.author_id).filter(Boolean) as string[];
  const categoryIds = (follows ?? []).map((f) => f.category_id).filter(Boolean) as string[];
  if (authorIds.length === 0 && categoryIds.length === 0) return [];

  const ors: string[] = [];
  if (authorIds.length) ors.push(`author_id.in.(${authorIds.join(",")})`);
  if (categoryIds.length) ors.push(`category_id.in.(${categoryIds.join(",")})`);

  const { data } = await db
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .or(ors.join(","))
    .order("published_at", { ascending: false })
    .limit(30);

  return (data ?? []) as ArticleCard[];
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
