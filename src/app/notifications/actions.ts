"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

/** Mark all of the current user's notifications read. */
export async function markAllRead(): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const db = await createClient();
  await db
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);
  revalidatePath("/notifications");
}
