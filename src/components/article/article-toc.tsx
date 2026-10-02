"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/headings";

/** Highlights whichever section the reader is in. */
function useActiveHeading(headings: Heading[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;

    // The section you're "in" is the last heading that has scrolled past a
    // line a little below the sticky header.
    const update = () => {
      const line = 200;
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  return active;
}

function Items({ headings, active, onPick }: { headings: Heading[]; active: string | null; onPick?: () => void }) {
  return (
    <ol className="flex flex-col">
      {headings.map((h) => {
        const on = h.id === active;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={onPick}
              aria-current={on ? "location" : undefined}
              className={`block border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors ${
                on ? "border-gold font-semibold text-ink" : "border-border text-muted hover:border-border-strong hover:text-ink"
              }`}
            >
              {h.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Desktop rail version: always open, tracks the current section. */
export function ArticleTocRail({ headings }: { headings: Heading[] }) {
  const active = useActiveHeading(headings);
  return (
    <nav aria-label="On this page">
      <Items headings={headings} active={active} />
    </nav>
  );
}

/** Phone version: a collapsed "On this page" panel above the article body. */
export function ArticleTocInline({ headings }: { headings: Heading[] }) {
  const active = useActiveHeading(headings);
  const [open, setOpen] = useState(false);
  return (
    <nav aria-label="On this page" className="mb-8 rounded-md border border-border bg-bg2 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted">
          On this page · {headings.length} sections
        </span>
        <span aria-hidden className={`text-gold transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          <Items headings={headings} active={active} onPick={() => setOpen(false)} />
        </div>
      )}
    </nav>
  );
}
