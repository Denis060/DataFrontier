"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";
import type { HomeData } from "@/lib/queries";

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K+` : String(n);

export function NewsletterBand({
  headline,
  subtext,
  stats,
  showStats,
}: {
  headline: string;
  subtext: string;
  stats: HomeData["stats"];
  showStats: boolean;
}) {
  const [state, formAction, pending] = useActionState<SubscribeState, FormData>(
    subscribe,
    null,
  );

  /**
   * Only surface a stat once it means something. An empty list rendering
   * "0 Subscribers" is worse than showing nothing at all.
   */
  const tiles = [
    stats.subscribers >= 100 && { num: compact(stats.subscribers), label: "Subscribers" },
    stats.openRate != null && { num: `${stats.openRate}%`, label: "Open Rate" },
    stats.issues > 0 && { num: String(stats.issues), label: "Issues Published" },
  ].filter(Boolean) as { num: string; label: string }[];

  return (
    <section className="relative grid gap-10 overflow-hidden border-b border-border bg-linear-135 from-news-from to-news-to px-5 py-12 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-12 size-[400px] rounded-full bg-[radial-gradient(circle,var(--df-teal-dim)_0%,transparent_70%)] opacity-40"
      />
      <div className="relative">
        <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-teal">
          <span className="pulse-dot inline-block size-1.5 rounded-full bg-teal" />
          Free Weekly Newsletter
        </p>
        <h2 className="mb-3 font-serif text-[28px] leading-[1.1] font-black tracking-[-0.5px] sm:text-[32px]">
          {headline}
        </h2>
        <p className="text-[15px] leading-relaxed text-muted">{subtext}</p>

        {showStats && tiles.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-8">
            {tiles.map((t) => (
              <div key={t.label} className="flex flex-col">
                <span className="font-serif text-[28px] leading-none font-black text-gold">
                  {t.num}
                </span>
                <span className="mt-1 text-xs text-muted">{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <form action={formAction} className="relative flex flex-col gap-3">
        <p className="text-sm text-muted">
          Join data scientists, ML engineers, and AI researchers building the frontier.
        </p>
        <input type="hidden" name="source" value="homepage" />
        <div className="flex flex-col sm:flex-row">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            className="flex-1 rounded border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-gold/40 focus:bg-surface-2 sm:rounded-r-none sm:border-r-0"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded bg-gold px-6 py-3 text-sm font-bold whitespace-nowrap text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60 sm:mt-0 sm:rounded-l-none"
          >
            {pending ? "Subscribing…" : "Subscribe →"}
          </button>
        </div>
        <p
          className="flex items-center gap-1.5 text-xs text-muted"
          aria-live="polite"
        >
          {state ? (
            <span className={state.ok ? "text-teal" : "text-red"}>{state.message}</span>
          ) : (
            <>🔒 No spam. Unsubscribe anytime. Sent every Tuesday.</>
          )}
        </p>
      </form>
    </section>
  );
}
