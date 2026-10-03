import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, welcomeEmail, offerEmail, links } from "@/lib/email";
import { giftOf } from "@/lib/gifts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

/** The thank-you page; the token lets it show the download and the survey. */
const thanks = (origin: string, token: string) =>
  new URL(`/newsletter/confirmed?t=${encodeURIComponent(token)}`, origin);

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
    .select("email, unsubscribe_token, magnet_id, source")
    .maybeSingle();

  if (data) {
    // Came for a free offer: their welcome is the download. Fire-and-forget:
    // a send failure must not fail the confirmation.
    const offer = await giftOf(db, data);
    try {
      await sendEmail(
        offer
          ? {
              to: data.email,
              subject: `Here's your ${offer.title}`,
              html: offerEmail({
                title: offer.title,
                downloadUrl: `${SITE}${offer.path(token)}`,
                unsubscribeUrl: links.unsubscribe(data.unsubscribe_token),
                isNew: true,
              }),
            }
          : {
              to: data.email,
              subject: "Welcome to The Everyday Brief 👋",
              html: welcomeEmail(links.unsubscribe(data.unsubscribe_token)),
            },
      );
    } catch {
      /* ignore */
    }
    return NextResponse.redirect(thanks(origin, token));
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
    already ? thanks(origin, token) : new URL("/newsletter?error=invalid-link", origin),
  );
}
