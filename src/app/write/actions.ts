"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { rateLimit, isBot } from "@/lib/rate-limit";
import { REPUBLISH_PREFIX } from "@/lib/applications";
import { applicationReceivedEmail, newApplicationAdminEmail, sendEmail } from "@/lib/email";

export type ApplyState = { ok: boolean; message: string } | null;

export async function applyToWrite(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  if (isBot(formData)) return { ok: true, message: "Application received. We'll be in touch." };

  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, message: "Please sign in first, then submit your application." };
  }

  if (profile.role !== "reader") {
    return { ok: false, message: "You already have contributor access." };
  }

  const bio = String(formData.get("bio") ?? "").trim();
  const topics = String(formData.get("topics") ?? "").trim();
  const otherLinks = String(formData.get("writing_links") ?? "").trim();
  const republish = formData.get("kind") === "republish";
  const original = String(formData.get("original_url") ?? "").trim();

  if (republish && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(original)) {
    return { ok: false, message: "Add the full link to the post you want to republish (https://…)." };
  }
  if (bio.length < 40) return { ok: false, message: "Tell us a bit more about yourself (40+ characters)." };
  if (topics.length < 10) return { ok: false, message: "What topics do you want to cover?" };

  // Rate-limit only real attempts, so fixing a too-short answer isn't counted.
  if (!(await rateLimit("apply", { limit: 3, windowSeconds: 3600 }))) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }

  // A republish request rides in writing_links as a "Republish: <url>" first
  // line (see parseApplicationLinks), so it needs no schema change.
  const links = [republish ? `${REPUBLISH_PREFIX}${original}` : "", otherLinks].filter(Boolean).join("\n") || null;

  const db = await createClient();
  const { error } = await db
    .from("author_applications")
    .insert({ profile_id: profile.id, bio, topics, writing_links: links });

  // The partial unique index blocks a second pending application (23505).
  if (error?.code === "23505") {
    return { ok: false, message: "You already have an application under review." };
  }
  if (error) return { ok: false, message: "Something went wrong. Try again." };

  // The pitch is sent; drop the copy saved with the account at sign-up.
  await db.auth.updateUser({ data: { pitch_draft: null } }).catch(() => null);

  // Tell both sides. Before this, a pitch landed silently: the applicant got
  // nothing and the owner only knew by checking the admin list. Sends are
  // best-effort; a failed email must not undo a saved application.
  const { data: settings } = await db.from("site_settings").select("contact_email").eq("id", true).maybeSingle();
  await Promise.allSettled([
    profile.email
      ? sendEmail({
          to: profile.email,
          subject: "We got your pitch for Everyday Data Science",
          html: applicationReceivedEmail(profile.full_name ?? "", republish),
        })
      : null,
    settings?.contact_email
      ? sendEmail({
          to: settings.contact_email,
          subject: `New writer ${republish ? "republish request" : "pitch"}: ${profile.full_name ?? "someone"}`,
          html: newApplicationAdminEmail({
            name: profile.full_name ?? "Unknown",
            email: profile.email,
            bio,
            topics,
            republish: republish ? original : null,
            links: otherLinks,
          }),
        })
      : null,
  ]);

  revalidatePath("/admin/applications");
  revalidatePath("/write");
  return { ok: true, message: "Application received. We'll be in touch." };
}
