"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { SECTION_DEFS, renderIssue, type IssueContent } from "@/lib/newsletter";
import { sendMail } from "@/lib/email";
import type { Json } from "@/lib/supabase/database.types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://datafrontier.vercel.app";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function requireEditor() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) throw new Error("Editors only.");
  return profile;
}

function contentFromForm(fd: FormData): IssueContent {
  const content: IssueContent = {};
  const intro = String(fd.get("intro") ?? "").trim();
  if (intro) content.intro = intro;
  for (const def of SECTION_DEFS) {
    const text = String(fd.get(`${def.key}_text`) ?? "").trim();
    const url = String(fd.get(`${def.key}_url`) ?? "").trim();
    const image = String(fd.get(`${def.key}_image`) ?? "").trim();
    if (text || url || image) {
      content[def.key] = {
        ...(text ? { text } : {}),
        ...(url ? { url } : {}),
        ...(image ? { image_url: image } : {}),
      };
    }
  }
  return content;
}

export async function saveIssue(fd: FormData): Promise<{ error: string } | never> {
  await requireEditor();
  const db = await createClient();

  const id = (fd.get("id") as string) || null;
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return { error: "Give the issue a title." };

  const fields = {
    title,
    summary: String(fd.get("summary") ?? "").trim() || null,
    content: contentFromForm(fd) as unknown as Json,
  };

  let issueId = id;
  if (id) {
    const { error } = await db.from("newsletter_issues").update(fields).eq("id", id);
    if (error) return { error: error.message };
  } else {
    // issue_number is the next available integer.
    const { data: last } = await db
      .from("newsletter_issues")
      .select("issue_number")
      .order("issue_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextNum = (last?.issue_number ?? 0) + 1;
    const { data, error } = await db
      .from("newsletter_issues")
      .insert({ ...fields, issue_number: nextNum, slug: `issue-${nextNum}-${slugify(title)}`, status: "draft" })
      .select("id")
      .single();
    if (error) return { error: error.message };
    issueId = data.id;
  }

  revalidatePath("/admin/newsletter");
  redirect(`/admin/newsletter/${issueId}?saved=1`);
}

/**
 * Send a single test copy of an issue to one explicit address (the composer's
 * own inbox) — never the subscriber list, never the ledger. This is how you
 * judge the template in a real client before any real send. Falls back to the
 * mock path (no delivery) when RESEND_API_KEY is absent.
 */
export async function sendTestIssue(
  id: string,
  email: string,
): Promise<{ error: string } | { ok: true; skipped: boolean; to: string }> {
  await requireEditor();
  const to = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { error: "Enter a valid email address." };

  const db = await createClient();
  const { data: issue } = await db
    .from("newsletter_issues")
    .select("id, slug, title, summary, content")
    .eq("id", id)
    .maybeSingle();
  if (!issue) return { error: "Issue not found." };

  const content = (issue.content ?? {}) as IssueContent;
  // A harmless placeholder unsubscribe token — no subscriber matches it, so the
  // one-click endpoint is a safe no-op if clicked from the test.
  const unsubscribeUrl = `${SITE}/api/newsletter/unsubscribe?token=test`;
  const webUrl = `${SITE}/newsletter/${issue.slug ?? issue.id}`;
  const { html, text } = renderIssue(issue.title, issue.summary, content, unsubscribeUrl, webUrl);

  try {
    const res = await sendMail({
      to,
      subject: `[TEST] ${issue.title}`,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return { ok: true, skipped: res.skipped, to };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Test send failed." };
  }
}

/** Schedule (or reschedule) a draft for a future time. */
export async function scheduleIssue(id: string, whenIso: string): Promise<{ error: string } | { ok: true }> {
  await requireEditor();
  if (!whenIso) return { error: "Pick a date and time." };
  const when = new Date(whenIso);
  if (Number.isNaN(when.getTime())) return { error: "Invalid date." };

  const db = await createClient();
  // Only a draft or an already-scheduled issue can be (re)scheduled — never one
  // that is sending or sent.
  const { data, error } = await db
    .from("newsletter_issues")
    .update({ status: "scheduled", scheduled_for: when.toISOString() })
    .eq("id", id)
    .in("status", ["draft", "scheduled"])
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "This issue can no longer be scheduled." };

  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true };
}

/** Pull a scheduled issue back to draft. */
export async function unscheduleIssue(id: string): Promise<{ error: string } | { ok: true }> {
  await requireEditor();
  const db = await createClient();
  const { data, error } = await db
    .from("newsletter_issues")
    .update({ status: "draft", scheduled_for: null })
    .eq("id", id)
    .eq("status", "scheduled")
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Only a scheduled issue can be unscheduled." };

  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true };
}
