import type { Metadata } from "next";
import { Shell } from "@/components/layout/shell";
import { NewsletterBand } from "@/components/home/newsletter-band";
import { getHomeData } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Subscribe",
  description: "Join the free weekly newsletter for AI and data science practitioners.",
};

export default async function NewsletterPage() {
  // Reuse the homepage band and its real, computed stats.
  const { settings, stats, latestIssue } = await getHomeData();

  return (
    <Shell>
      <NewsletterBand
        headline={settings?.newsletter_headline ?? "Stay Ahead of Everyday Data Science"}
        subtext={settings?.newsletter_subtext ?? ""}
        stats={stats}
        showStats={settings?.newsletter_show_stats ?? true}
        source="newsletter-page"
        latestIssue={latestIssue}
        asPageHeading
      />
    </Shell>
  );
}
