"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function saveCheatSheet(formData: FormData): Promise<{ error: string } | never> {
  const profile = await requireStaff();
  const db = await createClient();

  const id = (formData.get("id") as string) || null;
  const title = (formData.get("title") as string)?.trim();
  const imageUrl = (formData.get("image_url") as string)?.trim();
  if (!title) return { error: "Title is required." };
  if (!imageUrl) return { error: "Upload the cheat-sheet image first." };

  const rawSlug = (formData.get("slug") as string)?.trim();
  const fields = {
    title,
    slug: rawSlug ? slugify(rawSlug) : slugify(title),
    description: ((formData.get("description") as string) || "").trim() || null,
    image_url: imageUrl,
    download_url: ((formData.get("download_url") as string) || "").trim() || null,
    category_id: (formData.get("category_id") as string) || null,
    published: formData.get("published") === "on",
  };

  if (id) {
    const { error } = await db.from("cheat_sheets").update(fields).eq("id", id);
    if (error) return { error: humanize(error.message) };
  } else {
    const { error } = await db
      .from("cheat_sheets")
      .insert({ ...fields, author_id: profile.id });
    if (error) return { error: humanize(error.message) };
  }

  revalidatePath("/admin/cheat-sheets");
  revalidatePath("/cheat-sheets");
  redirect("/admin/cheat-sheets");
}

export async function deleteCheatSheet(id: string): Promise<{ error: string } | never> {
  await requireStaff();
  const db = await createClient();
  const { error } = await db.from("cheat_sheets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/cheat-sheets");
  revalidatePath("/cheat-sheets");
  redirect("/admin/cheat-sheets");
}

function humanize(message: string): string {
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "That slug is already taken. Choose a different one.";
  }
  return message;
}
