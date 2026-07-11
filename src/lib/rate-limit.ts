import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Fixed-window rate limit for a public action, keyed by IP. Returns true when
 * the caller may proceed, false when throttled. Fails OPEN (allows) if the
 * limiter itself errors — availability over strictness for a content site.
 */
export async function rateLimit(
  action: string,
  { limit = 5, windowSeconds = 60 }: { limit?: number; windowSeconds?: number } = {},
): Promise<boolean> {
  try {
    const ip = await clientIp();
    const db = createAdminClient();
    const { data, error } = await db.rpc("check_rate_limit", {
      p_key: `${action}:${ip}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

/**
 * A honeypot is a hidden field real users never fill but bots do. If the named
 * field has any value, treat the submission as spam. Pair with <input> that is
 * visually hidden and aria-hidden, not `type=hidden` (bots skip those).
 */
export function isBot(formData: FormData, field = "company_website"): boolean {
  return String(formData.get(field) ?? "").trim().length > 0;
}
