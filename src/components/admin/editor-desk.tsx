import Link from "next/link";
import { ArrowRight, Check, FileText, Inbox, MessageSquare } from "lucide-react";
import type { Desk } from "@/lib/editor-desk";

/** "today", "1 day", "5 days": how long something has waited. Rendered per request. */
function waited(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return days <= 0 ? "today" : days === 1 ? "1 day" : `${days} days`;
}

/**
 * The editor's queue, first thing on the overview: pieces to review (oldest
 * first), pitches to decide, comments to approve. Empty means a clear desk.
 */
export function EditorDesk({ desk }: { desk: Desk }) {
  const total = desk.review.length + desk.pitchCount + desk.comments;

  if (total === 0) {
    return (
      <section className="mb-8 flex items-center gap-3 rounded-lg border border-teal/30 bg-teal-dim px-5 py-4 text-[14px]">
        <Check className="size-5 shrink-0 text-teal" aria-hidden />
        <p>
          <span className="font-semibold">Your desk is clear.</span>{" "}
          <span className="text-muted">
            No pieces to review, pitches to decide or comments to approve.
            {desk.withWriters > 0 && ` ${desk.withWriters} piece${desk.withWriters === 1 ? " is" : "s are"} back with writers for changes.`}
          </span>
        </p>
      </section>
    );
  }

  return (
    <section aria-label="On your desk" className="mb-8 rounded-lg border border-gold/40 bg-gold-dim/50 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-black">On your desk</h2>
        <p className="font-mono text-[11px] text-gold">
          {total} waiting{desk.withWriters > 0 && ` · ${desk.withWriters} back with writers`}
        </p>
      </div>

      {desk.review.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
            <FileText className="size-3.5" aria-hidden /> To review
          </p>
          <ul className="flex flex-col gap-2">
            {desk.review.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/articles/${p.id}`}
                  className="group flex items-center gap-3 rounded-md border border-border bg-bg p-3 transition-colors hover:border-gold/50 sm:p-4"
                >
                  {p.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar} alt="" className="size-9 shrink-0 rounded-full border border-border object-cover" />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-1 text-[13px] font-bold text-muted">
                      {p.writer.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-[16px] leading-snug font-bold">{p.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {p.writer} · waiting {waited(p.since)}
                      {p.revised && <span className="ml-1.5 rounded bg-gold px-1.5 py-px text-[10px] font-bold text-on-accent">Revised</span>}
                    </p>
                    {p.note && <p className="mt-1 line-clamp-1 text-[12px] italic text-muted">&ldquo;{p.note}&rdquo;</p>}
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 rounded bg-gold px-3 py-2 text-[12px] font-bold text-on-accent group-hover:opacity-85 sm:inline-flex">
                    Review <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {desk.pitchCount > 0 && (
          <Link
            href="/admin/applications"
            className="flex items-start gap-3 rounded-md border border-border bg-bg p-3 transition-colors hover:border-gold/50"
          >
            <Inbox className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">
                {desk.pitchCount} pitch{desk.pitchCount === 1 ? "" : "es"} to decide
              </p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">
                {desk.pitches.map((p) => `${p.name} (${waited(p.since)})`).join(", ")}
              </p>
            </div>
          </Link>
        )}
        {desk.comments > 0 && (
          <Link
            href="/admin/comments"
            className="flex items-start gap-3 rounded-md border border-border bg-bg p-3 transition-colors hover:border-gold/50"
          >
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <div>
              <p className="text-[13px] font-semibold">
                {desk.comments} comment{desk.comments === 1 ? "" : "s"} to approve
              </p>
              <p className="mt-0.5 text-[12px] text-muted">Readers won&apos;t see them until you do.</p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
