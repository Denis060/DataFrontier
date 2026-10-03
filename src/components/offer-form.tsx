"use client";

import { useActionState, useEffect } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";
import { Honeypot } from "@/components/honeypot";

/**
 * One email field for something a reader gets for their email: a free offer
 * or a cheat sheet (kind). Same double-opt-in action as every signup.
 */
export function OfferForm({
  slug,
  title,
  id = "offer-email",
  kind = "offer",
  cta,
}: {
  slug: string;
  title: string;
  id?: string;
  kind?: "offer" | "sheet";
  cta?: string;
}) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);

  useEffect(() => {
    if (state?.ok) {
      try {
        localStorage.setItem("df-subscribed", "1");
      } catch {}
    }
  }, [state]);

  // The reply can't say whether the address was already on the list (that
  // would leak it), so it covers both: new readers confirm, existing ones
  // get the download straight away.
  if (state?.ok) {
    return (
        <div className="rounded border border-teal/30 bg-teal-dim px-4 py-3.5 text-[13px] leading-relaxed">
          <p className="font-serif text-lg font-black text-ink">Check your inbox</p>
          <p className="mt-1 text-muted">
            We&apos;ve emailed{state.email ? <> <strong className="font-semibold text-ink">{state.email}</strong></> : null} from{" "}
            <strong className="font-semibold text-ink">Everyday Data Science</strong>.
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-muted">
            <li>
              <span className="text-ink">New here?</span> Click the confirm link and your download opens straight away.
            </li>
            <li>
              <span className="text-ink">Already subscribed?</span> Your download link is in that email, no need to confirm again.
            </li>
          </ul>
          <p className="mt-2 text-muted">Not there in a minute? Check Promotions or Spam.</p>
        </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <Honeypot />
      <input type="hidden" name={kind} value={slug} />
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
        {pending ? "Sending…" : (cta ?? `Get ${title} free →`)}
      </button>
      {state && !state.ok && <p className="text-[12px] text-red">{state.message}</p>}
      <p className="text-[12px] leading-relaxed text-muted">
        We&apos;ll email you a link to confirm, then the download. You&apos;ll also get The Everyday Brief,
        our free weekly newsletter. Unsubscribe in one click, any time.
      </p>
    </form>
  );
}
