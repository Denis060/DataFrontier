"use client";

import { useActionState } from "react";
import Link from "next/link";
import { applyToWrite, type ApplyState } from "@/app/write/actions";

const field =
  "w-full rounded border border-border bg-surface-1 px-3.5 py-3 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

export function WriteForm({ signedIn, isReader }: { signedIn: boolean; isReader: boolean }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyToWrite, null);

  if (!signedIn) {
    return (
      <p className="rounded border border-border bg-bg2 px-5 py-6 text-sm text-muted">
        <Link href="/login?next=/write" className="text-gold hover:underline">
          Sign in
        </Link>{" "}
        or{" "}
        <Link href="/signup?next=/write" className="text-gold hover:underline">
          create a free account
        </Link>{" "}
        to apply.
      </p>
    );
  }

  if (!isReader) {
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

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <label className={label} htmlFor="bio">
          About you
        </label>
        <textarea id="bio" name="bio" rows={4} required placeholder="Your background and what you do." className={`${field} resize-none`} />
      </div>
      <div>
        <label className={label} htmlFor="topics">
          Topics you want to cover
        </label>
        <input id="topics" name="topics" required placeholder="e.g. agentic systems, MLOps, AI in Africa" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="writing_links">
          Writing samples or portfolio (optional)
        </label>
        <input id="writing_links" name="writing_links" placeholder="https://…" className={`${field} font-mono text-[12px]`} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-gold px-5 py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>

      {state && !state.ok && <p className="text-[13px] text-red">{state.message}</p>}
    </form>
  );
}
