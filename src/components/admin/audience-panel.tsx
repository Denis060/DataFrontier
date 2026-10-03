import Link from "next/link";
import { SURVEY } from "@/lib/free-offers";

type Sub = { status: string; magnet_id: string | null; survey: unknown; source?: string | null };
type Offer = { id: string; slug: string; title: string; is_active: boolean };

/**
 * Who reads, from the optional post-confirmation survey, and how each free
 * offer is converting. Shares are of confirmed subscribers who answered that
 * question, so small numbers are shown as counts too.
 */
export function AudiencePanel({ subs, offers }: { subs: Sub[]; offers: Offer[] }) {
  const confirmed = subs.filter((s) => s.status === "confirmed");
  const answered = confirmed.filter((s) => s.survey && typeof s.survey === "object");

  const perOffer = offers.map((o) => {
    const mine = subs.filter((s) => s.magnet_id === o.id);
    return { ...o, signups: mine.length, confirmed: mine.filter((s) => s.status === "confirmed").length };
  });
  // Readers who signed up to download a single cheat sheet.
  const viaSheets = subs.filter((s) => s.source?.startsWith("sheet:"));
  const sheetsConfirmed = viaSheets.filter((s) => s.status === "confirmed").length;

  return (
    <section aria-label="Audience" className="mb-8 flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-bg2 p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-xl font-black">Free offers</h2>
          <Link href="/admin/manage/free-offers" className="text-[13px] text-gold hover:underline">
            Manage offers →
          </Link>
        </div>
        {viaSheets.length > 0 && (
          <p className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5 text-[13px]">
            <span className="font-semibold">Cheat sheet downloads</span>
            <span className="font-mono text-[12px] text-muted">
              {viaSheets.length} signed up · {sheetsConfirmed} confirmed ({Math.round((sheetsConfirmed / viaSheets.length) * 100)}%)
            </span>
          </p>
        )}
        {perOffer.length === 0 ? (
          <p className="text-[13px] text-muted">No offers yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {perOffer.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{o.title}</span>{" "}
                  <a href={`/free/${o.slug}`} target="_blank" rel="noopener" className="font-mono text-[11px] text-muted hover:text-gold">
                    /free/{o.slug}
                  </a>
                  {!o.is_active && <span className="ml-2 text-[11px] text-red">off</span>}
                </span>
                <span className="font-mono text-[12px] text-muted">
                  {o.signups} signed up · {o.confirmed} confirmed
                  {o.signups > 0 && ` (${Math.round((o.confirmed / o.signups) * 100)}%)`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border bg-bg2 p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-xl font-black">Who reads</h2>
          <p className="font-mono text-[11px] text-muted">
            {answered.length} of {confirmed.length} confirmed answered the survey
          </p>
        </div>
        {answered.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">
            No answers yet. New subscribers are asked three optional questions right after they confirm.
          </p>
        ) : (
          <div className="mt-3 grid gap-5 sm:grid-cols-3">
            {SURVEY.map((q) => {
              const counts = new Map<string, number>();
              for (const s of answered) {
                const v = (s.survey as Record<string, string>)[q.key];
                if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
              }
              const total = [...counts.values()].reduce((a, b) => a + b, 0);
              const rows = q.options
                .map((o) => ({ label: o.label, n: counts.get(o.value) ?? 0 }))
                .filter((r) => r.n > 0)
                .sort((a, b) => b.n - a.n);
              return (
                <div key={q.key}>
                  <p className="mb-2 text-[12px] font-semibold">{q.question}</p>
                  {rows.length === 0 ? (
                    <p className="text-[12px] text-muted">No answers.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {rows.map((r) => {
                        const pct = Math.round((r.n / total) * 100);
                        return (
                          <li key={r.label} className="text-[12px]">
                            <span className="flex justify-between gap-2">
                              <span>{r.label}</span>
                              <span className="font-mono text-muted">
                                {pct}% · {r.n}
                              </span>
                            </span>
                            <span className="mt-0.5 block h-1.5 rounded-full bg-surface-1">
                              <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
