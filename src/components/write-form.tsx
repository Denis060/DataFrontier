"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { applyToWrite, type ApplyState } from "@/app/write/actions";
import { Honeypot } from "@/components/honeypot";
import { DRAFT_KEY } from "@/lib/write-draft";

const field =
  "w-full rounded border border-border bg-surface-1 px-3.5 py-3 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

// A signed-out visitor fills the form first; it's parked here while they
// create an account, then restored when /signup sends them back. localStorage,
// not sessionStorage: the email-confirmation link usually opens a new tab.
const FIELDS = ["kind", "original_url", "bio", "topics", "writing_links"] as const;

const KINDS = [
  { value: "new", title: "Pitch a new piece", hint: "An idea you want to write for us." },
  { value: "republish", title: "Republish my post", hint: "Something already on your blog or Medium." },
];

type Draft = Partial<Record<(typeof FIELDS)[number], string>>;

/** Put saved values back into the (uncontrolled) fields. */
function fill(form: HTMLFormElement, draft: Draft) {
  for (const name of FIELDS) {
    const value = draft[name];
    if (!value) continue;
    if (name === "kind") {
      const radio = form.querySelector<HTMLInputElement>(`input[name="kind"][value="${value === "republish" ? "republish" : "new"}"]`);
      if (radio) radio.checked = true;
    } else {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) el.value = value;
    }
  }
}

function read(form: HTMLFormElement): Draft {
  const data = new FormData(form);
  const draft: Draft = {};
  for (const name of FIELDS) draft[name] = String(data.get(name) ?? "");
  return draft;
}

type Application = { status: string; created_at: string; review_note: string | null } | null;

// Fixed locale and zone so the server and browser render the same text.
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

const card = "rounded-md border px-5 py-5 text-[14px] leading-relaxed";

