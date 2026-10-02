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
    /** field: the id on /admin/profile that fixes it. */
    checklist: { label: string; done: boolean; field: string }[];
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
        { label: "Profile photo", done: !!p?.avatar_url, field: "avatar" },
        { label: "Title (e.g. ML Engineer at …)", done: !!p?.title?.trim(), field: "title" },
        { label: "Short bio", done: (p?.bio?.trim().length ?? 0) >= 40, field: "bio" },
        { label: "LinkedIn", done: has("linkedin"), field: "linkedin" },
        { label: "ORCID, Google Scholar or GitHub", done: has("orcid") || has("scholar") || has("github"), field: "orcid" },
      ],
    },
  };
}

export type Follower = { name: string; slug: string | null; avatar: string | null; title: string | null; since: string };

/** Who follows a writer, newest first. Follows and profiles are public; no emails. */
export async function getFollowers(profileId: string): Promise<Follower[]> {
  const db = await createClient();
  // Name the FK: follows reaches profiles twice (follower and author).
  const { data } = await db
    .from("follows")
    .select("created_at, follower:profiles!follows_follower_id_fkey(full_name, slug, avatar_url, title)")
    .eq("author_id", profileId)
    .order("created_at", { ascending: false });
  type Row = { created_at: string; follower: { full_name: string; slug: string | null; avatar_url: string | null; title: string | null } | null };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.follower)
    .map((r) => ({
      name: r.follower!.full_name,
      slug: r.follower!.slug,
      avatar: r.follower!.avatar_url,
      title: r.follower!.title,
      since: r.created_at,
    }));
}

export type PieceComment = {
  id: string;
  body: string;
  at: string;
  approved: boolean;
  isReply: boolean;
  who: string;
  whoSlug: string | null;
  article: { title: string; slug: string };
};

/**
 * Reader comments on a writer's own published pieces, newest first. Only
 * approved ones are shown in full; waiting ones are counted (moderation stays
 * with editors).
 */
export async function getCommentsOnMyPieces(profileId: string): Promise<{ comments: PieceComment[]; waiting: number }> {
  const db = await createClient();
  const { data: arts } = await db.from("articles").select("id").eq("author_id", profileId).eq("status", "published");
  const ids = (arts ?? []).map((a) => a.id);
  if (!ids.length) return { comments: [], waiting: 0 };

  const [{ data }, { count }] = await Promise.all([
    db
      .from("comments")
      .select("id, body, created_at, is_approved, parent_id, author:profiles!comments_profile_id_fkey(full_name, slug), article:articles(title, slug)")
      .in("article_id", ids)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(100),
    db.from("comments").select("id", { count: "exact", head: true }).in("article_id", ids).eq("is_approved", false),
  ]);
  type Row = {
    id: string;
    body: string;
    created_at: string;
    is_approved: boolean;
    parent_id: string | null;
    author: { full_name: string; slug: string | null } | null;
    article: { title: string; slug: string } | null;
  };
  return {
    comments: ((data ?? []) as unknown as Row[])
      .filter((r) => r.article)
      .map((r) => ({
        id: r.id,
        body: r.body,
        at: r.created_at,
        approved: r.is_approved,
        isReply: !!r.parent_id,
        who: r.author?.full_name ?? "A reader",
        whoSlug: r.author?.slug ?? null,
        article: r.article!,
      })),
    waiting: count ?? 0,
  };
}
