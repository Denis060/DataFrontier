import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { getCorrectionsLog } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Corrections",
  description:
    "Every correction Everyday Data Science has made, with the date and what changed. When we get something wrong, we fix it in the open.",
  alternates: { canonical: "/corrections" },
};

export const revalidate = 300;

// Date-only values: pin to midday UTC so no time zone shifts the day.
const fmt = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default async function CorrectionsPage() {
  const log = await getCorrectionsLog();

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8 lg:py-16">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Accountability</p>
        <h1 className="font-serif text-[clamp(30px,5vw,46px)] leading-[1.08] font-black tracking-[-0.6px]">
          Corrections
        </h1>
        <div className="mt-5 flex flex-col gap-3 text-[15px] leading-relaxed text-muted">
          <p>
            When a piece gets something wrong, we fix it in the article and add a dated note saying
            what changed. We don&apos;t quietly edit mistakes away. Every correction is also listed
            here.
          </p>
          <p>
            Spotted an error?{" "}
            <Link href="/contact" className="font-semibold text-gold hover:underline">
              Tell us
            </Link>{" "}
            with a link to the article and the source that shows the problem.
          </p>
        </div>

        <section className="mt-10">
          {log.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-6 py-12 text-center text-[14px] text-muted">
              No corrections yet. When we get something wrong, it will be listed here.
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-border border-y border-border">
              {log.map((c) => (
                <li key={c.id} className="py-5">
                  <time dateTime={c.corrected_on} className="font-mono text-[11px] uppercase tracking-[1.5px] text-gold">
                    {fmt(c.corrected_on)}
                  </time>
                  {c.article && (
                    <Link
                      href={`/article/${c.article.slug}#corrections`}
                      className="mt-1 block font-serif text-[18px] leading-snug font-bold hover:text-gold"
                    >
                      {c.article.title}
                    </Link>
                  )}
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{c.note}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </Shell>
  );
}
