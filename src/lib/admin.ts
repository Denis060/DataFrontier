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

/**
 * RLS already narrows this: an author only sees their own rows via the
 * "published articles are public" select policy (own + published), an editor
 * sees everything. So the same query returns the right set per role.
 */
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

export async function listArticles(status?: string) {
  const db = await createClient();
  let q = db.from("articles").select(LIST_SELECT).order("updated_at", { ascending: false });
  const valid = status ? asStatus(status) : null;
  if (valid) q = q.eq("status", valid);
  const { data, error } = await q;
  if (error) throw new Error(`listArticles: ${error.message}`);
  return (data ?? []) as unknown as AdminArticleRow[];
}

export async function getArticleForEdit(id: string) {
  const db = await createClient();
  const { data, error } = await db.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getArticleForEdit: ${error.message}`);
  return data;
}

export async function listFormatsAndCategories() {
  const db = await createClient();
  const [formats, categories] = await Promise.all([
    db.from("formats").select("id, name, color").order("sort_order"),
    db.from("categories").select("id, name").order("sort_order"),
  ]);
  return { formats: formats.data ?? [], categories: categories.data ?? [] };
}
