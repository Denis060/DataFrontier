import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** One-click unsubscribe. Idempotent — an already-unsubscribed token still lands ok. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const origin = new URL(request.url).origin;
  if (!token) return NextResponse.redirect(new URL("/newsletter", origin));

  const db = createAdminClient();
  await db
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed" })
    .eq("unsubscribe_token", token);

  return NextResponse.redirect(new URL("/newsletter/unsubscribed", origin));
}
