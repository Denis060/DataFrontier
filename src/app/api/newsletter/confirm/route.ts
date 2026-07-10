import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** Double opt-in landing. The token is the authorisation; anon can't do this. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const origin = new URL(request.url).origin;
  if (!token) return NextResponse.redirect(new URL("/newsletter", origin));

  const db = createAdminClient();
  const { data } = await db
    .from("newsletter_subscribers")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .neq("status", "unsubscribed") // don't silently re-confirm someone who left
    .select("id")
    .maybeSingle();

  return NextResponse.redirect(
    new URL(data ? "/newsletter/confirmed" : "/newsletter?error=invalid-link", origin),
  );
}
