"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";
import { rateLimit, isBot } from "@/lib/rate-limit";

export type CommentState = { ok: boolean; message: string } | null;

/**
 * Post a comment. Sign-in required (the spam gate), plus a honeypot and an
 * IP rate limit. New comments start UNAPPROVED — the author sees their own
 * (via RLS) marked pending, others don't, until staff approve.
 */
export async function postComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  // Honeypot: silently accept-looking, actually drop.
  if (isBot(formData)) return { ok: true, message: "Thanks, your comment is awaiting review." };

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, message: "Please sign in to comment." };

  const articleId = String(formData.get("article_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const parentRaw = String(formData.get("parent_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!articleId || !slug) return { ok: false, message: "Something went wrong." };
  if (body.length < 2) return { ok: false, message: "Write a little more." };
  if (body.length > 2000) return { ok: false, message: "Comments are limited to 2000 characters." };

  if (!(await rateLimit("comment", { limit: 5, windowSeconds: 300 }))) {
    return { ok: false, message: "You're commenting too fast. Try again in a few minutes." };
  }

  // Staff (author/editor/admin) are trusted — their comments and replies post
  // live instead of waiting in the moderation queue.
  const isStaff = hasRole(profile.role, ["admin", "editor", "author"]);

  const db = await createClient();
  const { error } = await db.from("comments").insert({
    article_id: articleId,
    profile_id: profile.id,
    parent_id: parentRaw || null,
    body,
    is_approved: isStaff,
  });

  if (error) return { ok: false, message: "Could not post your comment. Try again." };

  revalidatePath(`/article/${slug}`);
  return {
    ok: true,
    message: isStaff ? "Posted." : "Thanks, your comment is awaiting review.",
  };
}

/**
 * Toggle a like on a comment. Returns the resulting liked state so the client
 * can reconcile its optimistic update. No revalidate — the UI updates in place.
 */
export async function toggleCommentLike(
  commentId: string,
): Promise<{ liked: boolean } | { error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sign in to like comments." };

  const db = await createClient();
  const { data: existing } = await db
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    await db.from("comment_likes").delete().eq("comment_id", commentId).eq("profile_id", profile.id);
    return { liked: false };
  }
  const { error } = await db.from("comment_likes").insert({ comment_id: commentId, profile_id: profile.id });
  if (error) return { error: "Could not register your like." };
  return { liked: true };
}

/** Delete your own comment. */
export async function deleteOwnComment(id: string, slug: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const db = await createClient();
  // RLS also enforces this, but scope the delete explicitly.
  await db.from("comments").delete().eq("id", id).eq("profile_id", profile.id);
  revalidatePath(`/article/${slug}`);
}
