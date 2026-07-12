"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";

async function requireModerator() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) {
    throw new Error("Only editors and admins can moderate comments.");
  }
  return profile;
}

export async function approveComment(id: string): Promise<void> {
  await requireModerator();
  const db = await createClient();
  await db.from("comments").update({ is_approved: true }).eq("id", id);
  revalidatePath("/admin/comments");
}

export async function hideComment(id: string): Promise<void> {
  await requireModerator();
  const db = await createClient();
  await db.from("comments").update({ is_approved: false }).eq("id", id);
  revalidatePath("/admin/comments");
}

export async function removeComment(id: string): Promise<void> {
  await requireModerator();
  const db = await createClient();
  await db.from("comments").delete().eq("id", id);
  revalidatePath("/admin/comments");
}

/** Reply to a comment straight from the moderation queue. Posts live (staff). */
export async function replyToComment(
  articleId: string,
  parentId: string,
  slug: string,
  body: string,
): Promise<{ error: string } | { ok: true }> {
  const me = await requireModerator();
  const text = body.trim();
  if (text.length < 2) return { error: "Write a reply." };
  if (text.length > 2000) return { error: "Replies are limited to 2000 characters." };

  const db = await createClient();
  const { error } = await db.from("comments").insert({
    article_id: articleId,
    profile_id: me.id,
    parent_id: parentId,
    body: text,
    is_approved: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/comments");
  revalidatePath(`/article/${slug}`);
  return { ok: true };
}
