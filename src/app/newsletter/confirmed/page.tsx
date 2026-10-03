import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { ReaderSurvey } from "@/components/reader-survey";
import { createAdminClient } from "@/lib/supabase/server";
import { offerDownloadPath } from "@/lib/free-offers";

export const metadata: Metadata = { title: "Subscription confirmed", robots: { index: false } };

/**
 * Where the confirmation link lands. With the subscriber's token (?t=) it can
 * hand over a free offer's download and ask the optional survey; without it,
 * it's a plain "you're in".
 */
export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;

  let offer: { slug: string; title: string } | null = null;
  let surveyed = true;
  if (t) {
    const db = createAdminClient();
    const { data: sub } = await db
      .from("newsletter_subscribers")
      .select("magnet_id, survey_at")
      .eq("confirm_token", t)
      .eq("status", "confirmed")
      .maybeSingle();
    if (sub) {
      surveyed = !!sub.survey_at;
      if (sub.magnet_id) {
        offer = (await db.from("lead_magnets").select("slug, title").eq("id", sub.magnet_id).maybeSingle()).data;
      }
    }
  }

  return (
    <Shell>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[600px] flex-col items-center justify-center px-5 py-12 text-center">
        <p className="mb-3 text-4xl">✅</p>
        <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">
          {offer ? `Here's your ${offer.title}` : "You're in"}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {offer
            ? "You're confirmed. Download it below; we've also emailed you the link so you can find it again."
            : "Your subscription is confirmed. The next dispatch lands in your inbox on Tuesday."}
        </p>

        {offer && t ? (
          <a
            href={offerDownloadPath(offer.slug, t)}
            className="mt-6 inline-flex items-center gap-2 rounded bg-gold px-6 py-3.5 text-[15px] font-bold text-on-accent hover:opacity-85"
          >
            <Download className="size-4" aria-hidden />
            Download {offer.title} (PDF)
          </a>
        ) : (
          <div className="mt-6 flex gap-3">
            <Link href="/" className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85">
              Back to the site
            </Link>
            <Link href="/newsletter/archive" className="rounded border border-border px-5 py-2.5 text-[13px] font-medium hover:border-border-strong">
              Read past issues
            </Link>
          </div>
        )}

        {t && !surveyed && (
          <div className="mt-10 w-full">
            <ReaderSurvey token={t} />
          </div>
        )}

        {offer && (
          <Link href="/" className="mt-8 text-[13px] text-gold hover:underline">
            Explore the site →
          </Link>
        )}
      </div>
    </Shell>
  );
}
