"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  issue_number: number;
  title: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  recipients: number | null;
};

const FILTERS = ["all", "draft", "scheduled", "sending", "sent", "failed"] as const;
const PAGE = 25;

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-surface-2 text-muted",
  scheduled: "bg-gold-dim text-gold",
  sending: "bg-teal-dim text-teal",
  sent: "bg-teal-dim text-teal",
  failed: "bg-red-dim text-red",
  canceled: "bg-surface-1 text-muted line-through",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export function NewsletterList({ issues }: { issues: Row[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: issues.length };
    for (const f of FILTERS) if (f !== "all") c[f] = issues.filter((i) => i.status === f).length;
    return c;
  }, [issues]);

  const filtered = useMemo(() => {
    const base = filter === "all" ? issues : issues.filter((i) => i.status === filter);
    const s = q.trim().toLowerCase();
    if (!s) return base;
    return base.filter((i) => i.title.toLowerCase().includes(s) || String(i.issue_number).includes(s));
  }, [issues, filter, q]);

  const shown = filtered.slice(0, limit);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFilter(f);
              setLimit(PAGE);
            }}
            className={`rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-[1px] transition-colors ${
              filter === f ? "bg-gold-dim text-gold" : "text-muted hover:bg-surface-1 hover:text-ink"
            }`}
          >
            {f} <span className="opacity-60">{counts[f] ?? 0}</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search issues"
          className="ml-auto w-full max-w-[200px] rounded border border-border bg-surface-1 px-3 py-1.5 text-[13px] outline-none focus:border-gold/40 sm:w-auto"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
          {q.trim() ? "No issues match your search." : "Nothing here."}
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {shown.map((i) => (
            <li key={i.id}>
              <Link href={`/admin/newsletter/${i.id}`} className="flex flex-wrap items-center gap-3 py-4 hover:bg-surface-1">
                <span className="font-mono text-[11px] text-muted">#{String(i.issue_number).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate font-serif text-[15px] font-bold">{i.title}</span>
                {i.status === "scheduled" && <span className="font-mono text-[11px] text-muted">for {fmt(i.scheduled_for)}</span>}
                {i.status === "sent" && <span className="font-mono text-[11px] text-muted">{i.recipients ?? 0} sent</span>}
                <span className={`rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] ${STATUS_STYLE[i.status] ?? STATUS_STYLE.draft}`}>
                  {i.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="self-center rounded border border-border px-4 py-2 text-[13px] font-medium text-muted hover:border-border-strong hover:bg-surface-1"
        >
          Show more ({filtered.length - limit})
        </button>
      )}
    </div>
  );
}
