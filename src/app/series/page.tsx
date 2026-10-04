import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { getLearningPaths } from "@/lib/queries";
import { CoverMosaic } from "@/components/learning/cover-mosaic";
import { PathBadge } from "@/components/learning/path-progress";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Learning Paths",
  description: "Structured, self-paced series on AI, ML, and data science, read in order.",
  alternates: { canonical: "/series" },
};

const hours = (min: number) => (min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`);

/**
 * Every learning path as a card: a picture made from its parts' covers, what
 * it covers, how long it takes, the first few lessons, and (on this device)
 * how far the reader has got.
 */
export default async function SeriesIndexPage() {
  const paths = await getLearningPaths();
  const parts = paths.reduce((n, p) => n + p.parts.length, 0);
  const minutes = paths.reduce((n, p) => n + p.minutes, 0);

  return (
    <Shell>
      <header className="border-b border-border px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto w-full max-w-[1200px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-teal">Learning paths</p>
          <h1 className="font-serif text-[clamp(30px,5vw,46px)] leading-[1.08] font-black tracking-[-0.5px]">Learn it in order</h1>
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-muted">
            Structured, self-paced series. Each is a set of articles written to be read start to finish, so every part
            builds on the last.
          </p>
          {paths.length > 0 && (
            <p className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
              <span>
                <strong className="text-ink">{paths.length}</strong> paths
              </span>
              <span>
                <strong className="text-ink">{parts}</strong> lessons
              </span>
              <span>
                <strong className="text-ink">{hours(minutes)}</strong> of reading
              </span>
              <span>Free, no account needed</span>
            </p>
          )}
        </div>
      </header>

      <div className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1200px]">
          {paths.length === 0 ? (
            <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">No learning paths yet.</p>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paths.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/series/${p.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-bg2 transition-colors hover:border-gold/50"
                  >
                    <CoverMosaic
                      covers={p.cover_url ? [p.cover_url] : p.parts.map((x) => x.cover_image).filter((x): x is string => !!x)}
                      title={`${p.parts.length} ${p.parts.length === 1 ? "lesson" : "lessons"}`}
                      seed={p.slug}
                      steps={p.parts.length}
                      className="aspect-[16/9] transition-opacity group-hover:opacity-90"
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[1.5px] text-gold">
                        <span>
                          {p.parts.length} {p.parts.length === 1 ? "lesson" : "lessons"} · {hours(p.minutes)}
                        </span>
                        <PathBadge slugs={p.parts.map((x) => x.slug)} />
                      </div>
                      <h2 className="font-serif text-[21px] leading-tight font-black tracking-[-0.3px] group-hover:opacity-80">{p.title}</h2>
                      {p.description && <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">{p.description}</p>}
                      <ol className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3 text-[13px]">
                        {p.parts.slice(0, 3).map((x, i) => (
                          <li key={x.slug} className="flex gap-2">
                            <span className="w-4 shrink-0 font-mono text-[11px] text-gold">{i + 1}</span>
                            <span className="line-clamp-1">{x.title}</span>
                          </li>
                        ))}
                        {p.parts.length > 3 && <li className="pl-6 text-[12px] text-muted">+ {p.parts.length - 3} more</li>}
                      </ol>
                      <span className="mt-auto pt-4 text-[13px] font-semibold text-gold">Open the path →</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
