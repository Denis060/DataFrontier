import "server-only";
import type { createAdminClient } from "@/lib/supabase/server";
import { offerDownloadPath, offerSource } from "@/lib/free-offers";

type Db = ReturnType<typeof createAdminClient>;

/**
 * Something a reader gets for their email: a free offer (lead magnet) or a
 * single cheat sheet. Signup, confirmation and the thank-you page treat both
 * the same way; only where the download lives differs.
 */
export type Gift = {
  kind: "offer" | "sheet";
  /** lead_magnets.id for offers (stored as magnet_id); null for sheets. */
  magnetId: string | null;
  slug: string;
  title: string;
  /** subscribers.source for a signup that came for this gift. */
  source: string;
  /** The download link, unlocked by the subscriber's confirm token. */
  path: (token: string) => string;
};

export const sheetSource = (slug: string) => `sheet:${slug}`;
export const sheetDownloadPath = (slug: string, token: string) => `/cheat-sheets/${slug}/download?t=${encodeURIComponent(token)}`;

/** The gift a signup form asked for, if it's real and live. */
export async function findGift(db: Db, req: { offer?: string; sheet?: string }): Promise<Gift | null> {
  if (req.offer) {
    const { data } = await db.from("lead_magnets").select("id, slug, title").eq("slug", req.offer).eq("is_active", true).maybeSingle();
    if (data) return { kind: "offer", magnetId: data.id, slug: data.slug, title: data.title, source: offerSource(data.slug), path: (t) => offerDownloadPath(data.slug, t) };
  }
  if (req.sheet) {
    const { data } = await db.from("cheat_sheets").select("slug, title").eq("slug", req.sheet).eq("published", true).maybeSingle();
    if (data) return { kind: "sheet", magnetId: null, slug: data.slug, title: data.title, source: sheetSource(data.slug), path: (t) => sheetDownloadPath(data.slug, t) };
  }
  return null;
}

/** The gift a subscriber signed up for, from their magnet_id or source. */
export async function giftOf(db: Db, sub: { magnet_id: string | null; source: string | null }): Promise<Gift | null> {
  if (sub.magnet_id) {
    const { data } = await db.from("lead_magnets").select("slug").eq("id", sub.magnet_id).maybeSingle();
    if (data) return findGift(db, { offer: data.slug });
  }
  if (sub.source?.startsWith("sheet:")) return findGift(db, { sheet: sub.source.slice("sheet:".length) });
  return null;
}
