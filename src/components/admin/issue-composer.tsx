"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveIssue, scheduleIssue, unscheduleIssue, sendTestIssue } from "@/app/admin/newsletter/issue-actions";

type SectionDef = { key: string; label: string; hint?: string; hasImage?: boolean; hasUrl?: boolean };

export type IssueDraft = {
  id: string | null;
  title: string;
  summary: string;
  status: string;
  scheduled_for: string | null;
  content: Record<string, { text?: string; url?: string; image_url?: string }> & { intro?: string };
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

export function IssueComposer({
  issue,
  sections,
  justSaved,
}: {
  issue: IssueDraft;
  sections: SectionDef[];
  justSaved: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, startSave] = useTransition();
  const [scheduling, startSchedule] = useTransition();
  const [testing, startTest] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [when, setWhen] = useState(
    issue.scheduled_for ? toLocalInput(issue.scheduled_for) : "",
  );

  const locked = ["sending", "sent"].includes(issue.status);
  const scheduled = issue.status === "scheduled";

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const data = new FormData(formRef.current!);
    startSave(async () => {
      const res = await saveIssue(data);
      if (res?.error) setError(res.error);
    });
  }

  function onSchedule() {
    if (!issue.id) {
      setError("Save the issue first, then schedule it.");
      return;
    }
    setError(null);
    startSchedule(async () => {
      // datetime-local is local time; convert to an absolute instant.
      const iso = when ? new Date(when).toISOString() : "";
      const res = await scheduleIssue(issue.id!, iso);
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  function onUnschedule() {
    startSchedule(async () => {
      const res = await unscheduleIssue(issue.id!);
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  function onTest() {
    if (!issue.id) {
      setError("Save the issue first, then send a test.");
      return;
    }
    setError(null);
    setTestMsg(null);
    startTest(async () => {
      const res = await sendTestIssue(issue.id!, testEmail);
      if ("error" in res) setError(res.error);
      else
        setTestMsg(
          res.skipped
            ? `Mock only, no RESEND_API_KEY set, so nothing was delivered to ${res.to}.`
            : `Test sent to ${res.to}. Check inbox, spam, and how it renders on a phone.`,
        );
    });
  }

  const sec = (key: string) => issue.content?.[key] ?? {};

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/newsletter" className="text-[13px] text-muted hover:text-ink">
          ← Newsletter
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-[3px] bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
            {issue.status}
          </span>
          {justSaved && <span className="text-[12px] text-teal">Saved</span>}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red/30 bg-red-dim px-3 py-2 text-[13px] text-red">{error}</p>
      )}

      {locked && (
        <p className="mb-4 rounded border border-border bg-surface-1 px-3 py-2 text-[13px] text-muted">
          This issue is {issue.status} and can no longer be edited.
        </p>
      )}

      {!locked && (
        <div className="mb-5 rounded-md border border-gold/25 bg-gold-dim px-4 py-3 text-[12px] leading-relaxed text-gold">
          <strong>How to fill this:</strong> the title + summary become the subject and inbox preview.
          The intro is your hello. Then fill the six sections below, every one is optional, so use
          what you have. Each has a tip under its label. Save a draft anytime, send a test to yourself,
          then schedule when it&apos;s ready.
        </div>
      )}

      <form ref={formRef} onSubmit={onSave} className="flex flex-col gap-5">
        {issue.id && <input type="hidden" name="id" value={issue.id} />}

        <div>
          <label className={label} htmlFor="title">Issue title *</label>
          <input id="title" name="title" defaultValue={issue.title} required disabled={locked} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="summary">Summary / preview line</label>
          <textarea id="summary" name="summary" defaultValue={issue.summary} rows={2} disabled={locked} className={`${field} resize-none`} />
        </div>
        <div>
          <label className={label} htmlFor="intro">Intro (optional)</label>
          <textarea id="intro" name="intro" defaultValue={issue.content?.intro ?? ""} rows={2} disabled={locked} className={`${field} resize-none`} />
        </div>

        {sections.map((def) => (
          <fieldset key={def.key} className="rounded-md border border-border p-4">
            <legend className="px-1 font-mono text-[10px] uppercase tracking-[1.5px] text-gold">{def.label}</legend>
            {def.hint && <p className="mb-2 text-[12px] leading-relaxed text-muted">{def.hint}</p>}
            <textarea
              name={`${def.key}_text`}
              defaultValue={sec(def.key).text ?? ""}
              rows={3}
              disabled={locked}
              placeholder="Text (supports **bold**, *italic*)"
              className={`${field} resize-none`}
            />
            {def.hasUrl && (
              <input name={`${def.key}_url`} defaultValue={sec(def.key).url ?? ""} disabled={locked} placeholder="Link URL (optional)" className={`${field} mt-2 font-mono text-[12px]`} />
            )}
            {def.hasImage && (
              <input name={`${def.key}_image`} defaultValue={sec(def.key).image_url ?? ""} disabled={locked} placeholder="Image URL (optional)" className={`${field} mt-2 font-mono text-[12px]`} />
            )}
          </fieldset>
        ))}

        {!locked && (
          <button type="submit" disabled={saving} className="self-start rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
            {saving ? "Saving…" : "Save draft"}
          </button>
        )}
      </form>

      {/* Test send — available in any state, including after sending */}
      {issue.id && (
        <div className="mt-8 rounded-md border border-border bg-bg2 p-5">
          <p className={label}>Send a test</p>
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${field} w-auto min-w-[220px]`}
            />
            <button type="button" onClick={onTest} disabled={testing} className="rounded border border-border px-4 py-2 text-[13px] font-bold hover:border-border-strong hover:bg-surface-1 disabled:opacity-50">
              {testing ? "Sending…" : "Send test"}
            </button>
          </div>
          {testMsg && <p className="mt-2 text-[12px] text-teal">{testMsg}</p>}
          <p className="mt-2 text-[11px] text-muted">
            Goes only to this address, never the subscriber list. Save your latest edits first.
          </p>
        </div>
      )}

      {/* Scheduling */}
      {issue.id && !locked && (
        <div className="mt-8 rounded-md border border-border bg-bg2 p-5">
          <p className={label}>Schedule</p>
          {scheduled ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[13px]">
                Scheduled for{" "}
                <span className="font-semibold">
                  {issue.scheduled_for && new Date(issue.scheduled_for).toLocaleString()}
                </span>
              </p>
              <button type="button" onClick={onUnschedule} disabled={scheduling} className="rounded border border-border px-3 py-1.5 text-[12px] hover:border-border-strong hover:bg-surface-1 disabled:opacity-50">
                Unschedule
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className={`${field} w-auto`}
              />
              <button type="button" onClick={onSchedule} disabled={scheduling} className="rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
                Schedule
              </button>
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted">
            Save your latest edits before scheduling. Times are your local timezone.
          </p>
        </div>
      )}
    </div>
  );
}

/** ISO → value for <input type="datetime-local"> in the viewer's local time. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
