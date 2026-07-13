import { NextResponse } from "next/server";
import { dispatchIssue, dueIssueIds, sendWelcomeFollowups } from "@/lib/dispatch";

// Long enough to drain a bounded batch; the dispatcher itself caps work per run.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Authenticated dispatcher. Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`. A public send trigger would be an open
 * relay on our own list (invariant 3), so an unauthenticated call is rejected.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qp = new URL(request.url).searchParams.get("secret");

  if (!secret || (auth !== `Bearer ${secret}` && qp !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = await dueIssueIds();
  const results = [];
  for (const id of ids) {
    results.push({ id, ...(await dispatchIssue(id)) });
  }

  // Same tick also sends any due welcome-series follow-ups.
  const followups = await sendWelcomeFollowups();

  return NextResponse.json({ processed: ids.length, results, followups });
}
