import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/lib/mdx";
import {
  getArticle,
  getChrome,
  getMoreByAuthor,
  getRelated,
  menuFor,
  type ArticleCard,
} from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";
import { Pill } from "@/components/pill";
import { ShareBar } from "@/components/article/share-bar";
import { ViewCounter } from "@/components/article/view-counter";
import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";

type Props = { params: Promise<{ slug: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

  const title = article.meta_title ?? article.title;
  const description =
    article.meta_description ?? article.excerpt ?? settings?.default_meta_description ?? undefined;
  const image = article.og_image ?? article.cover_image ?? settings?.default_og_image ?? undefined;

  return {
    title,
    description,
    alternates: article.canonical_url ? { canonical: article.canonical_url } : undefined,
    robots: article.status === "published" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/article/${article.slug}`,
      publishedTime: article.published_at ?? undefined,
      authors: article.author ? [article.author.full_name] : undefined,
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
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
  if (!article) notFound();

  const [related, moreByAuthor] = await Promise.all([
    getRelated(article.id, article.category_id),
    getMoreByAuthor(article.author_id, article.id),
  ]);

  const { settings } = chrome;
  const isDraft = article.status !== "published";
  const shareUrl = `${SITE_URL}/article/${article.slug}`;

  return (
    <>
      <SiteHeader
        siteName={settings?.site_name ?? "The DataFrontier"}
        established={settings?.established_year ?? null}
        nav={menuFor(chrome.menus, "header")}
        ticker={chrome.ticker}
        profile={profile}
      />

      {!isDraft && <ViewCounter slug={article.slug} />}

      <main className="flex-1">
        <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-12 lg:py-16">
          <article className="min-w-0 max-w-[760px]">
            {isDraft && (
              <p className="mb-6 rounded border border-gold/30 bg-gold-dim px-3 py-2 font-mono text-[11px] uppercase tracking-[1.5px] text-gold">
                Preview — status: {article.status.replace("_", " ")}
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
              <span className="ml-auto flex items-center gap-2.5 font-mono text-[11px] text-muted">
                {article.reading_time && <span>{article.reading_time} min read</span>}
                {article.kicker && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{article.kicker}</span>
                  </>
                )}
              </span>
            </div>

            {article.body ? (
              <ArticleBody source={article.body} />
            ) : (
              <p className="text-muted">This article has no body yet.</p>
            )}

            {/* Repeated at the foot: the reader who just finished is the one
                most likely to share. */}
            <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-6">
              <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted">
                Share this article
              </span>
              <ShareBar url={shareUrl} title={article.title} />
            </div>
          </article>

          {/* Sticky on desktop; stacks under the article on mobile.
              A rail taller than the viewport can never hold its sticky
              position, so it scrolls within itself instead. */}
          <aside className="flex flex-col gap-9 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
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
                  "Weekly dispatches from the Data Frontier."}
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
      </main>

      <SiteFooter
        siteName={settings?.site_name ?? "The DataFrontier"}
        tagline={settings?.tagline ?? null}
        menus={chrome.menus}
        year={new Date().getFullYear()}
        editorName={null}
      />
    </>
  );
}
