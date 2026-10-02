"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteIssue,
  previewIssue,
  saveIssue,
  scheduleIssue,
  sendIssueNow,
  sendTestIssue,
  unscheduleIssue,
} from "@/app/admin/newsletter/issue-actions";
import type { ComposerSources } from "@/app/admin/newsletter/sources";
import { useUpload } from "@/components/admin/use-upload";

type SectionDef = { key: string; label: string; hint?: string; hasImage?: boolean; hasUrl?: boolean };

export type IssueDraft = {
  id: string | null;
  title: string;
  summary: string;
  status: string;
  scheduled_for: string | null;
  content: Record<string, { title?: string; text?: string; url?: string; image_url?: string }> & { intro?: string };
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

export function IssueComposer({
  issue,
  sections,
  justSaved,
  sources,
}: {
  issue: IssueDraft;
  sections: SectionDef[];
  justSaved: boolean;
  sources: ComposerSources;
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

  const [preview, setPreview] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<"phone" | "desktop">("desktop");
  const [previewing, startPreview] = useTransition();
  const [sending, startSend] = useTransition();
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const { upload, uploading, error: uploadError } = useUpload();

  const locked = ["sending", "sent"].includes(issue.status);

  /** Set an uncontrolled field's value (the form is uncontrolled by design). */
  function setField(name: string, value: string, onlyIfEmpty = false) {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el || (onlyIfEmpty && el.value.trim())) return;
    el.value = value;
  }

  /** Fill a section from one of our own articles or cheat sheets. */
  function fillFromOurs(key: string, value: string) {
    if (!value) return;
    if (key === "cheat_sheet") {
      const c = sources.cheatSheets.find((x) => x.url === value);
      if (!c) return;
      setField(`${key}_url`, c.url);
      setField(`${key}_title`, c.title);
      if (c.image) setField(`${key}_image`, c.image);
      if (c.description) setField(`${key}_text`, c.description, true);
      return;
    }
    const a = sources.articles.find((x) => x.url === value);
    if (!a) return;
    setField(`${key}_url`, a.url);
    setField(`${key}_title`, a.title);
    if (a.image) setField(`${key}_image`, a.image, true);
    if (a.excerpt) setField(`${key}_text`, a.excerpt, true);
  }

  function onPreview() {
    setError(null);
    // FormData skips disabled controls, and a sent issue's fields are all
    // disabled, so read every named field directly.
    const data = new FormData();
    for (const el of Array.from(formRef.current!.elements)) {
      const f = el as HTMLInputElement | HTMLTextAreaElement;
      if (f.name && f.type !== "file") data.append(f.name, f.value);
    }
    startPreview(async () => {
      const res = await previewIssue(data);
      if ("error" in res) setError(res.error);
      else setPreview(res.html);
    });
  }

  function onSendNow() {
    if (!issue.id) return;
    const n = sources.audience;
    const who = `${n} confirmed ${n === 1 ? "subscriber" : "subscribers"}`;
    if (!confirm(`Send "${issue.title}" now to ${who}?\n\nSave your latest edits first. This can't be undone.`)) return;
    setError(null);
    startSend(async () => {
      const res = await sendIssueNow(issue.id!);
      if ("error" in res) return setError(res.error);
      setSendMsg(
        res.remaining > 0
          ? `Sending: ${res.sent} delivered so far, ${res.remaining} queued for the next few minutes.`
          : `Sent to ${res.sent} ${res.sent === 1 ? "subscriber" : "subscribers"}.`,
      );
      router.refresh();
    });
  }

  function onDelete() {
    if (!issue.id || !confirm("Delete this draft? This can't be undone.")) return;
    startSave(async () => {
      const res = await deleteIssue(issue.id!);
      if (res?.error) setError(res.error);
    });
  }
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
            <input
              name={`${def.key}_title`}
              defaultValue={sec(def.key).title ?? ""}
              disabled={locked}
              placeholder={def.key === "closing_question" ? "The question (optional headline)" : "Headline (links to the piece when there's a link)"}
              className={`${field} mb-2 font-serif text-[15px] font-bold`}
            />
            <textarea
              name={`${def.key}_text`}
              defaultValue={sec(def.key).text ?? ""}
              rows={5}
              disabled={locked}
              placeholder={"Text. Blank line = new paragraph.\n- starts a bullet list, 1. a numbered list\n**bold**, *italic*, [link text](https://…)"}
              className={`${field} resize-y`}
            />
            {def.hasUrl && !locked && (def.key === "cheat_sheet" ? sources.cheatSheets : sources.articles).length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  fillFromOurs(def.key, e.target.value);
                  e.target.value = "";
                }}
                className={`${field} mt-2 text-[12px]`}
                aria-label={`Fill ${def.label} from one of ours`}
              >
                <option value="">
                  {def.key === "cheat_sheet" ? "Use one of our cheat sheets…" : "Use one of our articles…"}
                </option>
                {(def.key === "cheat_sheet" ? sources.cheatSheets : sources.articles).map((o) => (
                  <option key={o.url} value={o.url}>
                    {o.title}
                  </option>
                ))}
              </select>
            )}
            {def.hasUrl && (
              <input name={`${def.key}_url`} defaultValue={sec(def.key).url ?? ""} disabled={locked} placeholder="Link URL (optional)" className={`${field} mt-2 font-mono text-[12px]`} />
            )}
            {def.hasImage && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input name={`${def.key}_image`} defaultValue={sec(def.key).image_url ?? ""} disabled={locked} placeholder="Image URL (optional)" className={`${field} min-w-0 flex-1 font-mono text-[12px]`} />
                {!locked && (
                  <label className="cursor-pointer rounded border border-border px-3 py-2 text-[12px] whitespace-nowrap hover:border-border-strong hover:bg-surface-1">
                    {uploading ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        const url = await upload(file, "article-images");
                        if (url) setField(`${def.key}_image`, url);
                      }}
                    />
                  </label>
                )}
                {uploadError && <p className="w-full text-[12px] text-red">{uploadError}</p>}
              </div>
            )}
          </fieldset>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          {!locked && (
            <button type="submit" disabled={saving} className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
              {saving ? "Saving…" : "Save draft"}
            </button>
          )}
          <button type="button" onClick={onPreview} disabled={previewing} className="rounded border border-border px-5 py-2.5 text-[13px] font-semibold hover:border-border-strong hover:bg-surface-1 disabled:opacity-60">
            {previewing ? "Rendering…" : "Preview email"}
          </button>
          {issue.id && issue.status === "draft" && (
            <button type="button" onClick={onDelete} className="ml-auto text-[12px] text-red hover:underline">
              Delete draft
            </button>
          )}
        </div>
      </form>

      {preview !== null && (
        <div
          role="dialog"
          aria-label="Email preview"
          className="fixed inset-0 z-[200] flex flex-col bg-black/60 p-3 sm:p-6"
          onClick={() => setPreview(null)}
        >
          <div className="mx-auto flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-lg bg-bg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-muted">Preview, as subscribers see it</p>
              <div className="ml-auto flex gap-1 text-[12px]">
                {(["desktop", "phone"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setPreviewWidth(w)}
                    className={`rounded px-2.5 py-1 ${previewWidth === w ? "bg-gold-dim font-semibold text-gold" : "text-muted hover:text-ink"}`}
                  >
                    {w === "desktop" ? "Desktop" : "Phone"}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setPreview(null)} className="text-[13px] font-semibold text-muted hover:text-ink">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-surface-2 p-3">
              <iframe
                title="Email preview"
                // Links open in a new tab, like a mail client; without this they
                // loaded the whole site inside the frame, unstyled.
                srcDoc={preview.replace("<head>", '<head><base target="_blank">')}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                className={`mx-auto block h-full min-h-[70vh] w-full rounded border border-border bg-white ${previewWidth === "phone" ? "max-w-[390px]" : ""}`}
              />
            </div>
          </div>
        </div>
      )}

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
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onSendNow}
              disabled={sending}
              className="rounded border border-gold/50 px-4 py-2 text-[13px] font-bold text-gold hover:bg-gold-dim disabled:opacity-60"
            >
              {sending
                ? "Sending…"
                : `Send now to ${sources.audience} ${sources.audience === 1 ? "subscriber" : "subscribers"}`}
            </button>
            <span className="text-[11px] text-muted">Asks you to confirm first.</span>
          </div>
          {sendMsg && <p className="mt-2 text-[12px] text-teal">{sendMsg}</p>}
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
