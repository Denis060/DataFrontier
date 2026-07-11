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
