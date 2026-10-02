import "server-only";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ComposerSources = {
  articles: { title: string; url: string; excerpt: string | null; image: string | null }[];
  cheatSheets: { title: string; url: string; image: string | null; description: string | null }[];
  /** Who "Send now" would reach. Counted with the service role: editors can't read the list. */
  audience: number;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

/** What the issue composer can pull in: our own pieces, and the audience size. */
export async function composerSources(): Promise<ComposerSources> {
  const db = await createClient();
  const [arts, sheets, subs] = await Promise.all([
    db.from("articles").select("title, slug, excerpt, cover_image").eq("status", "published").order("published_at", { ascending: false }).limit(60),
    db.from("cheat_sheets").select("title, slug, image_url, description").eq("published", true).order("created_at", { ascending: false }).limit(40),
    createAdminClient().from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
  ]);
  return {
    articles: (arts.data ?? []).map((a) => ({ title: a.title, url: `${SITE}/article/${a.slug}`, excerpt: a.excerpt, image: a.cover_image })),
    cheatSheets: (sheets.data ?? []).map((c) => ({
      title: c.title,
      url: `${SITE}/cheat-sheets/${c.slug}`,
      image: c.image_url,
      description: c.description,
    })),
    audience: subs.count ?? 0,
  };
}
