import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article/article-body";
import { Shell } from "@/components/layout/shell";
import { InlineSubscribe } from "@/components/article/inline-subscribe";
import { CoverImage } from "@/components/cover-image";
import { CoverMosaic } from "@/components/learning/cover-mosaic";
import { PartMarker, PathProgress } from "@/components/learning/path-progress";
import { getLearningPaths, getSeriesBySlug } from "@/lib/queries";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSeriesBySlug(slug);
  if (!data) return { title: "Series not found" };
  const title = `${data.series.title} | Everyday Data Science`;
  return {
    title,
    description: data.series.description ?? undefined,
    alternates: { canonical: `/series/${data.series.slug}` },
  };
}

const hours = (min: number) => (min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`);

/**
 * One learning path: what it is and how long it takes, the reader's progress
 * and next step, then the lessons as a numbered timeline (ticked once read on
 * this device). The sidebar keeps progress in view beside the list.
 */
export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, all] = await Promise.all([getSeriesBySlug(slug), getLearningPaths()]);
  if (!data) notFound();
  const { series, articles } = data;
  const minutes = articles.reduce((m, a) => m + (a.reading_time ?? 0), 0);
  const covers = series.cover_url ? [series.cover_url] : articles.map((a) => a.cover_image).filter((x): x is string => !!x);
  const others = all.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <Shell>
      <header className="border-b border-border px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-muted">
              <Link href="/series" className="hover:text-ink">
                Learning paths
              </Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-teal">
                {articles.length} {articles.length === 1 ? "lesson" : "lessons"} · {hours(minutes)}
              </span>
            </nav>
            <h1 className="font-serif text-[clamp(30px,5vw,48px)] leading-[1.06] font-black tracking-[-1px]">{series.title}</h1>
            {series.description && <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-muted">{series.description}</p>}
          </div>
          <CoverMosaic
            covers={covers}
            title={`${articles.length} lessons · ${hours(minutes)}`}
            seed={series.slug}
            steps={articles.length}
            className="aspect-[16/10] rounded-lg border border-border"
          />
        </div>
      </header>

      <div className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* The full editorial introduction, authored as Markdown. */}
            {series.long_description && (
              <div className="mb-8">
                <ArticleBody source={series.long_description} />
              </div>
            )}

            {articles.length === 0 ? (
              <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">No parts published yet.</p>
            ) : (
              <>
                <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[2px] text-muted">The lessons</h2>
                <ol className="relative flex flex-col gap-4">
                  {/* The timeline's spine, behind the numbered markers. */}
                  <span aria-hidden className="absolute top-6 bottom-6 left-[17px] w-px bg-border" />
                  {articles.map((a, i) => (
                    <li key={a.id} className="relative flex gap-4">
                      <div className="pt-4">
                        <PartMarker slug={a.slug} n={i + 1} />
                      </div>
                      <Link
                        href={`/article/${a.slug}`}
                        className="group grid min-w-0 flex-1 gap-4 rounded-lg border border-border bg-bg2 p-4 transition-colors hover:border-gold/50 sm:grid-cols-[160px_minmax(0,1fr)]"
                      >
                        {a.cover_image ? (
                          <CoverImage src={a.cover_image} alt={a.cover_alt ?? ""} sizes="160px" className="hidden sm:block" />
                        ) : (
                          <div
                            aria-hidden
                            className="hidden aspect-[16/9] items-center justify-center rounded-md border border-border bg-gradient-to-br from-gold-dim via-bg2 to-teal-dim font-serif text-[40px] font-black text-gold/40 sm:flex"
                          >
                            {i + 1}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-gold">
                            Part {i + 1}
                            {a.reading_time ? ` · ${a.reading_time} min` : ""}
                          </p>
                          <p className="mt-1 font-serif text-[18px] leading-[1.25] font-bold group-hover:opacity-80">{a.title}</p>
                          {a.excerpt && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{a.excerpt}</p>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {articles.length > 0 && (
              <section className="rounded-lg border border-border bg-bg2 p-5">
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-muted">Your progress</h2>
                <PathProgress slugs={articles.map((a) => a.slug)} titles={articles.map((a) => a.title)} />
              </section>
            )}

            {others.length > 0 && (
              <section>
                <h2 className="mb-3 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[2px] text-muted">More learning paths</h2>
                <ul className="flex flex-col gap-3">
                  {others.map((p) => (
                    <li key={p.id}>
                      <Link href={`/series/${p.slug}`} className="group flex items-center gap-3">
                        <CoverMosaic
                          covers={(p.cover_url ? [p.cover_url] : p.parts.map((x) => x.cover_image).filter((x): x is string => !!x)).slice(0, 1)}
                          title=""
                          seed={p.slug}
                          steps={0}
                          className="aspect-square w-14 shrink-0 rounded-md border border-border"
                        />
                        <span className="min-w-0">
                          <span className="block font-serif text-[15px] leading-snug font-bold group-hover:opacity-75">{p.title}</span>
                          <span className="text-[11px] text-muted">
                            {p.parts.length} lessons · {hours(p.minutes)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <InlineSubscribe slug={slug} source={`series:${slug}`} className="" stacked />
          </aside>
        </div>
      </div>
    </Shell>
  );
}
