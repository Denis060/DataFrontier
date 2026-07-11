"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { confirmEmail, links, sendEmail } from "@/lib/email";
import { rateLimit, isBot } from "@/lib/rate-limit";

export type SubscribeState = { ok: boolean; message: string } | null;

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Bots that fill the honeypot get a success-looking response and nothing else.
  if (isBot(formData)) return { ok: true, message: "Check your inbox to confirm." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const source = String(formData.get("source") ?? "homepage");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (!(await rateLimit("subscribe", { limit: 5, windowSeconds: 300 }))) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  // Trusted server action: bypass RLS so we can read the tokens back (anon
  // cannot select the subscriber list).
  const db = createAdminClient();
  const { data, error } = await db
    .from("newsletter_subscribers")
    .insert({ email, source })
    .select("confirm_token, unsubscribe_token")
    .single();

  // 23505 = already subscribed. Don't reveal that (it would leak the list),
  // and don't resend — just report the same success message.
  if (error?.code === "23505") {
    return { ok: true, message: "Check your inbox to confirm." };
  }
  if (error || !data) {
    return { ok: false, message: "Something went wrong. Try again." };
  }

  // Send the double-opt-in confirmation. Without a Resend key this no-ops and
  // logs the confirm URL to the server console (see lib/email).
  try {
    await sendEmail({
      to: email,
      subject: "Confirm your subscription to Everyday Data Science",
      html: confirmEmail(links.confirm(data.confirm_token), links.unsubscribe(data.unsubscribe_token)),
    });
  } catch {
    // Delivery failure shouldn't lose the pending subscriber; they can be
    // re-sent later. Report success either way.
  }

  return { ok: true, message: "Check your inbox to confirm." };
}
