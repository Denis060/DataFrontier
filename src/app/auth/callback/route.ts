import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

/** Where OAuth providers and email-confirmation links land. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  // Every way back to /login keeps `next`, so signing in still lands where
  // the visitor was headed (e.g. their saved pitch on /write).
  const toLogin = (params: string) =>
    NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&${params}`, url.origin));

  // Supabase reports provider-side failures as query params, not exceptions.
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (oauthError) return toLogin(`error=${encodeURIComponent(oauthError)}`);

  if (!code) return toLogin("error=Missing+authorization+code");

  const db = await createClient();
  const { error } = await db.auth.exchangeCodeForSession(code);
  if (error) {
    // A confirmation link opened in a different browser or device than the
    // sign-up: Supabase has already confirmed the email (it does that before
    // redirecting here), but this browser lacks the PKCE code verifier, so
    // the session can't be created. That's a "now sign in", not a failure.
    if (/code verifier/i.test(error.message)) return toLogin("confirmed=1");
    return toLogin(`error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
