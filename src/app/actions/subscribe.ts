"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { confirmEmail, links, offerEmail, sendEmail } from "@/lib/email";
import { offerDownloadPath, offerSource } from "@/lib/free-offers";
import { rateLimit, isBot } from "@/lib/rate-limit";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

type Db = ReturnType<typeof createAdminClient>;

/** An active free offer by slug, if the form came from one. */
async function findOffer(db: Db, slug: string) {
  if (!slug) return null;
  const { data } = await db.from("lead_magnets").select("id, slug, title").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data;
}

// `email` is echoed back on success so the form can say where the link went.
export type SubscribeState = { ok: boolean; message: string; email?: string } | null;

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Bots that fill the honeypot get a success-looking response and nothing else.
  if (isBot(formData)) return { ok: true, message: "Check your inbox to confirm." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const offerSlug = String(formData.get("offer") ?? "").trim();
  let source = String(formData.get("source") ?? "homepage");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (!(await rateLimit("subscribe", { limit: 5, windowSeconds: 300 }))) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  // Trusted server action: bypass RLS so we can read the tokens back (anon
  // cannot select the subscriber list).
  const db = createAdminClient();
  const offer = await findOffer(db, offerSlug);
  if (offer) source = offerSource(offer.slug);
  const { data, error } = await db
    .from("newsletter_subscribers")
    .insert({ email, source, magnet_id: offer?.id ?? null })
    .select("confirm_token, unsubscribe_token")
    .single();

  // 23505 = already on the list. Don't reveal that (it would leak the list);
  // the reply is the same either way. For a free offer, the inbox owner still
  // gets what they asked for: confirmed readers get it straight away, pending
  // ones get the confirmation again, worded for the offer.
  if (error?.code === "23505") {
    if (offer) {
      const { data: existing } = await db
        .from("newsletter_subscribers")
        .select("id, status, confirm_token, unsubscribe_token, magnet_id")
        .eq("email", email)
        .maybeSingle();
      try {
        if (existing?.status === "confirmed") {
          await sendEmail({
            to: email,
            subject: `Your ${offer.title}`,
            html: offerEmail({
              title: offer.title,
              downloadUrl: `${SITE}${offerDownloadPath(offer.slug, existing.confirm_token)}`,
              unsubscribeUrl: links.unsubscribe(existing.unsubscribe_token),
              isNew: false,
            }),
          });
        } else if (existing?.status === "pending") {
          if (!existing.magnet_id) await db.from("newsletter_subscribers").update({ magnet_id: offer.id }).eq("id", existing.id);
          await sendEmail({
            to: email,
            subject: `Confirm to get ${offer.title}`,
            html: confirmEmail(links.confirm(existing.confirm_token), links.unsubscribe(existing.unsubscribe_token), offer.title),
          });
        }
      } catch {
        /* same reply either way */
      }
    }
    return { ok: true, message: "Check your inbox to confirm.", email };
  }
  if (error || !data) {
    return { ok: false, message: "Something went wrong. Try again." };
  }

  // Send the double-opt-in confirmation. Without a Resend key this no-ops and
  // logs the confirm URL to the server console (see lib/email).
  try {
    await sendEmail({
      to: email,
      subject: offer ? `Confirm to get ${offer.title}` : "Confirm your subscription to Everyday Data Science",
      html: confirmEmail(links.confirm(data.confirm_token), links.unsubscribe(data.unsubscribe_token), offer?.title),
    });
  } catch {
    // Delivery failure shouldn't lose the pending subscriber; they can be
    // re-sent later. Report success either way.
  }

  return { ok: true, message: "Check your inbox to confirm.", email };
}

export type ResendState = { message: string } | null;

/**
 * "Didn't get it?" button on the success screen. Re-sends the confirmation to
 * a still-pending address. The reply is identical whether or not the address
 * is on the list, so this can't be used to probe who has subscribed.
 */
export async function resendConfirmation(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const done = { message: "Sent again. It can take a minute to arrive." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return done;

  if (!(await rateLimit("subscribe-resend", { limit: 3, windowSeconds: 900 }))) {
    return { message: "Already re-sent a few times. Please check Spam or Promotions." };
  }

  const db = createAdminClient();
  const { data } = await db
    .from("newsletter_subscribers")
    .select("confirm_token, unsubscribe_token, magnet_id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (data) {
    const offerTitle = data.magnet_id
      ? ((await db.from("lead_magnets").select("title").eq("id", data.magnet_id).maybeSingle()).data?.title ?? null)
      : null;
    try {
      await sendEmail({
        to: email,
        subject: offerTitle ? `Confirm to get ${offerTitle}` : "Confirm your subscription to Everyday Data Science",
        html: confirmEmail(links.confirm(data.confirm_token), links.unsubscribe(data.unsubscribe_token), offerTitle),
      });
    } catch {
      /* same reply either way */
    }
  }
  return done;
}
