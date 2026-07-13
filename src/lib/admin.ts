import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole, type Role } from "@/lib/auth";
import type { Database } from "@/lib/supabase/database.types";

const STAFF: Role[] = ["admin", "editor", "author"];

/**
 * Gate for every admin page and action. Returns the staff profile or bounces —
 * the source of truth is the DB row, never a cookie the client could forge.
 */
export async function requireStaff() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!hasRole(profile.role, STAFF)) redirect("/admin"); // the "not authorised" screen
  return profile;
}

export type AdminArticleRow = {
  id: string;
  slug: string;
  title: string;
  status: Database["public"]["Enums"]["article_status"];
  updated_at: string;
  published_at: string | null;
  author: { full_name: string; slug: string | null } | null;
  category: { name: string } | null;
};

const LIST_SELECT = `
  id, slug, title, status, updated_at, published_at,
  author:profiles!articles_author_id_fkey (full_name, slug),
  category:categories (name)
` as const;

const STATUS_VALUES = [
  "draft",
  "in_review",
  "changes_requested",
  "published",
  "archived",
] as const;

function asStatus(s: string): Database["public"]["Enums"]["article_status"] | null {
  return (STATUS_VALUES as readonly string[]).includes(s)
    ? (s as Database["public"]["Enums"]["article_status"])
    : null;
}

/**
 * The RLS select policy is "published OR own" — right for the public site, but
 * it means an author would otherwise see every *published* article here too.
 * The newsroom list must show an author only their OWN work, so we scope by
 * author_id for non-staff-wide roles. Admins/editors see everything.
 */
export async function listArticles(status: string | undefined, viewer: { id: string; role: Role }) {
  const db = await createClient();
  let q = db.from("articles").select(LIST_SELECT).order("updated_at", { ascending: false });
  if (!hasRole(viewer.role, ["admin", "editor"])) q = q.eq("author_id", viewer.id);
  const valid = status ? asStatus(status) : null;
  if (valid) q = q.eq("status", valid);
  const { data, error } = await q;
  if (error) throw new Error(`listArticles: ${error.message}`);
  return (data ?? []) as unknown as AdminArticleRow[];
}

/**
 * Load an article for the editor. Authors may only open their own; admins and
 * editors may open any. Returns null when an author reaches for someone else's
 * (the page turns that into a 404).
 */
export async function getArticleForEdit(id: string, viewer: { id: string; role: Role }) {
  const db = await createClient();
  const { data, error } = await db.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getArticleForEdit: ${error.message}`);
  if (data && !hasRole(viewer.role, ["admin", "editor"]) && data.author_id !== viewer.id) {
    return null;
  }
  return data;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Give a profile a unique public slug if it doesn't have one. Called when a
 * reader is promoted to a byline role (author/editor/admin) — without a slug
 * their /author/[slug] page 404s. No-op if a slug already exists.
 */
export async function ensureProfileSlug(
  db: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
): Promise<void> {
  const { data: p } = await db
    .from("profiles")
    .select("slug, full_name")
    .eq("id", profileId)
    .maybeSingle();
  if (!p || p.slug) return;

  const base = slugify(p.full_name || "") || "author";
  const { data: taken } = await db.from("profiles").select("slug").ilike("slug", `${base}%`);
  const used = new Set((taken ?? []).map((t) => t.slug));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;

  await db.from("profiles").update({ slug }).eq("id", profileId);
}

export async function listFormatsAndCategories() {
  const db = await createClient();
  const [formats, categories, series] = await Promise.all([
    db.from("formats").select("id, name, color").order("sort_order"),
    db.from("categories").select("id, name").order("sort_order"),
    db.from("series").select("id, title").order("sort_order"),
  ]);
  return {
    formats: formats.data ?? [],
    categories: categories.data ?? [],
    series: (series.data ?? []).map((s) => ({ id: s.id, name: s.title })),
  };
}
