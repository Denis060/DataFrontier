"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSubscriber, resendConfirmation, unsubscribe } from "@/app/admin/newsletter/subscribers/actions";

type Row = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  created_at: string;
  confirmed_at: string | null;
};

const FILTERS = ["all", "confirmed", "pending", "unsubscribed"] as const;
const PAGE = 50;

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-teal-dim text-teal",
  pending: "bg-gold-dim text-gold",
  unsubscribed: "bg-surface-2 text-muted line-through",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";

function toCsv(rows: Row[]): string {
  const head = ["email", "status", "source", "subscribed", "confirmed"];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map((r) =>
    [r.email, r.status, r.source ?? "", r.created_at, r.confirmed_at ?? ""].map((v) => esc(String(v))).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

export function SubscribersList({ subscribers, initialFilter }: { subscribers: Row[]; initialFilter?: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(
    (FILTERS as readonly string[]).includes(initialFilter ?? "") ? (initialFilter as (typeof FILTERS)[number]) : "all",
  );
  const [q, setQ] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: subscribers.length };
    for (const f of FILTERS) if (f !== "all") c[f] = subscribers.filter((s) => s.status === f).length;
    return c;
  }, [subscribers]);

  const filtered = useMemo(() => {
    const base = filter === "all" ? subscribers : subscribers.filter((s) => s.status === filter);
    const s = q.trim().toLowerCase();
    if (!s) return base;
    return base.filter((r) => r.email.toLowerCase().includes(s) || (r.source ?? "").toLowerCase().includes(s));
  }, [subscribers, filter, q]);

  const shown = filtered.slice(0, limit);

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
            className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              filter === f ? "border-gold bg-gold text-on-accent" : "border-border bg-bg2 text-muted hover:text-ink"
            }`}
          >
            {f} <span className="opacity-70">{counts[f] ?? 0}</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search email or source"
          className="ml-auto w-full max-w-[220px] rounded border border-border bg-surface-1 px-3 py-1.5 text-[13px] outline-none focus:border-gold/40 sm:w-auto"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="rounded border border-border px-3 py-1.5 text-[12px] font-semibold text-muted hover:border-border-strong hover:bg-surface-1 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {message && <p className="rounded border border-teal/30 bg-teal-dim px-3 py-2 text-[13px] text-teal">{message}</p>}

      {filtered.length === 0 ? (
        <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
          {q.trim() ? "No subscribers match your search." : "No subscribers yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-border bg-bg2 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((r) => (
                <tr key={r.id} className="hover:bg-surface-1">
                  <td className="px-4 py-3 text-[13px]">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1px] ${STATUS_STYLE[r.status] ?? "bg-surface-2 text-muted"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">{r.source ?? "-"}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActions row={r} onMessage={setMessage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

/** Per-subscriber actions; destructive ones ask first. */
function RowActions({ row, onMessage }: { row: Row; onMessage: (m: string | null) => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error: string } | { ok: true; message: string }>, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const r = await fn();
      onMessage("error" in r ? r.error : r.message);
      router.refresh();
    });
  };
  const btn = "text-[12px] font-semibold transition-colors disabled:opacity-50";
  return (
    <span className="inline-flex flex-wrap justify-end gap-3 whitespace-nowrap">
      {row.status === "pending" && (
        <button type="button" disabled={pending} onClick={() => run(() => resendConfirmation(row.id))} className={`${btn} text-gold hover:underline`}>
          Resend confirmation
        </button>
      )}
      {row.status !== "unsubscribed" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => unsubscribe(row.id), `Stop sending the newsletter to ${row.email}?`)}
          className={`${btn} text-muted hover:text-ink`}
        >
          Unsubscribe
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => deleteSubscriber(row.id), `Delete ${row.email} and their history? This can't be undone.`)}
        className={`${btn} text-red hover:underline`}
      >
        Delete
      </button>
    </span>
  );
}
