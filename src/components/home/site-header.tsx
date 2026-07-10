"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { HomeData } from "@/lib/queries";

type Props = {
  siteName: string;
  established: number | null;
  nav: HomeData["menus"];
  ticker: HomeData["ticker"];
};

export function SiteHeader({ siteName, established, nav, ticker }: Props) {
  const [open, setOpen] = useState(false);
  const [brand, accent] = splitBrand(siteName);

  return (
    <header className="sticky top-0 z-100 border-b border-border bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-serif text-[22px] font-black tracking-[-0.5px]">
            {brand}
            <span className="text-gold">{accent}</span>
          </span>
          {established && (
            <span className="hidden rounded-[3px] border border-teal-dim px-[7px] py-0.5 font-mono text-[10px] uppercase tracking-[2px] text-teal sm:inline">
              est. {established}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className={
                item.is_button
                  ? "rounded bg-gold px-[18px] py-2 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-85"
                  : "text-[13px] font-medium tracking-[0.3px] text-muted transition-colors hover:text-ink"
              }
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex size-9 items-center justify-center rounded border border-border text-muted"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-5 py-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => setOpen(false)}
              className={
                item.is_button
                  ? "mt-2 rounded bg-gold px-4 py-2.5 text-center text-[13px] font-semibold text-on-accent"
                  : "py-2.5 text-sm text-muted"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {ticker.length > 0 && <Ticker items={ticker} />}
    </header>
  );
}

function Ticker({ items }: { items: HomeData["ticker"] }) {
  return (
    <div className="flex items-center gap-4 overflow-hidden border-t border-border bg-bg2 py-[7px] pl-5 sm:pl-8 lg:pl-12">
      <span className="shrink-0 whitespace-nowrap border-r border-border pr-4 font-mono text-[10px] uppercase tracking-[2px] text-gold">
        Latest
      </span>
      <div className="ticker-track flex gap-12 whitespace-nowrap">
        {/* Rendered twice so the -50% translate loops seamlessly. */}
        {[0, 1].map((pass) => (
          <div key={pass} className="flex shrink-0 gap-12" aria-hidden={pass === 1}>
            {items.map((item) => (
              <span key={`${pass}-${item.id}`} className="text-xs text-muted">
                {item.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** "The DataFrontier" -> ["The Data", "Frontier"] so the second half can be gold. */
function splitBrand(name: string): [string, string] {
  const i = name.lastIndexOf("Frontier");
  return i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ""];
}
