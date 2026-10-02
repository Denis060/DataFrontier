"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applicationDeclinedEmail, authorApprovedEmail } from "@/lib/email";
import { notify, personFor } from "@/lib/notify";
import { requireStaff, ensureProfileSlug } from "@/lib/admin";
import { hasRole } from "@/lib/auth";

/**
 * Approve → promote the applicant to author (admin only, since only admins may
 * change roles per the profiles trigger). Reject → record a note. Both stamp
 * the reviewer.
 */
export async function decideApplication(
  id: string,
  decision: "approved" | "rejected",
  note: string,
): Promise<{ error: string } | { ok: true }> {
  const reviewer = await requireStaff();
  const db = await createClient();

  const { data: app, error: readErr } = await db
    .from("author_applications")
    .select("profile_id, status")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !app) return { error: "Application not found." };
  if (app.status !== "pending") return { error: "Already decided." };

  if (decision === "approved") {
    // Promotion is admin-only (enforced by the profiles role trigger).
    if (!hasRole(reviewer.role, ["admin"])) {
      return { error: "Only an admin can approve, it grants author access." };
    }
    const { error: roleErr } = await db
      .from("profiles")
      .update({ role: "author" })
      .eq("id", app.profile_id);
    if (roleErr) return { error: roleErr.message };

    // A public author needs a byline slug, or /author/[slug] 404s.
    await ensureProfileSlug(db, app.profile_id);
  }

  const { error } = await db
    .from("author_applications")
    .update({
      status: decision,
      reviewer_id: reviewer.id,
      review_note: note.trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Tell the applicant either way. Their address lives in auth.users, which
  // only the service role reads (personFor). A failed send never undoes the
  // decision.
  const person = await personFor(app.profile_id);
  if (decision === "approved") {
    await notify(person.email, "You're approved to write for Everyday Data Science", authorApprovedEmail(person.name));
  } else {
    await notify(person.email, "About your pitch to Everyday Data Science", applicationDeclinedEmail({ name: person.name, note: note.trim() || null }));
  }

  revalidatePath("/admin/applications");
  return { ok: true };
}
