import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** Flip a token to unsubscribed. Idempotent — re-running on an already
 *  unsubscribed token is a no-op that still succeeds. Returns whether a token
 *  was present so callers can decide how to respond. */
async function unsubscribe(token: string | null): Promise<boolean> {
  if (!token) return false;
  const db = createAdminClient();
  await db
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed" })
    .eq("unsubscribe_token", token);
  return true;
}

/** Human click from the email footer link — lands on a friendly page. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ok = await unsubscribe(url.searchParams.get("token"));
  return NextResponse.redirect(new URL(ok ? "/newsletter/unsubscribed" : "/newsletter", url.origin));
}

/** RFC 8058 one-click unsubscribe. Gmail/Yahoo POST here directly (no user
 *  interaction) when they render the List-Unsubscribe header; they expect a 2xx
 *  and ignore the body. This MUST exist because every send advertises
 *  `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const ok = await unsubscribe(token);
  return new NextResponse(null, { status: ok ? 200 : 400 });
}
