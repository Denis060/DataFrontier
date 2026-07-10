import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Role = Database["public"]["Enums"]["user_role"];

export type OAuthProvider = "google" | "github";
const SUPPORTED: OAuthProvider[] = ["google", "github"];

/**
 * Ask Supabase which providers are actually configured, so the sign-in page
 * never offers a button that errors. Cached for an hour — this changes when
 * someone edits the dashboard, not per request.
 */
export async function getEnabledProviders(): Promise<OAuthProvider[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { external?: Record<string, boolean> };
    return SUPPORTED.filter((p) => json.external?.[p]);
  } catch {
    return [];
  }
}

/** The signed-in user's profile, or null. */
export async function getCurrentProfile() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

  const { data } = await db
    .from("profiles")
    .select("id, full_name, slug, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return data ? { ...data, email: user.email ?? null } : null;
}

export function hasRole(role: Role | undefined, allowed: Role[]) {
  return !!role && allowed.includes(role);
}

export { safeNext } from "@/lib/url";
