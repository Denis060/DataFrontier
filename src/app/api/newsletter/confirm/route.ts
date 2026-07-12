import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, welcomeEmail, links } from "@/lib/email";

/** Double opt-in landing. The token is the authorisation; anon can't do this. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const origin = new URL(request.url).origin;
  if (!token) return NextResponse.redirect(new URL("/newsletter", origin));

  const db = createAdminClient();

  // Only match a *pending* row, so the transition happens exactly once — that's
  // what gates the (single) welcome email even if the link is clicked twice.
  const { data } = await db
    .from("newsletter_subscribers")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .eq("status", "pending")
    .select("email, unsubscribe_token")
    .maybeSingle();

  if (data) {
    // Fire-and-forget: a welcome-send failure must not fail the confirmation.
    try {
      await sendEmail({
        to: data.email,
        subject: "Welcome to The Everyday Brief 👋",
        html: welcomeEmail(links.unsubscribe(data.unsubscribe_token)),
      });
    } catch {
      /* ignore */
    }
    return NextResponse.redirect(new URL("/newsletter/confirmed", origin));
  }

  // No pending row: either already confirmed (fine — send them to the same
  // place) or a bad/unsubscribed token.
  const { data: already } = await db
    .from("newsletter_subscribers")
    .select("id")
    .eq("confirm_token", token)
    .eq("status", "confirmed")
    .maybeSingle();

  return NextResponse.redirect(
    new URL(already ? "/newsletter/confirmed" : "/newsletter?error=invalid-link", origin),
  );
}
