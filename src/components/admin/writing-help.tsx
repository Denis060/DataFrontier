"use client";

import { useState } from "react";
import { BookOpen, Check, Copy, ExternalLink } from "lucide-react";
import { aiBrief } from "@/lib/ai-brief";

/**
 * The writer's guide, reachable from inside the editor, plus a brief to paste
 * into an AI tool so its output already follows house style. getFormat reads
 * the piece's current format so the brief carries the matching outline.
 */
export function WritingHelp({ getFormat }: { getFormat: () => string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(aiBrief(getFormat()));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Couldn't copy. Open the writer's guide instead.");
    }
  }

  return (
    <details className="group relative">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded border border-border px-3 py-2 text-[12px] text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <BookOpen className="size-3.5" aria-hidden />
        Writing help
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-[min(320px,calc(100vw-32px))] rounded-lg border border-border bg-bg2 p-4 shadow-xl">
        <p className="text-[13px] font-semibold">Using ChatGPT or Claude?</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Copy our brief, paste it into the tool, then add your own notes, code and results under it.
          What comes back follows our house style and outline, so there&apos;s less to fix here.
        </p>
        <button
          type="button"
          onClick={copy}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded bg-gold px-3 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? "Copied. Paste it into your AI tool" : "Copy the brief for your AI tool"}
        </button>
        <p className="mt-2 text-[11px] text-muted">
          Tip: pick the Format first. The brief then includes that format&apos;s outline.
        </p>
        <a
          href="/write/guide"
          target="_blank"
          rel="noopener"
          className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-[13px] font-semibold text-gold hover:underline"
        >
          Read the writer&apos;s guide
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </details>
  );
}
