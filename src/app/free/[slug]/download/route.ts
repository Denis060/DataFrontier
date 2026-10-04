import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { offerFiles } from "@/lib/free-offers";

// Built per request from the offer's current files, so edits in admin show up
// in the next download.
export const dynamic = "force-dynamic";

/**
 * A free offer's download, as one PDF. The confirm token from the subscriber's
 * email is the key: only confirmed subscribers get the file. Image files
 * become one page each (sized to the image); PDF files are copied in whole.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const landing = new URL(`/free/${slug}`, url.origin);
  // Signed-in readers download straight away, as for cheat sheets.
  const signedIn = !!(await getCurrentProfile());
  if (!token && !signedIn) return NextResponse.redirect(landing);

  const db = createAdminClient();
  const [{ data: sub }, { data: offer }] = await Promise.all([
    token
      ? db.from("newsletter_subscribers").select("id").eq("confirm_token", token).eq("status", "confirmed").maybeSingle()
      : Promise.resolve({ data: null }),
    // Not filtered by is_active: links already emailed keep working.
    db.from("lead_magnets").select("slug, title, files").eq("slug", slug).maybeSingle(),
  ]);
  if (!offer) return NextResponse.redirect(new URL("/", url.origin));
  if (!sub && !signedIn) return NextResponse.redirect(landing);

  const pdf = await PDFDocument.create();
  pdf.setTitle(offer.title);
  pdf.setAuthor("Everyday Data Science");
  pdf.setCreator("everydaydatascience.com");

  for (const fileUrl of offerFiles(offer)) {
    if (!fileUrl.startsWith("https://")) continue;
    const res = await fetch(fileUrl, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) continue;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const type = res.headers.get("content-type") ?? "";
    try {
      if (type.includes("pdf") || /\.pdf(\?|$)/i.test(fileUrl)) {
        const src = await PDFDocument.load(bytes);
        for (const page of await pdf.copyPages(src, src.getPageIndices())) pdf.addPage(page);
      } else {
        const img = type.includes("png") || /\.png(\?|$)/i.test(fileUrl) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        // Fit to an A4-ish width so huge images print sensibly.
        const scale = Math.min(1, 842 / img.width);
        const page = pdf.addPage([img.width * scale, img.height * scale]);
        page.drawImage(img, { x: 0, y: 0, width: img.width * scale, height: img.height * scale });
      }
    } catch {
      // An unreadable file is skipped rather than failing the whole pack.
    }
  }

  if (pdf.getPageCount() === 0) {
    return new NextResponse("This download isn't available right now. Reply to our email and we'll send it.", { status: 503 });
  }

  const body = await pdf.save();
  return new NextResponse(Buffer.from(body), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${offer.slug}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
