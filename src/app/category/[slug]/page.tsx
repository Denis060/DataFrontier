import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search, X } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { ArticleRows, Pagination } from "@/components/article-list";
import { InlineSubscribe } from "@/components/article/inline-subscribe";
import { getCategory, getFollowState, getMostReadInCategory, getTopicListing, getTopics } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";
import { FollowButton } from "@/components/follow-button";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; format?: string; q?: string; sort?: string }>;
};

/** Clamp to a sane integer so `?page=-3` or `?page=abc` can't reach the query. */
const toPage = (raw?: string) => Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) return { title: "Not found" };

  return {
    title: `${category.name}`,
    description: category.description ?? `Articles on ${category.name}.`,
    // Canonical to the plain topic page so filtered/paged variants don't split ranking.
    alternates: { canonical: `/category/${slug}` },
    robots: sp.q || sp.format || sp.sort ? { index: false, follow: true } : undefined,
  };
}

const chip = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
    on ? "border-gold bg-gold text-on-accent" : "border-border bg-bg2 text-muted hover:border-border-strong hover:text-ink"
  }`;

/**
 * A topic: a compact header, then the listing with format filters, a search
 * within the topic and sorting, beside a sidebar of what's most read here
 * and the other topics.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  const page = toPage(sp.page);
  const sort = sp.sort === "popular" ? "popular" : "new";
  const q = (sp.q ?? "").trim();
  const viewer = await getCurrentProfile();
  const [listing, follow, mostRead, topics] = await Promise.all([
    getTopicListing(category.id, { page, format: sp.format, q, sort }),
    getFollowState({ categoryId: category.id }, viewer?.id ?? null),
    getMostReadInCategory(category.id, 5),
    getTopics(),
  ]);
  const { items, total, perPage, formats } = listing;
  const format = formats.find((f) => f.slug === sp.format) ? sp.format : undefined;

  // A page past the end of an unfiltered list is a broken URL.
  if (page > 1 && items.length === 0 && !q && !format) notFound();

  /** This page's URL with some filters changed (and back to page 1). */
  const url = (next: { format?: string | null; q?: string | null; sort?: string | null }) => {
    const p = new URLSearchParams();
    const f = next.format === undefined ? format : next.format;
    const s = next.sort === undefined ? sort : next.sort;
    const t = next.q === undefined ? q : next.q;
    if (f) p.set("format", f);
    if (t) p.set("q", t);
    if (s && s !== "new") p.set("sort", s);
    const qs = p.toString();
    return `/category/${slug}${qs ? `?${qs}` : ""}`;
  };
  const filtered = !!(q || format);

  return (
    <Shell>
      <header className="border-b border-border px-5 pt-8 pb-6 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1200px]">
          <nav aria-label="Breadcrumb" className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-muted">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-gold">Topic</span>
          </nav>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-serif text-[clamp(28px,4.5vw,40px)] leading-[1.1] font-black tracking-[-0.5px]">{category.name}</h1>
              {category.description && (
                <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">{category.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
                {listing.all} {listing.all === 1 ? "article" : "articles"}
              </span>
              <FollowButton
                categoryId={category.id}
                initialFollowing={follow.following}
                initialCount={follow.count}
                canFollow={!!viewer}
                path={`/category/${slug}`}
              />
            </div>
          </div>

          {/* Jump to another topic. */}
          {topics.length > 1 && (
            <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {topics.map((t) => (
                <Link key={t.id} href={`/category/${t.slug}`} className={chip(t.slug === slug)} aria-current={t.slug === slug ? "page" : undefined}>
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* Filters: format, search within the topic, sort. Plain links and a
              GET form, so they work without JavaScript and can be shared. */}
          <div className="mb-5 flex flex-col gap-3">
            <form action={`/category/${slug}`} method="get" className="flex gap-2">
              {format && <input type="hidden" name="format" value={format} />}
              {sort !== "new" && <input type="hidden" name="sort" value={sort} />}
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search in {category.name}</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder={`Search ${category.name}`}
                  className="w-full rounded border border-border bg-surface-1 py-2.5 pr-3 pl-9 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2"
                />
              </label>
              <button type="submit" className="rounded bg-ink px-4 text-[13px] font-bold text-bg hover:opacity-85">
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {formats.length > 1 ? (
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                  <Link href={url({ format: null })} className={chip(!format)}>
                    All <span className="opacity-70">{listing.all}</span>
                  </Link>
                  {formats.map((f) => (
                    <Link key={f.slug} href={url({ format: f.slug })} className={chip(format === f.slug)}>
                      {f.name} <span className="opacity-70">{f.count}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1 text-[12px]" aria-label="Sort">
                <span className="mr-1 text-muted">Sort:</span>
                <Link href={url({ sort: "new" })} className={`rounded px-2 py-1 ${sort === "new" ? "bg-gold-dim font-semibold text-gold" : "text-muted hover:text-ink"}`}>
                  Newest
                </Link>
                <Link href={url({ sort: "popular" })} className={`rounded px-2 py-1 ${sort === "popular" ? "bg-gold-dim font-semibold text-gold" : "text-muted hover:text-ink"}`}>
                  Most read
                </Link>
              </div>
            </div>

            {filtered && (
              <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                {total} {total === 1 ? "result" : "results"}
                {q && (
                  <>
                    {" "}for <strong className="text-ink">&ldquo;{q}&rdquo;</strong>
                  </>
                )}
                <Link href={url({ q: null, format: null })} className="inline-flex items-center gap-1 font-semibold text-gold hover:underline">
                  <X className="size-3.5" aria-hidden /> Clear
                </Link>
              </p>
            )}
          </div>

          <ArticleRows
            articles={items}
            empty={filtered ? "Nothing matches. Try another word or clear the filters." : "Nothing published here yet."}
          />
          <Pagination page={page} total={total} perPage={perPage} basePath={url({})} />
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {mostRead.length > 0 && (
            <section>
              <h2 className="mb-3 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[2px] text-muted">
                Most read in {category.name}
              </h2>
              <ol className="flex flex-col gap-3">
                {mostRead.map((a, i) => (
                  <li key={a.id}>
                    <Link href={`/article/${a.slug}`} className="group flex gap-3">
                      <span className="w-6 shrink-0 text-center font-serif text-2xl leading-none font-black text-gold">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="block font-serif text-[15px] leading-snug font-bold group-hover:opacity-75">{a.title}</span>
                        {a.reading_time ? <span className="mt-0.5 block text-[11px] text-muted">{a.reading_time} min read</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <InlineSubscribe slug={slug} source={`category:${slug}`} className="" stacked />

          <section>
            <h2 className="mb-3 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[2px] text-muted">
              Other topics
            </h2>
            <ul className="flex flex-col gap-1.5 text-[14px]">
              {topics
                .filter((t) => t.slug !== slug)
                .map((t) => (
                  <li key={t.id}>
                    <Link href={`/category/${t.slug}`} className="text-muted hover:text-gold">
                      {t.name} →
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </div>
      </div>
    </Shell>
  );
}
