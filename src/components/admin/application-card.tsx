"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { decideApplication } from "@/app/admin/applications/actions";

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

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold-dim text-gold",
  approved: "bg-teal-dim text-teal",
  rejected: "bg-red-dim text-red",
};

export function ApplicationCard({
  app,
  canApprove,
  defaultOpen = false,
}: {
  app: App;
  canApprove: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function decide(decision: "approved" | "rejected") {
    setError(null);
    start(async () => {
      const res = await decideApplication(app.id, decision, note);
      if ("error" in res) setError(res.error);
    });
  }

  const decided = app.status !== "pending";

  return (
    <div className="rounded-md border border-border bg-bg2">
      {/* Collapsed header — the only thing shown until you open it. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="font-serif text-[15px] font-bold">{app.applicant?.full_name ?? "Unknown"}</span>
          <span className="ml-2 truncate text-[12px] text-muted">· {app.topics}</span>
        </span>
        <span
          className={`hidden shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] sm:inline ${
            STATUS_STYLE[app.status] ?? "bg-surface-2 text-muted"
          }`}
        >
          {app.status}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-muted">{fmt(app.created_at)}</span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-[13px] leading-relaxed text-muted">{app.bio}</p>
          <p className="mt-2 text-[13px]">
            <span className="text-muted">Topics: </span>
            {app.topics}
          </p>
          {app.writing_links && (
            <p className="mt-1 truncate text-[12px]">
              <a href={app.writing_links} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                {app.writing_links}
              </a>
            </p>
          )}

          {decided ? (
            <p
              className={`mt-4 inline-block rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[1.5px] ${
                app.status === "approved" ? "bg-teal-dim text-teal" : "bg-red-dim text-red"
              }`}
            >
              {app.status}
              {app.review_note && <span className="ml-2 lowercase opacity-80">· {app.review_note}</span>}
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional, shown on rejection)"
                className="w-full rounded border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none focus:border-gold/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || !canApprove}
                  onClick={() => decide("approved")}
                  title={canApprove ? undefined : "Only an admin can approve"}
                  className="rounded bg-gold px-3.5 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-50"
                >
                  Approve &amp; promote
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => decide("rejected")}
                  className="rounded border border-red/40 px-3.5 py-2 text-[13px] font-medium text-red hover:bg-red-dim disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
              {error && <p className="text-[12px] text-red">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
