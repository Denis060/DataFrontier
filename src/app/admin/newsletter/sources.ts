import "server-only";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ComposerSources = {
  articles: { title: string; url: string; excerpt: string | null; image: string | null }[];
  cheatSheets: { title: string; url: string; image: string | null; description: string | null }[];
  /** Writers with a public page, for the Writer spotlight, with their latest piece. */
  writers: { name: string; url: string; image: string | null; bio: string | null; title: string | null; latest: { title: string; url: string } | null }[];
  /** Who "Send now" would reach. Counted with the service role: editors can't read the list. */
  audience: number;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

/** What the issue composer can pull in: our own pieces, and the audience size. */
export async function composerSources(): Promise<ComposerSources> {
  const db = await createClient();
  const [arts, sheets, subs, people] = await Promise.all([
    db.from("articles").select("title, slug, excerpt, cover_image").eq("status", "published").order("published_at", { ascending: false }).limit(60),
    db.from("cheat_sheets").select("title, slug, image_url, description").eq("published", true).order("created_at", { ascending: false }).limit(40),
    createAdminClient().from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    db.from("profiles").select("id, full_name, slug, avatar_url, bio, title").in("role", ["author", "editor", "admin"]).not("slug", "is", null),
  ]);
  // Latest published piece per writer (one read of recent articles).
  const { data: recent } = await db
    .from("articles")
    .select("author_id, title, slug")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(200);
  const latestBy = new Map<string, { title: string; url: string }>();
  for (const a of recent ?? []) if (!latestBy.has(a.author_id)) latestBy.set(a.author_id, { title: a.title, url: `${SITE}/article/${a.slug}` });
  return {
    articles: (arts.data ?? []).map((a) => ({ title: a.title, url: `${SITE}/article/${a.slug}`, excerpt: a.excerpt, image: a.cover_image })),
    cheatSheets: (sheets.data ?? []).map((c) => ({
      title: c.title,
      url: `${SITE}/cheat-sheets/${c.slug}`,
      image: c.image_url,
      description: c.description,
    })),
    audience: subs.count ?? 0,
    writers: (people.data ?? [])
      .filter((p) => latestBy.has(p.id))
      .map((p) => ({
        name: p.full_name,
        url: `${SITE}/author/${p.slug}`,
        image: p.avatar_url,
        bio: p.bio,
        title: p.title,
        latest: latestBy.get(p.id) ?? null,
      })),
  };
}
