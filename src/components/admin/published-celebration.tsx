"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, PartyPopper, X } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";
const KEY = "df-celebrated";

type Piece = { id: string; title: string; slug: string };

function readSeen(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/**
 * Shown on the writer's home after a piece goes live: a moment to enjoy it,
 * and everything needed to share it (LinkedIn, X, the link, a ready-made
 * post and the article's share image). Dismissed per piece, per browser.
 */
export function PublishedCelebration({ piece, first }: { piece: Piece; first: boolean }) {
  const seen = useSyncExternalStore(subscribe, readSeen, () => "");
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState<"link" | "post" | null>(null);
  if (hidden || seen.split(",").includes(piece.id)) return null;

  const url = `${SITE}/article/${piece.slug}`;
  const post = first
    ? `I just published my first piece on Everyday Data Science: "${piece.title}"\n\n${url}`
    : `New piece out on Everyday Data Science: "${piece.title}"\n\n${url}`;

  function dismiss() {
    try {
      localStorage.setItem(KEY, [readSeen(), piece.id].filter(Boolean).join(","));
    } catch {}
    setHidden(true);
  }
  async function copy(kind: "link" | "post") {
    try {
      await navigator.clipboard.writeText(kind === "link" ? url : post);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  const btn =
    "inline-flex items-center justify-center gap-1.5 rounded border border-border bg-bg px-3.5 py-2.5 text-[13px] font-semibold transition-colors hover:border-border-strong hover:bg-surface-1";

  return (
    <section
      aria-label="Your piece is live"
      className="relative mb-6 overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-br from-gold-dim via-bg2 to-teal-dim p-5 sm:p-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 rounded p-1.5 text-muted hover:bg-surface-1 hover:text-ink"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-4">
        <span className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-gold text-on-accent sm:flex">
          <PartyPopper className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 pr-6">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">
            {first ? "Your first piece is live" : "You're published"}
          </p>
          <p className="mt-1 font-serif text-[22px] leading-tight font-black sm:text-2xl">{piece.title}</p>
          <p className="mt-2 text-[14px] text-muted">
            {first
              ? "Congratulations, you're now a published writer on Everyday Data Science. Now share it with the people who should read it."
              : "It's live. Share it while it's fresh."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center rounded bg-gold px-3.5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85"
        >
          Share on LinkedIn
        </a>
        <a
          href={`https://x.com/intent/post?text=${encodeURIComponent(post)}`}
          target="_blank"
          rel="noopener"
          className={btn}
        >
          Post on X
        </a>
        <button type="button" onClick={() => copy("post")} className={btn}>
          {copied === "post" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied === "post" ? "Copied" : "Copy a ready post"}
        </button>
        <button type="button" onClick={() => copy("link")} className={btn}>
          {copied === "link" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
        <a href={`/article/${piece.slug}`} target="_blank" className="font-semibold text-gold hover:underline">
          Read it live →
        </a>
        <a
          href={`/article/${piece.slug}/opengraph-image`}
          download={`${piece.slug}.png`}
          className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
        >
          <Download className="size-3.5" aria-hidden />
          Download the share image
        </a>
      </div>
    </section>
  );
}
