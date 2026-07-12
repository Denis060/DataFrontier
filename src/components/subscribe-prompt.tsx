"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";
import { Honeypot } from "@/components/honeypot";

const STORAGE_KEY = "df-subscribe-prompt";
const SUBSCRIBED_KEY = "df-subscribed";
const RESHOW_DAYS = 30;

// Don't interrupt people who are converting, subscribing, or in the newsroom.
const SKIP_PREFIXES = ["/admin", "/login", "/signup", "/newsletter", "/notifications", "/following", "/write"];

function shouldSuppress(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY)) return true;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!at) return false;
    // hrtime-free elapsed check via Date is fine on the client.
    return Date.now() - at < RESHOW_DAYS * 86400000;
  } catch {
    return false;
  }
}

/**
 * A tasteful, once-per-visitor newsletter nudge. Slides in after the reader is
 * engaged (scrolled ~40% or ~25s), never on conversion pages, and remembers a
 * dismissal for 30 days (or forever once they subscribe). Reuses the real
 * double-opt-in subscribe action.
 */
export function SubscribePrompt({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);

  // Never nudge someone who's signed in (they're already engaged), on a
  // conversion page, or who has already subscribed/dismissed.
  const skip = signedIn || SKIP_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (skip || shouldSuppress()) return;

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setShow(true);
    };

    const onScroll = () => {
      const el = document.documentElement;
      const pct = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      if (pct > 0.4) reveal();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setTimeout(reveal, 25000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [skip, pathname]);

  // Persist success so it never shows again.
  useEffect(() => {
    if (state?.ok) {
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {}
    }
  }, [state]);

  function close() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
  }

  if (skip || !show || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="Subscribe to the newsletter"
      className="subscribe-prompt fixed right-4 bottom-4 left-4 z-90 mx-auto max-w-sm rounded-lg border border-border bg-bg2 p-5 shadow-2xl sm:left-auto"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-muted transition-colors hover:text-ink"
      >
        <X className="size-4" />
      </button>

      {state?.ok ? (
        <div className="pr-6">
          <p className="font-serif text-lg font-black">Almost there.</p>
          <p className="mt-1 text-[13px] text-muted">{state.message}</p>
        </div>
      ) : (
        <>
          <p className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-teal">
            <span className="pulse-dot inline-block size-1.5 rounded-full bg-teal" />
            Free weekly newsletter
          </p>
          <p className="pr-6 font-serif text-lg leading-tight font-black">
            Stay ahead in AI &amp; data science.
          </p>
          <p className="mt-1 mb-3 text-[13px] leading-relaxed text-muted">
            AI research, agentic breakdowns, and career intelligence — once a week, no spam.
          </p>

          <form action={action} className="flex flex-col gap-2">
            <Honeypot />
            <input type="hidden" name="source" value={`prompt:${pathname}`} />
            <input
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              className="w-full rounded border border-border bg-surface-1 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
            >
              {pending ? "Subscribing…" : "Subscribe free →"}
            </button>
            {state && !state.ok && <p className="text-[12px] text-red">{state.message}</p>}
          </form>
        </>
      )}
    </div>
  );
}
