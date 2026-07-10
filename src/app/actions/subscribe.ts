"use server";

import { createClient } from "@/lib/supabase/server";

export type SubscribeState = { ok: boolean; message: string } | null;

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim();
  const source = String(formData.get("source") ?? "homepage");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const db = await createClient();
  const { error } = await db.from("newsletter_subscribers").insert({ email, source });

  // 23505 = unique_violation. Already subscribed is not a failure worth
  // surfacing — and confirming which emails exist would leak the list.
  if (error && error.code !== "23505") {
    return { ok: false, message: "Something went wrong. Try again." };
  }

  return { ok: true, message: "Check your inbox to confirm." };
}
