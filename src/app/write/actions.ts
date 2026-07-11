"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { rateLimit, isBot } from "@/lib/rate-limit";

export type ApplyState = { ok: boolean; message: string } | null;

export async function applyToWrite(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  if (isBot(formData)) return { ok: true, message: "Application received. We'll be in touch." };

  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, message: "Please sign in first, then submit your application." };
  }

  if (!(await rateLimit("apply", { limit: 3, windowSeconds: 3600 }))) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }
  if (profile.role !== "reader") {
    return { ok: false, message: "You already have contributor access." };
  }

  const bio = String(formData.get("bio") ?? "").trim();
  const topics = String(formData.get("topics") ?? "").trim();
  const links = String(formData.get("writing_links") ?? "").trim() || null;

  if (bio.length < 40) return { ok: false, message: "Tell us a bit more about yourself (40+ characters)." };
  if (topics.length < 10) return { ok: false, message: "What topics do you want to cover?" };

  const db = await createClient();
  const { error } = await db
    .from("author_applications")
    .insert({ profile_id: profile.id, bio, topics, writing_links: links });

  // The partial unique index blocks a second pending application (23505).
  if (error?.code === "23505") {
    return { ok: false, message: "You already have an application under review." };
  }
  if (error) return { ok: false, message: "Something went wrong. Try again." };

  revalidatePath("/admin/applications");
  return { ok: true, message: "Application received. We'll be in touch." };
}
