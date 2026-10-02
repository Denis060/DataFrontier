import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createClient>>;

/**
 * How many people each issue actually went to, counted from the send ledger.
 * newsletter_issues.recipients was under-counted on some issues (it counted
 * only rows still marked "sent" after the webhook had already moved some to
 * "delivered"), so the ledger is the source of truth. Staff can read it (RLS).
 */
export async function sentCounts(db: Db, issueIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!issueIds.length) return out;
  const { data } = await db
    .from("newsletter_sends")
    .select("issue_id")
    .in("issue_id", issueIds)
    .in("status", ["sent", "delivered", "bounced", "complained"]);
  for (const r of data ?? []) out.set(r.issue_id, (out.get(r.issue_id) ?? 0) + 1);
  return out;
}
