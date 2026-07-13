import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { getAllSeries } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Learning Paths",
  description: "Structured, self-paced series on AI, ML, and data science, read in order.",
};

export default async function SeriesIndexPage() {
  const series = (await getAllSeries()).filter((s) => s.count > 0);

  return (
    <Shell>
      <header className="border-b border-border px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[760px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-teal">Learning paths</p>
          <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            Learn it in order
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Structured, self-paced series, each one a set of articles meant to be read start to finish.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8">
        {series.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No learning paths yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {series.map((s) => (
              <li key={s.id}>
                <Link href={`/series/${s.slug}`} className="block py-6 transition-opacity hover:opacity-75">
                  <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-gold">
                    {s.count} {s.count === 1 ? "part" : "parts"}
                  </p>
                  <p className="mt-1.5 font-serif text-xl font-black tracking-[-0.3px]">{s.title}</p>
                  {s.description && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{s.description}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
