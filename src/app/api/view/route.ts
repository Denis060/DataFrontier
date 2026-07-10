import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Counted from the client rather than during render: a Server Component runs
 * on prefetch, on retry, and twice in development, none of which are reads.
 */
export async function POST(request: Request) {
  const { slug } = await request.json().catch(() => ({ slug: null }));
  if (typeof slug !== "string" || !slug) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = await createClient();
  // increment_view is `security definer`, so anon can count a read without
  // holding update rights on articles.
  const { error } = await db.rpc("increment_view", { article_slug: slug });

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
