import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleBody } from "@/components/article/article-body";
import {
  getArticle,
  getArticleReactions,
  getChrome,
  getComments,
  getMoreByAuthor,
  getUnreadCount,
  getRelated,
  getArticleSeriesNav,
  getSlugRedirect,
  isBookmarked,
  menuFor,
  type ArticleCard,
} from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";
import { Pill } from "@/components/pill";
import { ShareBar } from "@/components/article/share-bar";
import { ReactionButton } from "@/components/article/reaction-button";
import { BookmarkButton } from "@/components/article/bookmark-button";
import { CommentsProvider, CommentButton, CommentsReveal } from "@/components/article/comments-disclosure";
import { InlineSubscribe } from "@/components/article/inline-subscribe";
import { Comments } from "@/components/article/comments";
import { ViewCounter } from "@/components/article/view-counter";
import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";

type Props = { params: Promise<{ slug: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE_SUFFIX = " | Everyday Data Science";

/**
 * Search engines truncate the <title> near 60 characters, so keywords at the
 * end vanish from the SERP. Keep it tight: append the site suffix only if the
 * result still fits, otherwise drop it (and trim a long headline at a word
 * boundary). Editors front-load keywords via the `meta_title` override.
 */
function clampTitle(base: string): string {
  const withSuffix = base + TITLE_SUFFIX;
  if (withSuffix.length <= 60) return withSuffix;
  if (base.length <= 60) return base;
  const cut = base.slice(0, 60);
  const sp = cut.lastIndexOf(" ");
  return (sp > 30 ? cut.slice(0, sp) : cut).trimEnd();
}

/** Strip Markdown to plain text for a meta-description fallback. */
function plainText(md: string): string {
  return md.replace(/[#>*_`~[\]()!]/g, "").replace(/\s+/g, " ").trim();
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [article, { settings }] = await Promise.all([getArticle(slug), getChrome()]);
  if (!article) return { title: "Not found" };

  const headline = article.title;
  // SERP title: sized for ~60 chars. Social title: the full headline.
  const metaTitle = clampTitle(article.meta_title ?? headline);
  const bodyText = article.body ? plainText(article.body) : "";
  const description =
    article.meta_description ??
    article.excerpt ??
    (bodyText ? bodyText.slice(0, 155).trimEnd() : undefined) ??
    settings?.default_meta_description ??
    undefined;
  // A real cover photo wins; otherwise fall back to the generated branded card
  // (the opengraph-image route). Defining openGraph here suppresses the file
  // convention's auto-merge, so the fallback is referenced explicitly.
  const cover = article.og_image || article.cover_image || null;
  const ogImage = cover
    ? { url: cover }
    : { url: `${SITE_URL}/article/${article.slug}/opengraph-image`, width: 1200, height: 630 };

  return {
    // `absolute` bypasses the layout's "%s | Everyday Data Science" template,
    // which would otherwise blow past the 60-char SERP limit.
    title: { absolute: metaTitle },
    description,
    // Self-canonical to the article's own URL, unless an explicit override is set.
    alternates: { canonical: article.canonical_url ?? `/article/${article.slug}` },
    robots: article.status === "published" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: headline,
      description,
      url: `${SITE_URL}/article/${article.slug}`,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? article.published_at ?? undefined,
      authors: article.author ? [article.author.full_name] : undefined,
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title: headline, description, images: [ogImage.url] },
  };
}

/** Compact card used throughout the rail. */
function RailCard({ a }: { a: ArticleCard }) {
  return (
    <Link href={`/article/${a.slug}`} className="group block border-b border-border py-3.5 last:border-b-0">
      {a.format && (
        <Pill color={a.format.color} className="mb-1.5 !px-2 !py-0.5 !text-[9px] !tracking-[1.5px]">
          {a.format.name}
        </Pill>
      )}
      <p className="mb-1 font-serif text-sm leading-[1.35] font-bold transition-opacity group-hover:opacity-75">
        {a.title}
      </p>
      <p className="text-[11px] text-muted">{a.reading_time} min read</p>
    </Link>
  );
}

function RailSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 border-b-2 border-border pb-2.5 font-mono text-[10px] uppercase tracking-[2px] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, chrome, profile] = await Promise.all([
    getArticle(slug),
    getChrome(),
    getCurrentProfile(),
  ]);
  if (!article) {
    // A renamed post 301s from its old slug so links and ranking are preserved.
    const dest = await getSlugRedirect(slug);
    if (dest && dest !== slug) permanentRedirect(`/article/${dest}`);
    notFound();
  }

  const [related, moreByAuthor, comments, reactions, bookmarked] = await Promise.all([
    getRelated(article.id, article.category_id),
    getMoreByAuthor(article.author_id, article.id),
    getComments(article.id),
    getArticleReactions(article.id),
    isBookmarked(article.id),
  ]);

  const seriesNav = article.series_id ? await getArticleSeriesNav(article.series_id, article.id) : null;

  const unread = await getUnreadCount(profile?.id ?? null);
  const { settings } = chrome;
  const isDraft = article.status !== "published";
  const shareUrl = `${SITE_URL}/article/${article.slug}`;

  // Structured data helps Google render rich results for articles.
  const authorUrl = article.author?.slug ? `${SITE_URL}/author/${article.author.slug}` : undefined;
  const logo = settings?.logo_url ?? `${SITE_URL}/icon.svg`;
  // Only real profile links (with a path) become sameAs; blanks/placeholders drop out.
  const authorSameAs = Object.values((article.author?.socials ?? {}) as Record<string, unknown>).filter(
    (v): v is string => typeof v === "string" && /^https?:\/\/[^/]+\/.+/.test(v),
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.og_image ?? article.cover_image ?? `${shareUrl}/opengraph-image`,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at ?? article.published_at ?? undefined,
    // Reference the author by @id so it resolves to the single canonical Person
    // entity defined on the author page (with sameAs links to their profiles).
    author: article.author
      ? {
          "@type": "Person",
          ...(authorUrl ? { "@id": `${authorUrl}#person`, url: authorUrl } : {}),
          name: article.author.full_name,
          ...(authorSameAs.length ? { sameAs: authorSameAs } : {}),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: settings?.site_name ?? "Everyday Data Science",
      logo: { "@type": "ImageObject", url: logo },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
    articleSection: article.category?.name,
  };

  // Breadcrumb trail: Home > Category > Article, for richer SERP display.
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(article.category
        ? [{ "@type": "ListItem", position: 2, name: article.category.name, item: `${SITE_URL}/category/${article.category.slug}` }]
        : []),
      { "@type": "ListItem", position: article.category ? 3 : 2, name: article.title, item: shareUrl },
    ],
  };

  return (
    <>
      {!isDraft && (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        </>
      )}
      <SiteHeader
        siteName={settings?.site_name ?? "Everyday Data Science"}
        established={settings?.established_year ?? null}
        nav={menuFor(chrome.menus, "header")}
        ticker={chrome.ticker}
        profile={profile}
        unread={unread}
      />

      {!isDraft && <ViewCounter slug={article.slug} />}

      <main className="flex-1">
       <CommentsProvider>
        <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-12 lg:py-16">
          <article className="min-w-0 max-w-[760px] lg:col-start-1 lg:row-start-1">
            {isDraft && (
              <p className="mb-6 rounded border border-gold/30 bg-gold-dim px-3 py-2 font-mono text-[11px] uppercase tracking-[1.5px] text-gold">
                Preview, status: {article.status.replace("_", " ")}
              </p>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-3">
              {article.category && (
                <Link href={`/category/${article.category.slug}`}>
                  <Pill color={article.category.color}>{article.category.name}</Pill>
                </Link>
              )}
              {article.format && <Pill color={article.format.color}>{article.format.name}</Pill>}
              <time className="text-xs text-muted" dateTime={article.published_at ?? undefined}>
                {fmtDate(article.published_at)}
              </time>
            </div>

            <h1 className="mb-4 font-serif text-[clamp(30px,5vw,48px)] leading-[1.1] font-black tracking-[-1.2px]">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="mb-6 text-lg leading-relaxed text-muted">{article.subtitle}</p>
            )}

            <div className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-border py-4">
              {article.author && (
                <Link
                  href={article.author.slug ? `/author/${article.author.slug}` : "#"}
                  className="flex items-center gap-2.5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-135 from-gold to-[#8B6914] font-serif text-[13px] font-bold text-on-accent">
                    {initials(article.author.full_name)}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[13px] font-semibold">{article.author.full_name}</span>
                    <span className="text-[11px] text-muted">{article.author.title}</span>
                  </span>
                </Link>
              )}
              <span className="flex w-full items-center gap-2.5 font-mono text-[11px] text-muted sm:ml-auto sm:w-auto">
                {article.reading_time && <span>{article.reading_time} min read</span>}
                {article.kicker && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{article.kicker}</span>
                  </>
                )}
              </span>
            </div>

            {seriesNav && (
              <Link
                href={`/series/${seriesNav.series.slug}`}
                className="mb-8 flex items-center gap-2.5 rounded-md border border-teal/25 bg-teal-dim px-4 py-3 text-[13px] transition-colors hover:border-teal/40"
              >
                <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-teal">
                  Part {seriesNav.position} of {seriesNav.total}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{seriesNav.series.title}</span>
                <span className="shrink-0 text-teal">View path →</span>
              </Link>
            )}

            {article.body || article.body_html ? (
              <ArticleBody html={article.body_html} source={article.body} />
            ) : (
              <p className="text-muted">This article has no body yet.</p>
            )}

            {seriesNav && (seriesNav.prev || seriesNav.next) && (
              <div className="mt-12 grid gap-3 sm:grid-cols-2">
                {seriesNav.prev ? (
                  <Link href={`/article/${seriesNav.prev.slug}`} className="rounded-md border border-border p-4 transition-colors hover:border-border-strong hover:bg-surface-1">
                    <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-muted">← Previous</span>
                    <p className="mt-1 font-serif text-[14px] font-bold">{seriesNav.prev.title}</p>
                  </Link>
                ) : (
                  <span />
                )}
                {seriesNav.next && (
                  <Link href={`/article/${seriesNav.next.slug}`} className="rounded-md border border-border p-4 text-right transition-colors hover:border-border-strong hover:bg-surface-1">
                    <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-gold">Next →</span>
                    <p className="mt-1 font-serif text-[14px] font-bold">{seriesNav.next.title}</p>
                  </Link>
                )}
              </div>
            )}

            {/* Repeated at the foot: the reader who just finished is the one
                most likely to react and share. */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <div className="flex items-center gap-2.5">
                <ReactionButton
                  articleId={article.id}
                  initialCount={reactions.count}
                  initialReacted={reactions.reacted}
                  signedIn={!!profile}
                  slug={article.slug}
                />
                <CommentButton count={comments.count} />
                <BookmarkButton
                  articleId={article.id}
                  initialSaved={bookmarked}
                  signedIn={!!profile}
                  slug={article.slug}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted">Share</span>
                <ShareBar url={shareUrl} title={article.title} />
              </div>
            </div>

            {/* Gentle nudge — an invitation, never a gate. */}
            <p className="mt-6 text-[13px] leading-relaxed text-muted">
              Found this useful? Passing it on to someone who builds is the best way to help the
              publication grow.
            </p>
            <InlineSubscribe slug={article.slug} />
          </article>

          {/* Comments sit right under the article — on mobile that means before
              the discovery rail, so a reader who just finished can jump straight
              to the discussion instead of scrolling past related posts. */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:max-w-[760px]">
            <CommentsReveal>
              <Comments
                articleId={article.id}
                slug={article.slug}
                tree={comments.tree}
                count={comments.count}
                currentUserId={profile?.id ?? null}
                signedIn={!!profile}
              />
            </CommentsReveal>
          </div>

          {/* Sticky on desktop; stacks under the comments on mobile.
              A rail taller than the viewport can never hold its sticky
              position, so it scrolls within itself instead. */}
          <aside className="flex flex-col gap-9 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
            {/* Desktop only. On mobile the rail stacks beneath the article, so
                this would sit immediately under the in-article share bar. */}
            <RailSection title="Share" className="hidden lg:block">
              <ShareBar url={shareUrl} title={article.title} />
            </RailSection>

            {related.length > 0 && (
              <RailSection title={`More in ${article.category?.name ?? "this topic"}`}>
                {related.map((r) => (
                  <RailCard key={r.id} a={r} />
                ))}
              </RailSection>
            )}

            {moreByAuthor.length > 0 && article.author && (
              <RailSection title={`More by ${article.author.full_name.split(" ")[0]}`}>
                {moreByAuthor.map((r) => (
                  <RailCard key={r.id} a={r} />
                ))}
              </RailSection>
            )}

            <RailSection title="Newsletter">
              <p className="mb-3 text-[13px] leading-relaxed text-muted">
                {settings?.newsletter_subtext?.slice(0, 110) ??
                  "Weekly dispatches from Everyday Data Science."}
              </p>
              <Link
                href="/newsletter"
                className="inline-flex w-full items-center justify-center rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
              >
                Subscribe free →
              </Link>
            </RailSection>
          </aside>
        </div>
       </CommentsProvider>
      </main>

      <SiteFooter
        siteName={settings?.site_name ?? "Everyday Data Science"}
        tagline={settings?.tagline ?? null}
        menus={chrome.menus}
        year={new Date().getFullYear()}
        editorName={null}
      />
    </>
  );
}
