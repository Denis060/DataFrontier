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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Create or update a learning path. */
export async function saveSeries(fd: FormData): Promise<{ error: string } | { ok: true }> {
  await requireEditor();
  const title = str(fd, "title");
  if (!title) return { error: "Give the path a title." };

  const fields = {
    title,
    description: str(fd, "description") || null,
    sort_order: Number(str(fd, "sort_order")) || 0,
  };

  const db = await createClient();
  const id = str(fd, "id");
  const { error } = id
    ? await db.from("series").update(fields).eq("id", id)
    : await db.from("series").insert({ ...fields, slug: slugify(title) });
  if (error) return { error: error.message };

  revalidatePath("/admin/series");
  revalidatePath("/series");
  return { ok: true };
}

export async function deleteSeries(id: string): Promise<void> {
  await requireEditor();
  const db = await createClient();
  // Articles keep existing; their series_id is set null by the FK.
  await db.from("series").delete().eq("id", id);
  revalidatePath("/admin/series");
  revalidatePath("/series");
}
