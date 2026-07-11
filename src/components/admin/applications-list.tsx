"use client";

import { useMemo, useState } from "react";
import { ApplicationCard } from "@/components/admin/application-card";

type App = {
  id: string;
  bio: string;
  topics: string;
  writing_links: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  applicant: { full_name: string; slug: string | null } | null;
};

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

const PAGE = 25;

export function ApplicationsList({ apps, canApprove }: { apps: App[]; canApprove: boolean }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("pending");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(
    () => ({
      pending: apps.filter((a) => a.status === "pending").length,
      approved: apps.filter((a) => a.status === "approved").length,
      rejected: apps.filter((a) => a.status === "rejected").length,
      all: apps.length,
    }),
    [apps],
  );

  const filtered = useMemo(() => {
    const base = filter === "all" ? apps : apps.filter((a) => a.status === filter);
    const s = q.trim().toLowerCase();
    if (!s) return base;
    return base.filter(
      (a) =>
        (a.applicant?.full_name ?? "").toLowerCase().includes(s) ||
        a.topics.toLowerCase().includes(s) ||
        a.bio.toLowerCase().includes(s),
    );
  }, [apps, filter, q]);

  const shown = filtered.slice(0, limit);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                setLimit(PAGE);
              }}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                active
                  ? "border-gold bg-gold text-on-accent"
                  : "border-border bg-bg2 text-muted hover:text-ink"
              }`}
            >
              {f.label} <span className="opacity-70">{counts[f.key]}</span>
            </button>
          );
        })}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search name or topic"
          className="ml-auto w-full max-w-[220px] rounded border border-border bg-surface-1 px-3 py-1.5 text-[13px] outline-none focus:border-gold/40 sm:w-auto"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
          {q.trim() ? "No applications match your search." : "Nothing here."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((a) => (
            <ApplicationCard key={a.id} app={a} canApprove={canApprove} />
          ))}
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
