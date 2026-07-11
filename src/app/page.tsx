import { getHomeData, getUnreadCount, menuFor } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";
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
  const siteName = s?.site_name ?? "The DataFrontier";

  const badges = Array.isArray(s?.editor_badges)
    ? (s.editor_badges as { label: string; color: string }[])
    : [];

  return (
    <>
      <SiteHeader
        siteName={siteName}
        established={s?.established_year ?? null}
        nav={menuFor(d.menus, "header")}
        ticker={d.ticker}
        profile={profile}
        unread={unread}
      />

      <main className="flex-1">
        <Hero hero={d.hero} latest={d.latest} />

        <NewsletterBand
          headline={s?.newsletter_headline ?? "Stay Ahead of the Data Frontier"}
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
