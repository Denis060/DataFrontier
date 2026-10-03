import "server-only";
import { createClient } from "@/lib/supabase/server";
import { offerCover } from "@/lib/free-offers";

export type PromoOffer = { slug: string; title: string; tagline: string | null; cover: string | null };

type Row = { slug: string; title: string; tagline: string | null; cover_image: string | null; files: string | null; topics?: string | null; sort_order: number };

async function activeOffers(): Promise<Row[]> {
  const db = await createClient();
  // topics arrives with migration 20261009120000; without it, no offer matches.
  const { data, error } = await db
    .from("lead_magnets")
    .select("slug, title, tagline, cover_image, files, topics, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) return [];
  return (data ?? []) as Row[];
}

const toPromo = (o: Row): PromoOffer => ({ slug: o.slug, title: o.title, tagline: o.tagline, cover: offerCover(o) });

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The free offer that fits an article, if any: the first active offer one of
 * whose topic words appears in the article's title, subtitle, kicker, excerpt
 * or tags. Whole words only, so "sql" doesn't match inside another word.
 */
export async function offerForArticle(a: {
  title: string;
  subtitle?: string | null;
  kicker?: string | null;
  excerpt?: string | null;
  tags?: string[];
}): Promise<PromoOffer | null> {
  const text = [a.title, a.subtitle, a.kicker, a.excerpt, ...(a.tags ?? [])].filter(Boolean).join(" \n ").toLowerCase();
  for (const o of await activeOffers()) {
    const words = (o.topics ?? "")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    if (words.some((w) => new RegExp(`(^|[^a-z0-9])${escape(w)}([^a-z0-9]|$)`).test(text))) return toPromo(o);
  }
  return null;
}

/** Every active offer, for the homepage. */
export async function promoOffers(): Promise<PromoOffer[]> {
  return (await activeOffers()).map(toPromo);
}
