"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { checkStyle } from "@/lib/style-check";

const DOT: Record<string, string> = { fix: "bg-red", warn: "bg-gold", tip: "bg-teal" };

/**
 * Live house-style check beside the editor. Re-runs as the body changes
 * (deferred so typing stays smooth). Mechanical fixes rewrite the body via
 * onApply; everything else is advice.
 */
export function StyleCheck({ body, onApply }: { body: string; onApply: (next: string) => void }) {
  const deferred = useDeferredValue(body);
  const issues = useMemo(() => checkStyle(deferred), [deferred]);
  const [open, setOpen] = useState(true);
  const toFix = issues.filter((i) => i.level === "fix").length;

  if (!deferred.trim()) return null;

  return (
    <section className="rounded border border-border bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <Sparkles className="size-4 text-gold" aria-hidden />
        <span className="flex-1 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">House style</span>
        {issues.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal">
            <Check className="size-3.5" aria-hidden /> Looks good
          </span>
        ) : (
          <span className={`text-[12px] font-semibold ${toFix ? "text-red" : "text-gold"}`}>
            {toFix ? `${toFix} to fix` : `${issues.length} suggestion${issues.length === 1 ? "" : "s"}`}
          </span>
        )}
        <ChevronDown className={`size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="border-t border-border px-3 py-3">
          {issues.length === 0 ? (
            <p className="text-[12px] text-muted">No em-dashes, chatbot leftovers or AI phrases, and the key sections are there.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {issues.map((i) => (
                <li key={i.id} className="text-[12px] leading-relaxed">
                  <p className="flex items-start gap-2 font-semibold text-ink">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${DOT[i.level]}`} aria-hidden />
                    {i.title}
                  </p>
                  <p className="mt-0.5 pl-3.5 text-muted">{i.detail}</p>
                  {i.examples && i.examples.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-1 pl-3.5">
                      {i.examples.map((e) => (
                        <li key={e} className="rounded bg-bg px-1.5 py-0.5 font-mono text-[10px] text-muted">
                          {e}
                        </li>
                      ))}
                    </ul>
                  )}
                  {i.fix && (
                    <button
                      type="button"
                      onClick={() => onApply(i.fix!.apply(body))}
                      className="mt-1.5 ml-3.5 rounded border border-gold/40 px-2.5 py-1 text-[11px] font-semibold text-gold hover:bg-gold-dim"
                    >
                      {i.fix.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted">
            Polished your draft with an AI tool? That&apos;s fine. Then make it sound like you: specific
            numbers, what you saw, plain words.{" "}
            <Link href="/write/guide" target="_blank" className="text-gold hover:underline">
              House style guide
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
