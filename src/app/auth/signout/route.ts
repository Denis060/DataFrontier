import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST only — a GET would let any <img src> log the user out (CSRF). */
export async function POST(request: Request) {
  const db = await createClient();
  await db.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
