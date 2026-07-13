import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const priv = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:hello@everydaydatascience.com";

/** Configured only when VAPID keys are present; otherwise push is a no-op. */
export const pushConfigured = !!(pub && priv);
if (pushConfigured) webpush.setVapidDetails(subject, pub!, priv!);

type Payload = { title: string; body: string; url: string };

/**
 * Send a push to every stored subscription. Expired endpoints (404/410) are
 * pruned. Best-effort — the caller wraps this so a push failure can never break
 * whatever triggered it (e.g. publishing an article).
 */
export async function sendPushToAll(payload: Payload): Promise<{ sent: number; skipped?: boolean }> {
  if (!pushConfigured) return { sent: 0, skipped: true };

  const db = createAdminClient();
  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (!subs || subs.length === 0) return { sent: 0 };

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
      }
    }),
  );
  if (dead.length) await db.from("push_subscriptions").delete().in("id", dead);
  return { sent };
}
