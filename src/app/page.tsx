import type { Metadata } from "next";
import { getChrome, getHomeData, getUnreadCount, menuFor } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getChrome();
  const title =
    settings?.default_meta_title ??
    "Everyday Data Science: Applied AI, Agentic Systems & AI in Africa";
  const description =
    settings?.default_meta_description ??
    "Practical AI, machine learning, and data science for people who build, with a focus on agentic systems and applied AI in Africa. Written by practitioners.";
  const ogImage = settings?.default_og_image ?? `${SITE_URL}/opengraph-image`;
  return {
    // `absolute` avoids the "%s | Everyday Data Science" template doubling the name.
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { type: "website", title, description, url: SITE_URL, images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}
import { SiteHeader } from "@/components/home/site-header";
import { Hero } from "@/components/home/hero";
import { NewsletterBand } from "@/components/home/newsletter-band";
import {
  AfricaSpotlight,
  ArticleGrid,
  CareersBand,
  CategoryStrip,
  EditorSection,
} from "@/components/home/bands";
import { SiteFooter } from "@/components/home/site-footer";

export const revalidate = 60;

export default async function Home() {
  const [d, profile] = await Promise.all([getHomeData(), getCurrentProfile()]);
  const unread = await getUnreadCount(profile?.id ?? null);
  const s = d.settings;
  const siteName = s?.site_name ?? "Everyday Data Science";

  const badges = Array.isArray(s?.editor_badges)
    ? (s.editor_badges as { label: string; color: string }[])
    : [];

  // Only real profile links (with a path) become sameAs; bare domains are placeholders.
  const sameAs = Object.values((s?.socials ?? {}) as Record<string, unknown>).filter(
    (v): v is string => typeof v === "string" && /^https?:\/\/[^/]+\/.+/.test(v),
  );
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: siteName,
    url: SITE_URL,
    logo: s?.logo_url ?? `${SITE_URL}/icon.svg`,
    ...(sameAs.length ? { sameAs } : {}),
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: siteName,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <SiteHeader
        siteName={siteName}
        established={s?.established_year ?? null}
        nav={menuFor(d.menus, "header")}
        ticker={d.ticker}
        profile={profile}
        unread={unread}
      />

      <main className="flex-1">
        {/* Site-level H1 for SEO: describes the publication, not the top story. */}
        <h1 className="sr-only">
          Everyday Data Science: applied AI, agentic systems, machine learning, and AI in Africa,
          written by practitioners for people who build.
        </h1>
        <Hero hero={d.hero} latest={d.latest} />

        <NewsletterBand
          headline={s?.newsletter_headline ?? "Stay Ahead of Everyday Data Science"}
          subtext={s?.newsletter_subtext ?? ""}
          stats={d.stats}
          showStats={s?.newsletter_show_stats ?? true}
        />

        <CategoryStrip categories={d.categories} />

        <ArticleGrid columns={d.columns} resources={d.resources} />

        {d.spotlight.length > 0 && s?.spotlight_headline && (
          <AfricaSpotlight
            headline={s.spotlight_headline}
            body={s.spotlight_body ?? ""}
            ctaUrl={s.spotlight_cta_url ?? "/category/ai-in-africa"}
            articles={d.spotlight}
          />
        )}

        <CareersBand jobs={d.jobs} total={d.jobCount} />

        <EditorSection
          editor={d.editor}
          headline={s?.editor_headline ?? ""}
          bio={s?.editor_bio ?? ""}
          badges={badges}
        />
      </main>

      <SiteFooter
        siteName={siteName}
        tagline={s?.tagline ?? null}
        menus={d.menus}
        year={new Date().getFullYear()}
        editorName={d.editor?.full_name ?? null}
      />
    </>
  );
}
