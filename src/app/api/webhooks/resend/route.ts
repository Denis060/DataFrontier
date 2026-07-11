import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/server";

// Never cache; always run fresh on the server.
export const dynamic = "force-dynamic";

/**
 * Resend delivery webhook → per-issue stats + auto-suppression.
 *
 * Security: Resend signs every webhook with Svix. We verify the signature
 * against RESEND_WEBHOOK_SECRET before trusting a single byte — otherwise anyone
 * could POST fake bounces to suppress arbitrary subscribers or inflate stats.
 *
 * Idempotency: Resend delivers at-least-once. record_email_event() dedupes on
 * the Svix message id, so a redelivered event never double-counts.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without a secret we cannot verify, so we refuse rather than
    // trust an unsigned payload.
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ResendEvent;
  try {
    event = new Webhook(secret).verify(payload, headers) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const resendId = event.data?.email_id;
  if (!resendId) {
    // Nothing to correlate — acknowledge so Resend stops retrying.
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Only a permanent bounce suppresses; a transient (soft) bounce is counted but
  // the subscriber is kept.
  const hard = event.type === "email.bounced" && event.data?.bounce?.type === "Permanent";

  const db = createAdminClient();
  const { error } = await db.rpc("record_email_event", {
    p_event_id: headers["svix-id"],
    p_resend_id: resendId,
    p_type: event.type,
    p_hard: hard,
  });
  if (error) {
    // 500 → Resend retries; our idempotency makes that safe.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

type ResendEvent = {
  type: string;
  data?: {
    email_id?: string;
    bounce?: { type?: string; subType?: string; message?: string };
  };
};
