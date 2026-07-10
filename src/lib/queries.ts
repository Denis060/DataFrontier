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

export function menuFor(menus: HomeData["menus"], location: MenuLocation) {
  return menus.filter((m) => m.location === location);
}
