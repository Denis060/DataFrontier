"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import type { Database } from "@/lib/supabase/database.types";

type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];
type ArticleStatus = Database["public"]["Enums"]["article_status"];

/** URL-safe slug from a title. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** ~200 wpm, floored at 1. Body is MDX, so strip fences and syntax first. */
function readingTime(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-|]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

type Result = { error: string } | never;

const TRANSITIONS = new Set<string>(["in_review", "changes_requested", "published", "archived"]);

/**
 * Single write path for the editor. Every button — Save, Submit, Publish,
 * Request changes — routes through here and submits the WHOLE form, so the
 * body is persisted on every action. `intent` is either "save" (keep current
 * status) or a target status to transition to.
 */
export async function saveArticle(formData: FormData): Promise<Result> {
  const profile = await requireStaff();
  const db = await createClient();

  const id = (formData.get("id") as string) || null;
  const intent = (formData.get("intent") as string) || "save";

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required." };

  const body = (formData.get("body") as string) ?? "";
  const rawSlug = (formData.get("slug") as string)?.trim();
  const slug = rawSlug ? slugify(rawSlug) : slugify(title);

  // Compile the sanitized HTML once, here at save time, so the public page
  // serves a cached string instead of rendering per request.
  const bodyHtml = body ? await renderMarkdown(body) : null;

  const fields = {
    title,
    slug,
    subtitle: ((formData.get("subtitle") as string) || "").trim() || null,
    excerpt: ((formData.get("excerpt") as string) || "").trim() || null,
    kicker: ((formData.get("kicker") as string) || "").trim() || null,
    body: body || null,
    body_html: bodyHtml,
    category_id: (formData.get("category_id") as string) || null,
    format_id: (formData.get("format_id") as string) || null,
    cover_image: ((formData.get("cover_image") as string) || "").trim() || null,
    reading_time: readingTime(body),
  } satisfies ArticleUpdate;

  // Resolve the status transition, if any, and gate it.
  const patch: ArticleUpdate = { ...fields };
  const staff = hasRole(profile.role, ["admin", "editor"]);

  if (TRANSITIONS.has(intent)) {
    const to = intent as ArticleStatus;
    const authorMoves: ArticleStatus[] = ["in_review"];
    if (!staff && !authorMoves.includes(to)) {
      return { error: "Only an editor or admin can publish. Submit for review instead." };
    }
    patch.status = to;

    if (to === "published" && id) {
      const { data: cur } = await db.from("articles").select("published_at").eq("id", id).single();
      if (!cur?.published_at) patch.published_at = new Date().toISOString();
    }
  }

  let articleId = id;

  if (id) {
    const { error } = await db.from("articles").update(patch).eq("id", id);
    if (error) return { error: humanize(error.message) };
  } else {
    // A brand-new article can't publish in the same action (no id yet to stamp
    // published_at against, and it hasn't been reviewed). It starts as a draft
    // unless the writer explicitly submitted it for review.
    const status: ArticleStatus = intent === "in_review" ? "in_review" : "draft";
    const { data, error } = await db
      .from("articles")
      .insert({ ...fields, author_id: profile.id, status })
      .select("id")
      .single();
    if (error) return { error: humanize(error.message) };
    articleId = data.id;
  }

  revalidatePath("/admin/articles");
  revalidatePath(`/article/${slug}`);
  revalidatePath("/");
  redirect(`/admin/articles/${articleId}?saved=1`);
}

export async function deleteArticle(id: string): Promise<Result> {
  await requireStaff();
  const db = await createClient();
  const { error } = await db.from("articles").delete().eq("id", id);
  if (error) return { error: humanize(error.message) };
  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

/** Turn Postgres errors into something a writer can act on. */
function humanize(message: string): string {
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "That slug is already taken. Choose a different one.";
  }
  if (message.includes("42501") || message.toLowerCase().includes("publish or archive")) {
    return "You don't have permission to publish. Submit for review instead.";
  }
  return message;
}
