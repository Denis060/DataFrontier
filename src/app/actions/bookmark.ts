"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

/** Toggle a saved-article bookmark. Private to the signed-in reader. */
export async function toggleBookmark(
  articleId: string,
): Promise<{ saved: boolean } | { error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sign in to save articles." };

  const db = await createClient();
  const { data: existing } = await db
    .from("bookmarks")
    .select("article_id")
    .eq("article_id", articleId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    await db.from("bookmarks").delete().eq("article_id", articleId).eq("profile_id", profile.id);
    return { saved: false };
  }
  const { error } = await db.from("bookmarks").insert({ article_id: articleId, profile_id: profile.id });
  if (error) return { error: "Could not save this article." };
  return { saved: true };
}
