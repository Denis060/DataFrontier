"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Store (or refresh) a browser's push subscription. Anonymous readers allowed. */
export async function savePushSubscription(sub: Sub): Promise<{ ok: boolean }> {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  const profile = await getCurrentProfile();
  const db = createAdminClient();
  await db.from("push_subscriptions").upsert(
    { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, profile_id: profile?.id ?? null },
    { onConflict: "endpoint" },
  );
  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!endpoint) return;
  const db = createAdminClient();
  await db.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
