import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { SECTION_DEFS, type IssueContent, type IssueExtras } from "@/lib/newsletter";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

/**
 * What the issue adds from the site at render time: the three latest
 * published articles the issue doesn't already link, and the writers of any
 * of our articles it features. Best-effort: on any error the issue simply
 * renders without these blocks.
 */
export async function issueExtras(content: IssueContent): Promise<IssueExtras> {
  try {
    const db = createAdminClient();
    const linked = new Set<string>();
    for (const def of SECTION_DEFS) {
      const url = content[def.key]?.url;
      const m = url?.match(/\/article\/([a-z0-9-]+)/i);
      if (m) linked.add(m[1]);
    }

    const [latest, featured] = await Promise.all([
      db.from("articles").select("title, slug").eq("status", "published").order("published_at", { ascending: false }).limit(8),
      linked.size
        ? db
            .from("articles")
            .select("author:profiles!articles_author_id_fkey(full_name)")
            .eq("status", "published")
            .in("slug", [...linked])
        : Promise.resolve({ data: [] as { author: { full_name: string } | null }[] }),
    ]);

    const more = (latest.data ?? [])
      .filter((a) => !linked.has(a.slug))
      .slice(0, 3)
      .map((a) => ({ title: a.title, url: `${SITE}/article/${a.slug}` }));

    const writers = [
      ...new Set(
        ((featured.data ?? []) as unknown as { author: { full_name: string } | null }[])
          .map((r) => r.author?.full_name)
          .filter((n): n is string => !!n),
      ),
    ];

    return { more, writers, siteUrl: SITE };
  } catch {
    return { siteUrl: SITE };
  }
}