export function WriteForm({
  signedIn,
  isReader,
  application = null,
  authorSlug = null,
  savedDraft = null,
}: {
  signedIn: boolean;
  isReader: boolean;
  application?: Application;
  authorSlug?: string | null;
  /** The pitch saved with the account at sign-up, for when the confirmation
   *  link opens in another browser and localStorage is empty. */
  savedDraft?: Draft | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToWrite, null);
  // React resets a form after every action, even a failed one; keep what was
  // sent so a validation error doesn't wipe the pitch.
  const sent = useRef<Draft | null>(null);

  // Restore a parked draft straight into the fields (they're uncontrolled).
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    let draft: Draft | null = savedDraft;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) draft = JSON.parse(raw) as Draft;
    } catch {}
    if (draft) fill(form, draft);
    // Only on mount: later changes to savedDraft must not overwrite typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.ok) {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
    } else if (state && sent.current && formRef.current) {
      // Wait for React's reset to land, then put the values back.
      const form = formRef.current;
      const draft = sent.current;
      requestAnimationFrame(() => fill(form, draft));
    }
  }, [state]);

  // Already a contributor: point them at the next useful thing, not a form.
  if (signedIn && !isReader) {
    return (
      <div className={`${card} border-teal/30 bg-teal-dim`}>
        <p className="font-serif text-lg font-black text-ink">You&apos;re already one of our writers.</p>
        <p className="mt-1 text-muted">Pick up where you left off.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/admin/articles/new" className="rounded bg-gold px-4 py-2.5 text-center text-[13px] font-bold text-on-accent hover:opacity-85">
            Start a new draft →
          </Link>
          <Link href="/account" className="rounded border border-border bg-bg px-4 py-2.5 text-center text-[13px] font-semibold hover:border-border-strong">
            Update your photo, bio and links
          </Link>
          {authorSlug && (
            <Link href={`/author/${authorSlug}`} className="text-center text-[13px] text-gold hover:underline">
              See your author page →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Sent just now, or still waiting from an earlier visit.
  if (state?.ok || application?.status === "pending") {
    return (
      <div className={`${card} border-gold/30 bg-gold-dim`} aria-live="polite">
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">
          {state?.ok ? "Pitch sent" : `Under review since ${fmtDay(application!.created_at)}`}
        </p>
        <p className="mt-2 font-serif text-lg font-black text-ink">Thank you. A real person will read it.</p>
        <p className="mt-1 text-muted">
          {state?.ok ? "A confirmation is on its way to your inbox. " : ""}
          If it&apos;s a fit, you&apos;ll get an author account and an email with next steps. Want
          to add something? Reply to the confirmation email.
        </p>
        <Link href="/" className="mt-4 inline-block text-[13px] text-gold hover:underline">
          Keep reading in the meantime →
        </Link>
      </div>
    );
  }

  function park(form: HTMLFormElement, to: string) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(read(form)));
    } catch {}
    router.push(to);
  }

  return (
    <>
      {application?.status === "rejected" && (
        <div className={`${card} mb-6 border-border bg-bg`}>
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted">
            Your pitch from {fmtDay(application.created_at)}
          </p>
          <p className="mt-2 font-semibold text-ink">It wasn&apos;t the right fit that time.</p>
          {application.review_note && <p className="mt-1 text-muted">&ldquo;{application.review_note}&rdquo;</p>}
          <p className="mt-2 text-muted">A different angle is always welcome. Send a new one below.</p>
        </div>
      )}
      <form
        ref={formRef}
        action={signedIn ? action : undefined}
        onSubmit={
          signedIn
            ? (e) => {
                sent.current = read(e.currentTarget);
              }
            : (e) => {
                e.preventDefault();
                park(e.currentTarget, "/signup?next=/write");
              }
        }
        // The republish field shows via CSS when that option is checked, so the
        // choice needs no React state.
        className="group/write flex flex-col gap-5"
      >
        <Honeypot />

        <fieldset>
          <legend className={label}>What would you like to do?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {KINDS.map((o) => (
              <label
                key={o.value}
                className="cursor-pointer rounded border border-border bg-surface-1 px-4 py-3 text-sm transition-colors hover:border-border-strong has-[:checked]:border-gold/50 has-[:checked]:bg-gold-dim has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/40"
              >
                <input
                  type="radio"
                  name="kind"
                  value={o.value}
                  defaultChecked={o.value === "new"}
                  className="sr-only"
                />
                <span className="block font-semibold">{o.title}</span>
                <span className="mt-0.5 block text-[12px] text-muted">{o.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="hidden group-has-[input[value=republish]:checked]/write:block">
          <label className={label} htmlFor="original_url">
            Link to the post
          </label>
          <input
            id="original_url"
            name="original_url"
            type="url"
            placeholder="https://yourblog.com/the-post"
            className={`${field} font-mono text-[12px]`}
          />
          <p className="mt-1.5 text-[12px] text-muted">
            It stays yours. The republished copy points search engines back to the original.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="bio">
            About you
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            required
            placeholder="What you do and what you have built or studied."
            className={`${field} resize-none`}
          />
        </div>
        <div>
          <label className={label} htmlFor="topics">
            Your idea, or what the post is about
          </label>
          <input
            id="topics"
            name="topics"
            required
            placeholder="e.g. evaluating RAG pipelines on real support tickets"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="writing_links">
            Other writing, GitHub or portfolio (optional)
          </label>
          <input
            id="writing_links"
            name="writing_links"
            placeholder="https://…"
            className={`${field} font-mono text-[12px]`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-gold px-5 py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {pending ? "Submitting…" : signedIn ? "Submit application" : "Continue: create a free account →"}
          </button>
          {!signedIn && (
            <span className="text-[13px] text-muted">
              Have an account?{" "}
              <button
                type="button"
                onClick={(e) => e.currentTarget.form && park(e.currentTarget.form, "/login?next=/write")}
                className="text-gold hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
        {!signedIn && (
          <p className="-mt-2 text-[12px] text-muted">
            We keep what you typed. After signing up you come straight back here to send it.
          </p>
        )}
        {state && !state.ok && <p className="text-[13px] text-red">{state.message}</p>}
      </form>
    </>
  );
}
