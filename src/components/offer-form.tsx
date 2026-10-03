"use client";

import { useActionState, useEffect } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";
import { Honeypot } from "@/components/honeypot";
import { SubscribeSuccess } from "@/components/subscribe-success";

/** One email field for a free offer. Same double-opt-in action as every signup. */
export function OfferForm({ slug, title, id = "offer-email" }: { slug: string; title: string; id?: string }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);

  useEffect(() => {
    if (state?.ok) {
      try {
        localStorage.setItem("df-subscribed", "1");
      } catch {}
    }
  }, [state]);

  if (state?.ok) return <SubscribeSuccess email={state.email} />;

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <Honeypot />
      <input type="hidden" name="offer" value={slug} />
      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
        Where should we send it?
      </label>
      <input
        id={id}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="your@email.com"
        className="w-full rounded border border-border bg-surface-1 px-4 py-3.5 text-[15px] outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:bg-surface-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-gold px-5 py-3.5 text-[15px] font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {pending ? "Sending…" : `Get ${title} free →`}
      </button>
      {state && !state.ok && <p className="text-[12px] text-red">{state.message}</p>}
      <p className="text-[12px] leading-relaxed text-muted">
        We&apos;ll email you a link to confirm, then the download. You&apos;ll also get The Everyday Brief,
        our free weekly newsletter. Unsubscribe in one click, any time.
      </p>
    </form>
  );
}
