"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { Json } from "@/lib/supabase/database.types";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Update your own profile. RLS ("users update own profile") scopes this to the
 *  signed-in user; role and slug are intentionally not editable here. */
export async function saveProfile(fd: FormData): Promise<{ error: string } | { ok: true }> {
  const me = await getCurrentProfile();
  if (!me) return { error: "Please sign in first." };

  const full_name = str(fd, "full_name");
  if (full_name.length < 2) return { error: "Add your name." };

  // socials is a jsonb map of platform → url; keep only the ones filled in.
  const socials: Record<string, string> = {};
  for (const key of ["linkedin", "twitter", "github", "website"]) {
    const v = str(fd, key);
    if (v) socials[key] = v;
  }

  const db = await createClient();
  const { error } = await db
    .from("profiles")
    .update({
      full_name,
      title: str(fd, "title") || null,
      bio: str(fd, "bio") || null,
      avatar_url: str(fd, "avatar_url") || null,
      socials: socials as unknown as Json,
    })
    .eq("id", me.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  if (me.slug) revalidatePath(`/author/${me.slug}`);
  return { ok: true };
}
