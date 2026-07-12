"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";

async function requireEditor() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) throw new Error("Editors only.");
  return profile;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Create or update a homepage "Tools & Resources" item. */
export async function saveResource(fd: FormData): Promise<{ error: string } | { ok: true }> {
  await requireEditor();

  const title = str(fd, "title");
  const url = str(fd, "url");
  if (!title) return { error: "Give it a title." };
  if (!url) return { error: "Add a link." };

  const fields = {
    title,
    emoji: str(fd, "emoji") || null,
    description: str(fd, "description") || null,
    url,
    cta_label: str(fd, "cta_label") || "Learn more",
    sort_order: Number(str(fd, "sort_order")) || 0,
    is_active: fd.get("is_active") === "on",
  };

  const db = await createClient();
  const id = str(fd, "id");
  const { error } = id
    ? await db.from("resources").update(fields).eq("id", id)
    : await db.from("resources").insert(fields);
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteResource(id: string): Promise<void> {
  await requireEditor();
  const db = await createClient();
  await db.from("resources").delete().eq("id", id);
  revalidatePath("/admin/resources");
  revalidatePath("/");
}
