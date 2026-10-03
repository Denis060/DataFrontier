import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Whether an admin has marked this writer as trusted: they publish their own
 * cheat sheets without review. Read on its own (not in getCurrentProfile) so
 * a missing column before migration 20261008120000 just means "not trusted".
 */
export async function isTrusted(profileId: string): Promise<boolean> {
  const db = await createClient();
  const { data, error } = await db.from("profiles").select("trusted").eq("id", profileId).maybeSingle();
  return !error && !!data?.trusted;
}
