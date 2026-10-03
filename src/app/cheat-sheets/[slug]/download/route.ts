import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Our storage forces a download with `?download=<name>`; other links pass through. */
function fileHref(url: string, slug: string) {
  if (!url.includes("/storage/v1/object/public/")) return url;
  const ext = url.split(".").pop()?.split("?")[0] ?? "png";
  return `${url}${url.includes("?") ? "&" : "?"}download=${slug}.${ext}`;
}

/**
 * A cheat sheet's download, for subscribers. Unlocked by the confirm token in
 * the subscriber's email, or by being signed in. Anyone else is sent back to
 * the sheet, where the Download button asks for their email.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const back = new URL(`/cheat-sheets/${slug}?get=1`, url.origin);

  const db = createAdminClient();
  const { data: sheet } = await db
    .from("cheat_sheets")
    .select("slug, image_url, download_url, published")
    .eq("slug", slug)
    .maybeSingle();
  if (!sheet?.published) return NextResponse.redirect(new URL("/cheat-sheets", url.origin));

  let allowed = !!(await getCurrentProfile());
  if (!allowed && token) {
    const { data } = await db.from("newsletter_subscribers").select("id").eq("confirm_token", token).eq("status", "confirmed").maybeSingle();
    allowed = !!data;
  }
  if (!allowed) return NextResponse.redirect(back);

  return NextResponse.redirect(fileHref(sheet.download_url ?? sheet.image_url, sheet.slug));
}
