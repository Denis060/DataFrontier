"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ExternalLink, Mail } from "lucide-react";
import { decideApplication } from "@/app/admin/applications/actions";
import { parseApplicationLinks } from "@/lib/applications";

/** Applicant-supplied text: only an http(s) URL becomes a clickable link. */
function LinkOrText({ href }: { href: string }) {
  if (!/^https?:\/\//i.test(href)) return <span className="break-all text-muted">{href}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-gold hover:underline">
      <span className="truncate">{href.replace(/^https?:\/\/(www\.)?/, "")}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden />
    </a>
  );
}

export type ApplicationRow = {
  id: string;
  bio: string;
  topics: string;
  writing_links: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  applicant: { full_name: string; slug: string | null; avatar_url?: string | null } | null;
  /** Admins only, for replying to the applicant directly. */
  email?: string | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold-dim text-gold",
  approved: "bg-teal-dim text-teal",
  rejected: "bg-red-dim text-red",
};

const label = "mb-1.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

/**
 * One application. Collapsed: who, the pitch in two lines, status and date.
 * Open: the pitch and the applicant on the left, the decision on the right
 * (stacked on phones). Pending ones start open so the decision is one click.
 */
export function ApplicationCard({ app, canApprove }: { app: ApplicationRow; canApprove: boolean }) {
  const [open, setOpen] = useState(app.status === "pending");
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
  const { republish, links } = parseApplicationLinks(app.writing_links);
  const name = app.applicant?.full_name ?? "Unknown";
  const avatar = app.applicant?.avatar_url;

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-bg2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="size-10 shrink-0 rounded-full border border-border object-cover" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-1 font-serif text-[15px] font-bold text-muted">
            {name.charAt(0)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-serif text-[17px] leading-tight font-bold">{name}</span>
            {republish && (
              <span className="rounded bg-teal-dim px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1.5px] text-teal">
                Republish
              </span>
            )}
          </span>
          {!open && <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{app.topics}</span>}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] ${STATUS_STYLE[app.status] ?? "bg-surface-2 text-muted"}`}>
            {app.status}
          </span>
          <span className="font-mono text-[11px] text-muted">{fmt(app.created_at)}</span>
        </span>
        <ChevronDown className={`mt-1 size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="grid gap-6 border-t border-border px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <p className={label}>{republish ? "The post to republish" : "The pitch"}</p>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{app.topics}</p>
            {republish && (
              <p className="mt-2 text-[13px]">
                <LinkOrText href={republish} />
              </p>
            )}

            <p className={`${label} mt-5`}>About them</p>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-muted">{app.bio}</p>

            {links.length > 0 && (
              <>
                <p className={`${label} mt-5`}>Their writing and profiles</p>
                <ul className="flex flex-col gap-1 text-[13px]">
                  {links.map((l) => (
                    <li key={l} className="min-w-0">
                      <LinkOrText href={l} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="flex flex-col gap-3 rounded-md border border-border bg-bg p-4 lg:self-start">
            {app.email && (
              <a href={`mailto:${app.email}`} className="inline-flex min-w-0 items-center gap-1.5 text-[13px] text-gold hover:underline">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{app.email}</span>
              </a>
            )}

            {decided ? (
              <div>
                <p className={label}>Decision</p>
                <p className={`inline-block rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[1.5px] ${STATUS_STYLE[app.status]}`}>
                  {app.status}
                </p>
                {app.review_note && <p className="mt-2 text-[13px] whitespace-pre-wrap text-muted">&ldquo;{app.review_note}&rdquo;</p>}
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor={`note-${app.id}`} className={`${label} block`}>
                    Note to them (optional)
                  </label>
                  <textarea
                    id={`note-${app.id}`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Included in the email: a welcome, or why it isn't a fit this time."
                    className="w-full resize-y rounded border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none focus:border-gold/40"
                  />
                </div>
                <button
                  type="button"
                  disabled={pending || !canApprove}
                  onClick={() => decide("approved")}
                  title={canApprove ? undefined : "Only an admin can approve"}
                  className="rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Approve: make them an author"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Decline ${name}'s application? They'll get a polite email${note.trim() ? " with your note" : ""}.`)) decide("rejected");
                  }}
                  className="rounded border border-red/40 px-4 py-2.5 text-[13px] font-medium text-red hover:bg-red-dim disabled:opacity-50"
                >
                  Decline
                </button>
                <p className="text-[11px] leading-snug text-muted">
                  Approving gives them a writer workspace and emails them next steps.
                </p>
                {error && <p className="text-[12px] text-red">{error}</p>}
              </>
            )}
          </aside>
        </div>
      )}
    </article>
  );
}
