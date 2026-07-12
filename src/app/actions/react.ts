"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

/**
 * Toggle a reaction on an article. Returns the resulting state so the client can
 * reconcile its optimistic update. No revalidate — the button updates in place.
 */
export async function toggleArticleReaction(
  articleId: string,
): Promise<{ reacted: boolean } | { error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sign in to react." };

  const db = await createClient();
  const { data: existing } = await db
    .from("article_reactions")
    .select("article_id")
    .eq("article_id", articleId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    await db.from("article_reactions").delete().eq("article_id", articleId).eq("profile_id", profile.id);
    return { reacted: false };
  }
  const { error } = await db.from("article_reactions").insert({ article_id: articleId, profile_id: profile.id });
  if (error) return { error: "Could not register your reaction." };
  return { reacted: true };
}
