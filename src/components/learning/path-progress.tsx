"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useReadSlugs } from "./read-history";

/** "2 of 6 read" for a path card. Nothing until the reader has started. */
export function PathBadge({ slugs }: { slugs: string[] }) {
  const read = useReadSlugs();
  const done = slugs.filter((s) => read.has(s)).length;
  if (done === 0) return null;
  const all = done === slugs.length;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1px] ${all ? "bg-teal text-white" : "bg-teal-dim text-teal"}`}>
      {all && <Check className="size-3" aria-hidden />}
      {all ? "Completed" : `${done} of ${slugs.length} read`}
    </span>
  );
}

/** Progress bar plus the next step: start, continue, or read again. */
export function PathProgress({ slugs, titles }: { slugs: string[]; titles: string[] }) {
  const read = useReadSlugs();
  const done = slugs.filter((s) => read.has(s)).length;
  const nextIdx = slugs.findIndex((s) => !read.has(s));
  const pct = Math.round((done / Math.max(1, slugs.length)) * 100);
  const target = nextIdx === -1 ? 0 : nextIdx;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
          <span className="font-semibold">{done === 0 ? "Not started" : nextIdx === -1 ? "Completed" : `${done} of ${slugs.length} read`}</span>
          <span className="font-mono text-muted">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link
        href={`/article/${slugs[target]}`}
        className="inline-flex items-center justify-center rounded bg-gold px-5 py-3 text-[14px] font-bold text-on-accent hover:opacity-85"
      >
        {done === 0 ? "Start with part 1 →" : nextIdx === -1 ? "Read it again →" : `Continue with part ${nextIdx + 1} →`}
      </Link>
      {done > 0 && nextIdx !== -1 && <p className="text-[12px] leading-snug text-muted">Next: {titles[nextIdx]}</p>}
      <p className="text-[11px] text-muted">Progress is saved on this device.</p>
    </div>
  );
}

/** A part's number, or a tick once it's been read. */
export function PartMarker({ slug, n }: { slug: string; n: number }) {
  const read = useReadSlugs().has(slug);
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-[13px] font-semibold ${
        read ? "border-teal bg-teal text-white" : "border-border bg-bg text-gold"
      }`}
      aria-label={read ? `Part ${n}, read` : `Part ${n}`}
    >
      {read ? <Check className="size-4" aria-hidden /> : n}
    </span>
  );
}
