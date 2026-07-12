"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";

type Row = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  author: { full_name: string; slug: string | null } | null;
  category: { name: string } | null;
};

const FILTERS = ["all", "draft", "in_review", "changes_requested", "published", "archived"] as const;
const PAGE = 25;

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function ArticlesList({ articles }: { articles: Row[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: articles.length };
    for (const f of FILTERS) if (f !== "all") c[f] = articles.filter((a) => a.status === f).length;
    return c;
  }, [articles]);

  const filtered = useMemo(() => {
    const base = filter === "all" ? articles : articles.filter((a) => a.status === filter);
    const s = q.trim().toLowerCase();
    if (!s) return base;
    return base.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        (a.author?.full_name ?? "").toLowerCase().includes(s) ||
        (a.category?.name ?? "").toLowerCase().includes(s),
    );
  }, [articles, filter, q]);

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
            {f.replace(/_/g, " ")} <span className="opacity-60">{counts[f] ?? 0}</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search title, author"
          className="ml-auto w-full max-w-[220px] rounded border border-border bg-surface-1 px-3 py-1.5 text-[13px] outline-none focus:border-gold/40 sm:w-auto"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
          {q.trim() ? "No articles match your search." : "Nothing here."}
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {shown.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/articles/${a.id}`} className="flex items-center gap-4 py-4 transition-colors hover:bg-surface-1">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[15px] font-bold">{a.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {a.author?.full_name}
                    {a.category && ` · ${a.category.name}`} · edited {fmt(a.updated_at)}
                  </p>
                </div>
                <StatusBadge status={a.status as never} />
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
