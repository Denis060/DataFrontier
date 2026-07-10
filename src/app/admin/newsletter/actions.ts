"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { emailConfigured, emailShell, links, sendBatch } from "@/lib/email";

type Result = { error: string } | { ok: true; sent: number };

/**
 * Sends an issue to every confirmed subscriber and stamps sent_at + recipients.
 * Requires a Resend key — we won't mark an issue "sent" if nothing was mailed.
 */
export async function sendIssue(issueId: string): Promise<Result> {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin"])) return { error: "Only an admin can send issues." };
  if (!emailConfigured) {
    return { error: "Add RESEND_API_KEY to .env.local before sending." };
  }

  const db = createAdminClient();

  const { data: issue } = await db
    .from("newsletter_issues")
    .select("id, title, summary, sent_at")
    .eq("id", issueId)
    .maybeSingle();
  if (!issue) return { error: "Issue not found." };
  if (issue.sent_at) return { error: "This issue was already sent." };

  const { data: subs } = await db
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .eq("status", "confirmed");

  const recipients = subs ?? [];
  if (recipients.length === 0) return { error: "No confirmed subscribers yet." };

  const emails = recipients.map((s) => ({
    to: s.email,
    subject: issue.title,
    html: emailShell(
      `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">${issue.title}</h1>
       <p>${issue.summary ?? ""}</p>`,
      links.unsubscribe(s.unsubscribe_token),
    ),
  }));

  const { sent } = await sendBatch(emails);

  await db
    .from("newsletter_issues")
    .update({ sent_at: new Date().toISOString(), recipients: sent })
    .eq("id", issueId);

  revalidatePath("/admin/newsletter");
  revalidatePath("/newsletter/archive");
  return { ok: true, sent };
}
