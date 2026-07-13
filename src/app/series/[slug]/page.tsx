import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { getSeriesBySlug } from "@/lib/queries";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSeriesBySlug(slug);
  if (!data) return { title: "Series not found | Everyday Data Science" };
  const title = `${data.series.title} | Everyday Data Science`;
  return {
    title,
    description: data.series.description ?? undefined,
    alternates: { canonical: `/series/${data.series.slug}` },
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSeriesBySlug(slug);
  if (!data) notFound();
  const { series, articles } = data;

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8 lg:py-16">
        <header className="border-b border-border pb-8">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-teal">
            Learning path · {articles.length} {articles.length === 1 ? "part" : "parts"}
          </p>
          <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            {series.title}
          </h1>
          {series.description && (
            <p className="mt-4 text-[16px] leading-relaxed text-muted">{series.description}</p>
          )}
        </header>

        {articles.length === 0 ? (
          <p className="mt-8 rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No parts published yet.
          </p>
        ) : (
          <ol className="mt-8 flex flex-col">
            {articles.map((a, i) => (
              <li key={a.id} className="border-b border-border last:border-b-0">
                <Link href={`/article/${a.slug}`} className="flex gap-4 py-5 transition-opacity hover:opacity-75">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[13px] text-gold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg leading-[1.25] font-bold">{a.title}</p>
                    {a.excerpt && <p className="mt-1 text-[13px] leading-relaxed text-muted">{a.excerpt}</p>}
                    {a.reading_time && (
                      <p className="mt-1.5 font-mono text-[11px] text-muted">{a.reading_time} min read</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-10 text-[13px]">
          <Link href="/series" className="text-muted hover:text-ink">← All learning paths</Link>
        </p>
      </div>
    </Shell>
  );
}
