"use client";

import { useActionState, useEffect } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";
import { Honeypot } from "@/components/honeypot";

/**
 * A calm, in-article invitation to subscribe — no pop-up, no gate, just a box a
 * reader can use if they want to. Reuses the real double-opt-in action, and
 * marks the shared flag on success so the floating prompt stays quiet.
 */
export function InlineSubscribe({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);

  useEffect(() => {
    if (state?.ok) {
      try {
        localStorage.setItem("df-subscribed", "1");
      } catch {}
    }
  }, [state]);

  return (
    <aside className="mt-10 rounded-lg border border-border bg-bg2 px-5 py-6 sm:px-7">
      <p className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-teal">
        <span className="inline-block size-1.5 rounded-full bg-teal" />
        Free weekly newsletter
      </p>
      <p className="font-serif text-[19px] leading-tight font-black tracking-[-0.3px]">
        Get the next one in your inbox
      </p>
      <p className="mt-1 mb-4 text-[13px] leading-relaxed text-muted">
        Practical AI, ML &amp; data science, once a week, no spam. Unsubscribe anytime.
      </p>

      {state?.ok ? (
        <p className="rounded border border-teal/30 bg-teal-dim px-4 py-3 text-[13px] text-teal">
          {state.message}
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-2 sm:flex-row">
          <Honeypot />
          <input type="hidden" name="source" value={`article:${slug}`} />
          <label htmlFor="inline-sub-email" className="sr-only">
            Email address
          </label>
          <input
            id="inline-sub-email"
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            className="flex-1 rounded border border-border bg-surface-1 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:bg-surface-2"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold whitespace-nowrap text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {pending ? "Subscribing…" : "Subscribe free →"}
          </button>
        </form>
      )}
      {state && !state.ok && <p className="mt-2 text-[12px] text-red">{state.message}</p>}
    </aside>
  );
}
