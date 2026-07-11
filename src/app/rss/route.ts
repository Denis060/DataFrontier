import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A real RSS 2.0 feed of the latest published articles. */
export async function GET() {
  const db = await createClient();
  const { data } = await db
    .from("articles")
    .select("slug, title, excerpt, published_at, author:profiles!articles_author_id_fkey(full_name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  const items = (data ?? [])
    .map((a) => {
      const url = `${SITE}/article/${a.slug}`;
      const date = a.published_at ? new Date(a.published_at).toUTCString() : "";
      return `    <item>
      <title>${escape(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${a.excerpt ? `<description>${escape(a.excerpt)}</description>` : ""}
      ${a.author ? `<dc:creator>${escape(a.author.full_name)}</dc:creator>` : ""}
      ${date ? `<pubDate>${date}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Everyday Data Science</title>
    <link>${SITE}</link>
    <description>Agentic AI, Data Science, and the future of intelligent systems — written by practitioners.</description>
    <language>en</language>
    <atom:link href="${SITE}/rss" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
