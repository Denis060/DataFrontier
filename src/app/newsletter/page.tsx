import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { NewsletterBand } from "@/components/home/newsletter-band";
import { getHomeData } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Subscribe — Everyday Data Science",
  description: "Join the free weekly newsletter for AI and data science practitioners.",
};

export default async function NewsletterPage() {
  // Reuse the homepage band and its real, computed stats.
  const { settings, stats } = await getHomeData();

  return (
    <Shell>
      <NewsletterBand
        headline={settings?.newsletter_headline ?? "Stay Ahead of Everyday Data Science"}
        subtext={settings?.newsletter_subtext ?? ""}
        stats={stats}
        showStats={settings?.newsletter_show_stats ?? true}
      />
      <div className="mx-auto w-full max-w-[760px] px-5 py-10 text-center sm:px-8">
        <Link href="/newsletter/archive" className="text-[13px] text-gold hover:underline">
          Browse past issues →
        </Link>
      </div>
    </Shell>
  );
}
