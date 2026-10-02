import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/**
 * Best-effort email helpers for newsroom events. Every caller has already
 * saved its change; a failed send must never undo that, so these swallow
 * errors (and lib/email no-ops without a Resend key in local dev).
 */

/** The newsroom inbox: site_settings.contact_email. */
export async function newsroomInbox(): Promise<string | null> {
  const { data } = await createAdminClient().from("site_settings").select("contact_email").eq("id", true).maybeSingle();
  return data?.contact_email ?? null;
}

/** A user's sign-in email and display name (auth.users is service-role only). */
export async function personFor(profileId: string): Promise<{ email: string | null; name: string }> {
  const admin = createAdminClient();
  const [{ data: user }, { data: prof }] = await Promise.all([
    admin.auth.admin.getUserById(profileId),
    admin.from("profiles").select("full_name").eq("id", profileId).maybeSingle(),
  ]);
  return { email: user?.user?.email ?? null, name: prof?.full_name ?? "" };
}

export async function notify(to: string | null, subject: string, html: string) {
  if (!to) return;
  try {
    await sendEmail({ to, subject, html });
  } catch {
    /* best-effort */
  }
}
