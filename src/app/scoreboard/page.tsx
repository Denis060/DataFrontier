import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { getScoreboard, type Prediction, type PredictionStatus } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Were we wrong? The scoreboard",
  description:
    "Our articles say what would prove them wrong. This is where we keep score: every tracked claim, and whether it held up or was proved wrong.",
  alternates: { canonical: "/scoreboard" },
};

export const revalidate = 300;

// Misses first: the page only earns trust if the wrong calls are easy to find.
const GROUPS: { status: PredictionStatus; title: string; blurb: string; tone: string }[] = [
  {
    status: "wrong",
    title: "Proved wrong",
    blurb: "The condition we named happened, and the piece's conclusion did not survive it.",
    tone: "border-red/30 bg-red-dim text-red",
  },
  {
    status: "held",
    title: "Held up",
    blurb: "The evidence since publication supports what the piece argued.",
    tone: "border-teal/30 bg-teal-dim text-teal",
  },
  {
    status: "open",
    title: "Still open",
    blurb: "Not testable yet, or not tested yet. We'll check back.",
    tone: "border-border bg-surface-1 text-muted",
  },
];

const fmt = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function Row({ p }: { p: Prediction }) {
  return (
    <li className="py-5">
      <p className="text-[15px] leading-relaxed">{p.claim}</p>
      {p.verdict_note && <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.verdict_note}</p>}
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
        {p.article && (
          <Link href={`/article/${p.article.slug}`} className="font-semibold text-gold hover:underline">
            From: {p.article.title}
          </Link>
        )}
        {p.checked_on && <span>Checked {fmt(p.checked_on)}</span>}
      </p>
    </li>
  );
}

export default async function ScoreboardPage() {
  const all = await getScoreboard();
  const count = (s: PredictionStatus) => all.filter((p) => p.status === s).length;

  return (
    <Shell>
      <header className="border-b border-border bg-bg2 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[900px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">The scoreboard</p>
          <h1 className="font-serif text-[clamp(32px,5.5vw,54px)] leading-[1.05] font-black tracking-[-0.8px]">
            Were we wrong?
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-muted">
            Most of our pieces end by naming what would prove them wrong. Here we keep score:
            the claims we&apos;re tracking, and how each one has held up since.
          </p>
          {all.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {GROUPS.map((g) => (
                <a key={g.status} href={`#${g.status}`} className={`rounded-md border px-4 py-3 ${g.tone}`}>
                  <span className="block font-serif text-[28px] leading-none font-black">{count(g.status)}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[1.5px]">{g.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-[900px] px-5 py-12 sm:px-8 lg:px-12">
        {all.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-6 py-12 text-center text-[14px] text-muted">
            We&apos;re reviewing the predictions in our archive. The scoreboard opens once the first
            ones are checked.
          </p>
        ) : (
          GROUPS.map((g) => {
            const rows = all.filter((p) => p.status === g.status);
            if (rows.length === 0) return null;
            return (
              <section key={g.status} id={g.status} className="mb-12 scroll-mt-28">
                <h2 className="font-serif text-[26px] font-black tracking-[-0.4px]">
                  {g.title} <span className="text-muted">({rows.length})</span>
                </h2>
                <p className="mt-1 text-[14px] text-muted">{g.blurb}</p>
                <ol className="mt-3 flex flex-col divide-y divide-border border-y border-border">
                  {rows.map((p) => (
                    <Row key={p.id} p={p} />
                  ))}
                </ol>
              </section>
            );
          })
        )}
        <p className="mt-4 text-[13px] text-muted">
          See also our{" "}
          <Link href="/corrections" className="font-semibold text-gold hover:underline">
            corrections log
          </Link>
          , for factual errors we have fixed.
        </p>
      </div>
    </Shell>
  );
}
