import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMail, welcomeFollowupEmail } from "@/lib/email";
import { renderIssue, type IssueContent } from "@/lib/newsletter";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

// Bounded work per invocation so a run never risks the function timeout; the
// remaining rows stay 'pending' and the next tick (or re-run) drains them.
const BATCH_SIZE = 100;
const MAX_BATCHES_PER_RUN = 5;

type SendRow = { id: string; subscriber_id: string; email: string };

/**
 * Send one issue, resumably and exactly-once. Safe to call concurrently and to
 * re-run after a crash:
 *  - claim_issue_for_sending atomically moves scheduled → sending (row-locked).
 *  - The ledger is materialised with ON CONFLICT DO NOTHING (idempotent) from
 *    confirmed subscribers minus the suppression list.
 *  - claim_send_batch hands each row to exactly one worker (FOR UPDATE SKIP
 *    LOCKED); each send carries a per-recipient idempotency key so even a
 *    re-claimed row can't double-deliver.
 */
export async function dispatchIssue(issueId: string): Promise<{ sent: number; remaining: number; done: boolean }> {
  const db = createAdminClient();

  const claimed = await db.rpc("claim_issue_for_sending", { p_issue_id: issueId });
  if (claimed.error || claimed.data !== true) {
    return { sent: 0, remaining: 0, done: false };
  }

  const { data: issue } = await db
    .from("newsletter_issues")
    .select("id, slug, title, summary, content")
    .eq("id", issueId)
    .single();
  if (!issue) return { sent: 0, remaining: 0, done: false };

  // Materialise the ledger from eligible recipients (idempotent).
  await materializeLedger(issueId);

  const content = (issue.content ?? {}) as IssueContent;
  const webUrl = `${SITE}/newsletter/${issue.slug ?? issue.id}`;
  let sentThisRun = 0;

  for (let b = 0; b < MAX_BATCHES_PER_RUN; b++) {
    const { data: rows } = await db.rpc("claim_send_batch", {
      p_issue_id: issueId,
      p_limit: BATCH_SIZE,
    });
    const batch = (rows ?? []) as SendRow[];
    if (batch.length === 0) break;

    for (const row of batch) {
      const unsubscribeUrl = await unsubUrl(db, row.subscriber_id);
      const { html, text } = renderIssue(issue.title, issue.summary, content, unsubscribeUrl, webUrl);

      try {
        const res = await sendMail({
          to: row.email,
          subject: issue.title,
          html,
          text,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          idempotencyKey: `${issueId}:${row.subscriber_id}`,
        });
        await db
          .from("newsletter_sends")
          .update({ status: "sent", resend_id: res.id, sent_at: new Date().toISOString(), error: null })
          .eq("id", row.id);
        sentThisRun++;
      } catch (e) {
        await db
          .from("newsletter_sends")
          .update({ status: "failed", error: e instanceof Error ? e.message : "send failed" })
          .eq("id", row.id);
      }
    }
  }

  // How many recipients still need sending?
  const { count: remaining } = await db
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("issue_id", issueId)
    .in("status", ["pending", "sending"]);

  const done = (remaining ?? 0) === 0;
  if (done) {
    const { count: sent } = await db
      .from("newsletter_sends")
      .select("id", { count: "exact", head: true })
      .eq("issue_id", issueId)
      .eq("status", "sent");
    await db
      .from("newsletter_issues")
      .update({ status: "sent", sent_at: new Date().toISOString(), recipients: sent ?? 0 })
      .eq("id", issueId);
  }

  return { sent: sentThisRun, remaining: remaining ?? 0, done };
}

/** Insert one ledger row per eligible recipient. ON CONFLICT DO NOTHING makes
 *  it safe to call on every run (idempotent), and the not-in-suppressions +
 *  confirmed filter enforces "only confirmed, minus suppressed". */
async function materializeLedger(issueId: string) {
  const db = createAdminClient();

  const [{ data: subs }, { data: suppressed }] = await Promise.all([
    db.from("newsletter_subscribers").select("id, email").eq("status", "confirmed"),
    db.from("email_suppressions").select("email"),
  ]);

  const blocked = new Set((suppressed ?? []).map((s) => s.email.toLowerCase()));
  const rows = (subs ?? [])
    .filter((s) => !blocked.has(s.email.toLowerCase()))
    .map((s) => ({ issue_id: issueId, subscriber_id: s.id, email: s.email, status: "pending" }));

  if (rows.length === 0) return;
  // ON CONFLICT (issue_id, subscriber_id) DO NOTHING via upsert with ignoreDuplicates.
  await db.from("newsletter_sends").upsert(rows, {
    onConflict: "issue_id,subscriber_id",
    ignoreDuplicates: true,
  });
}

async function unsubUrl(db: ReturnType<typeof createAdminClient>, subscriberId: string): Promise<string> {
  const { data } = await db
    .from("newsletter_subscribers")
    .select("unsubscribe_token")
    .eq("id", subscriberId)
    .single();
  return `${SITE}/api/newsletter/unsubscribe?token=${data?.unsubscribe_token ?? ""}`;
}

/**
 * The one-and-only welcome-series follow-up: sent ~2 days after a subscriber
 * confirms, exactly once. Marked on the row so it never repeats, and skips the
 * suppression list. Bounded per run so the cron never risks a timeout.
 */
export async function sendWelcomeFollowups(): Promise<{ sent: number }> {
  const db = createAdminClient();
  const cutoff = new Date(Date.now() - 2 * 86_400_000).toISOString();

  const { data: due } = await db
    .from("newsletter_subscribers")
    .select("id, email, unsubscribe_token")
    .eq("status", "confirmed")
    .is("welcome_followup_sent_at", null)
    .lte("confirmed_at", cutoff)
    .limit(100);
  if (!due || due.length === 0) return { sent: 0 };

  const { data: suppressed } = await db.from("email_suppressions").select("email");
  const blocked = new Set((suppressed ?? []).map((s) => s.email.toLowerCase()));

  let sent = 0;
  for (const sub of due) {
    // Mark first so a mid-run crash can't double-send; a rare lost email beats a duplicate.
    await db.from("newsletter_subscribers").update({ welcome_followup_sent_at: new Date().toISOString() }).eq("id", sub.id);
    if (blocked.has(sub.email.toLowerCase())) continue;
    const unsubscribeUrl = `${SITE}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token ?? ""}`;
    try {
      await sendMail({
        to: sub.email,
        subject: "A quick hello from Everyday Data Science",
        html: welcomeFollowupEmail(unsubscribeUrl),
        text: "Thanks for joining The Everyday Brief. What are you building, and what do you want more of? Just reply — I read every one. — Ibrahim",
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      sent++;
    } catch {
      /* already marked; skip */
    }
  }
  return { sent };
}

/** Every scheduled issue whose time has come, plus any interrupted 'sending'. */
export async function dueIssueIds(): Promise<string[]> {
  const db = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await db
    .from("newsletter_issues")
    .select("id, status, scheduled_for")
    .or(`and(status.eq.scheduled,scheduled_for.lte.${nowIso}),status.eq.sending`);
  return (data ?? []).map((i) => i.id);
}
