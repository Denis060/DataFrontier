"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { saveSeries, deleteSeries } from "@/app/admin/series/actions";

export type Series = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sort_order: number;
  count: number;
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

function Fields({ series, onSaved }: { series?: Series; onSaved?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const data = new FormData(formRef.current!);
    startSave(async () => {
      const res = await saveSeries(data);
      if ("error" in res) setMsg({ ok: false, text: res.error });
      else {
        setMsg({ ok: true, text: "Saved." });
        onSaved?.();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSave} className="border-t border-border px-4 py-4">
      {series && <input type="hidden" name="id" value={series.id} />}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={label}>Title *</label>
          <input name="title" defaultValue={series?.title ?? ""} required className={field} />
        </div>
        <div className="w-20 shrink-0">
          <label className={label}>Order</label>
          <input name="sort_order" type="number" defaultValue={series?.sort_order ?? 0} className={field} />
        </div>
      </div>
      <div className="mt-3">
        <label className={label}>Description</label>
        <textarea name="description" rows={2} defaultValue={series?.description ?? ""} className={`${field} resize-none`} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={saving} className="rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        {series && (
          <>
            <Link href={`/series/${series.slug}`} className="text-[12px] text-muted hover:text-gold" target="_blank">
              View path ↗
            </Link>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (confirm(`Delete “${series.title}”? Articles stay, they're just unlinked.`)) startDelete(() => deleteSeries(series.id));
              }}
              className="inline-flex items-center gap-1.5 rounded border border-red/40 px-3 py-2 text-[12px] text-red hover:bg-red-dim disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </>
        )}
        {msg && <span className={`text-[12px] ${msg.ok ? "text-teal" : "text-red"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

function Row({ series }: { series: Series }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border bg-bg2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        <span className="min-w-0 flex-1 truncate font-serif text-[15px] font-bold">{series.title}</span>
        <span className="shrink-0 font-mono text-[11px] text-muted">{series.count} {series.count === 1 ? "part" : "parts"}</span>
      </button>
      {open && <Fields series={series} />}
    </div>
  );
}

export function SeriesManager({ series }: { series: Series[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col gap-2.5">
      {series.map((s) => (
        <Row key={s.id} series={s} />
      ))}
      {adding ? (
        <div className="rounded-md border border-gold/30 bg-bg2">
          <p className="px-4 pt-3 font-mono text-[10px] uppercase tracking-[1.5px] text-gold">New learning path</p>
          <Fields onSaved={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 self-start rounded border border-dashed border-border px-4 py-2.5 text-[13px] font-medium text-muted hover:border-border-strong hover:text-ink"
        >
          <Plus className="size-4" /> New learning path
        </button>
      )}
    </div>
  );
}
