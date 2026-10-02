"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { confirmEmail, links, sendEmail } from "@/lib/email";

type Result = { error: string } | { ok: true; message: string };

/**
 * Admin-only subscriber actions. The list is admin-only under RLS and has no
 * delete policy, so these use the service role after an explicit admin check.
 */
async function adminOnly(): Promise<{ error: string } | null> {
  const me = await requireStaff();
  return hasRole(me.role, ["admin"]) ? null : { error: "Only an admin can manage subscribers." };
}

export async function resendConfirmation(id: string): Promise<Result> {
  const denied = await adminOnly();
  if (denied) return denied;
  const db = createAdminClient();
  const { data: sub } = await db
    .from("newsletter_subscribers")
    .select("email, status, confirm_token, unsubscribe_token")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return { error: "Subscriber not found." };
  if (sub.status !== "pending") return { error: "Only pending subscribers need confirming." };
  try {
    await sendEmail({
      to: sub.email,
      subject: "Confirm your subscription to Everyday Data Science",
      html: confirmEmail(links.confirm(sub.confirm_token), links.unsubscribe(sub.unsubscribe_token)),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not send." };
  }
  return { ok: true, message: `Confirmation sent again to ${sub.email}.` };
}

/** Stop sending to someone (e.g. they asked by email). Keeps the record. */
export async function unsubscribe(id: string): Promise<Result> {
  const denied = await adminOnly();
  if (denied) return denied;
  const { error } = await createAdminClient()
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/newsletter/subscribers");
  return { ok: true, message: "Unsubscribed." };
}

/** Remove someone entirely (e.g. a data-deletion request). Their send history goes too. */
export async function deleteSubscriber(id: string): Promise<Result> {
  const denied = await adminOnly();
  if (denied) return denied;
  const { error } = await createAdminClient().from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/newsletter/subscribers");
  return { ok: true, message: "Deleted." };
}
