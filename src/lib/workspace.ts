import "server-only";
import { createClient } from "@/lib/supabase/server";

export type WorkspacePiece = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
  published_at: string | null;
  review_note: string | null;
  views: number;
  reactions: number;
  comments: number;
};

export type Workspace = {
  pieces: WorkspacePiece[];
  followers: number;
  totals: { views: number; reactions: number; comments: number; published: number };
  profile: {
    slug: string | null;
    checklist: { label: string; done: boolean }[];
  };
};

/**
 * Everything a writer's home shows, scoped to their own work: their pieces
 * (any status, with stats), follower count, and how complete their public
 * author page is. RLS already limits drafts to their author; the explicit
 * author filter keeps other writers' published pieces out.
 */
export async function getWorkspace(profileId: string): Promise<Workspace> {
  const db = await createClient();
  const [arts, follows, prof] = await Promise.all([
    db
      .from("articles")
      .select(
        "id, title, slug, status, updated_at, published_at, review_note, view_count, reactions:article_reactions(count), comments:comments(count)",
      )
      .eq("author_id", profileId)
      .order("updated_at", { ascending: false }),
    db.from("follows").select("id", { count: "exact", head: true }).eq("author_id", profileId),
    db.from("profiles").select("slug, title, bio, avatar_url, socials").eq("id", profileId).maybeSingle(),
  ]);

  type Row = Omit<WorkspacePiece, "views" | "reactions" | "comments"> & {
    view_count: number | null;
    reactions: { count: number }[];
    comments: { count: number }[];
  };
  const pieces: WorkspacePiece[] = ((arts.data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    updated_at: r.updated_at,
    published_at: r.published_at,
    review_note: r.review_note,
    views: r.view_count ?? 0,
    reactions: r.reactions?.[0]?.count ?? 0,
    comments: r.comments?.[0]?.count ?? 0,
  }));

  const live = pieces.filter((p) => p.status === "published");
  const p = prof.data;
  const socials = (p?.socials && typeof p.socials === "object" ? p.socials : {}) as Record<string, unknown>;
  const has = (k: string) => typeof socials[k] === "string" && (socials[k] as string).trim().length > 0;

  return {
    pieces,
    followers: follows.count ?? 0,
    totals: {
      views: live.reduce((s, x) => s + x.views, 0),
      reactions: live.reduce((s, x) => s + x.reactions, 0),
      comments: live.reduce((s, x) => s + x.comments, 0),
      published: live.length,
    },
    profile: {
      slug: p?.slug ?? null,
      checklist: [
        { label: "Profile photo", done: !!p?.avatar_url },
        { label: "Title (e.g. ML Engineer at …)", done: !!p?.title?.trim() },
        { label: "Short bio", done: (p?.bio?.trim().length ?? 0) >= 40 },
        { label: "LinkedIn", done: has("linkedin") },
        { label: "ORCID, Google Scholar or GitHub", done: has("orcid") || has("scholar") || has("github") },
      ],
    },
  };
}
