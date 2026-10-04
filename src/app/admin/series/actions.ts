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
    long_description: str(fd, "long_description") || null,
    sort_order: Number(str(fd, "sort_order")) || 0,
    // The path's own cover; blank falls back to its lessons' covers.
    cover_url: str(fd, "cover_url") || null,
  };

  const db = await createClient();
  const id = str(fd, "id");
  // An existing path keeps its slug (renaming it would break its URL), so read
  // it back rather than re-deriving it from a possibly-edited title.
  const { data, error } = id
    ? await db.from("series").update(fields).eq("id", id).select("slug").maybeSingle()
    : await db.from("series").insert({ ...fields, slug: slugify(title) }).select("slug").maybeSingle();
  if (error) return { error: error.message };

  revalidatePath("/admin/series");
  revalidatePath("/series");
  if (data?.slug) revalidatePath(`/series/${data.slug}`);
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

/**
 * Move a lesson one place up or down within its path by swapping it with its
 * neighbour. Positions are renumbered 1..n first, so gaps or duplicates from
 * earlier edits can never make a move do nothing.
 */
export async function moveLesson(seriesId: string, articleId: string, dir: -1 | 1): Promise<{ error: string } | { ok: true }> {
  await requireEditor();
  const db = await createClient();
  const { data } = await db
    .from("articles")
    .select("id, series_position, created_at")
    .eq("series_id", seriesId)
    .order("series_position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  const ids = (data ?? []).map((a) => a.id);
  const i = ids.indexOf(articleId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (let k = 0; k < ids.length; k++) {
    const { error } = await db.from("articles").update({ series_position: k + 1 }).eq("id", ids[k]);
    if (error) return { error: error.message };
  }
  const { data: series } = await db.from("series").select("slug").eq("id", seriesId).maybeSingle();
  revalidatePath("/admin/series");
  revalidatePath("/series");
  if (series?.slug) revalidatePath(`/series/${series.slug}`);
  return { ok: true };
}
