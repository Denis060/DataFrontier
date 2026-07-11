"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

type Target = { authorId?: string; categoryId?: string };

export type FollowResult = { ok: boolean; following: boolean; error?: string };

/** Toggle following an author or a topic. Sign-in required. */
export async function toggleFollow(target: Target, path: string): Promise<FollowResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, following: false, error: "Sign in to follow." };

  const db = await createClient();
  const col = target.authorId ? "author_id" : "category_id";
  const val = target.authorId ?? target.categoryId;
  if (!val) return { ok: false, following: false, error: "Nothing to follow." };

  // You can't follow yourself.
  if (target.authorId && target.authorId === profile.id) {
    return { ok: false, following: false, error: "You can't follow yourself." };
  }

  const { data: existing } = await db
    .from("follows")
    .select("id")
    .eq("follower_id", profile.id)
    .eq(col, val)
    .maybeSingle();

  if (existing) {
    await db.from("follows").delete().eq("id", existing.id);
    revalidatePath(path);
    return { ok: true, following: false };
  }

  const { error } = await db.from("follows").insert({
    follower_id: profile.id,
    author_id: target.authorId ?? null,
    category_id: target.categoryId ?? null,
  });
  if (error) return { ok: false, following: false, error: "Could not follow. Try again." };

  revalidatePath(path);
  return { ok: true, following: true };
}
