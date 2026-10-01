"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { applyToWrite, type ApplyState } from "@/app/write/actions";
import { Honeypot } from "@/components/honeypot";

const field =
  "w-full rounded border border-border bg-surface-1 px-3.5 py-3 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

// A signed-out visitor fills the form first; it's parked here while they
// create an account, then restored when /signup sends them back.
const DRAFT_KEY = "df-write-draft";
const FIELDS = ["kind", "original_url", "bio", "topics", "writing_links"] as const;

const KINDS = [
  { value: "new", title: "Pitch a new piece", hint: "An idea you want to write for us." },
  { value: "republish", title: "Republish my post", hint: "Something already on your blog or Medium." },
];

export function WriteForm({ signedIn, isReader }: { signedIn: boolean; isReader: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToWrite, null);

  // Restore a parked draft straight into the fields (they're uncontrolled).
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, string>;
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
    } catch {}
  }, []);

  useEffect(() => {
    if (state?.ok) {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
    }
  }, [state]);

  if (signedIn && !isReader) {
    return (
      <p className="rounded border border-teal/30 bg-teal-dim px-5 py-6 text-sm text-teal">
        You already have contributor access.{" "}
        <Link href="/admin/articles/new" className="underline">
          Write an article →
        </Link>
      </p>
    );
  }

  if (state?.ok) {
    return (
      <p className="rounded border border-teal/30 bg-teal-dim px-5 py-6 text-sm text-teal">
        {state.message}
      </p>
    );
  }

  function park(form: HTMLFormElement, to: string) {
    const data = new FormData(form);
    const draft: Record<string, string> = {};
    for (const name of FIELDS) draft[name] = String(data.get(name) ?? "");
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
    router.push(to);
  }

  return (
    <form
      ref={formRef}
      action={signedIn ? action : undefined}
      onSubmit={
        signedIn
          ? undefined
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
  );
}
