"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu, type SessionProfile } from "@/components/auth/user-menu";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notification-bell";
import type { HomeData } from "@/lib/queries";

// Secondary destinations, tucked under a "More" dropdown so the top bar stays clean.
const MORE_LINKS = [
  { label: "Learning Paths", url: "/series" },
  { label: "Events", url: "/events" },
  { label: "Careers", url: "/jobs" },
  { label: "Cheat Sheets", url: "/cheat-sheets" },
  { label: "Newsletter Archive", url: "/newsletter/archive" },
  { label: "Advertise", url: "/advertise" },
  { label: "Contact", url: "/contact" },
];

type Props = {
  siteName: string;
  established: number | null;
  nav: HomeData["menus"];
  ticker: HomeData["ticker"];
  profile?: SessionProfile;
  unread?: number;
};

export function SiteHeader({ siteName, established, nav, ticker, profile = null, unread = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const [brand, accent] = splitBrand(siteName);

  return (
    <header className="sticky top-0 z-100 border-b border-border bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex shrink-0 items-baseline gap-2.5">
          <span className="font-serif text-[22px] font-black tracking-[-0.5px] whitespace-nowrap">
            {brand}
            <span className="text-gold">{accent}</span>
          </span>
          {established && (
            <span className="hidden rounded-[3px] border border-teal-dim px-[7px] py-0.5 font-mono text-[10px] uppercase tracking-[2px] text-teal xl:inline">
              est. {established}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-6">
          {nav.filter((i) => !i.is_button).map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="whitespace-nowrap text-[13px] font-medium tracking-[0.3px] text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}

          <MoreMenu />

          {nav.filter((i) => i.is_button).map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="whitespace-nowrap rounded bg-gold px-[18px] py-2 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-85"
            >
              {item.label}
            </Link>
          ))}

          <SearchBar />
          {profile && <NotificationBell unread={unread} />}
          <ThemeToggle />
          <UserMenu profile={profile} />
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <SearchBar />
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
          {nav.filter((i) => !i.is_button).map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-muted"
            >
              {item.label}
            </Link>
          ))}
          {MORE_LINKS.map((l) => (
            <Link
              key={l.url}
              href={l.url}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-muted"
            >
              {l.label}
            </Link>
          ))}
          {nav.filter((i) => i.is_button).map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => setOpen(false)}
              className="mt-2 rounded bg-gold px-4 py-2.5 text-center text-[13px] font-semibold text-on-accent"
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
            {profile ? (
              <>
                <span className="text-[13px] text-muted">{profile.full_name}</span>
                <div className="flex items-center gap-3">
                  {["admin", "editor", "author"].includes(profile.role) && (
                    <Link href="/admin" className="text-[13px] text-gold" onClick={() => setOpen(false)}>
                      Newsroom
                    </Link>
                  )}
                  <Link href="/library" className="text-[13px] text-muted" onClick={() => setOpen(false)}>
                    Library
                  </Link>
                  <Link href="/account" className="text-[13px] text-muted" onClick={() => setOpen(false)}>
                    Account
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="text-[13px] text-muted">
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link href="/login" className="text-[13px] text-gold" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}

      {ticker.length > 0 && <Ticker items={ticker} />}
    </header>
  );
}

function Ticker({ items }: { items: HomeData["ticker"] }) {
  return (
    <div className="flex items-center gap-4 border-t border-border bg-bg2 py-[7px] pl-5 sm:pl-8 lg:pl-12">
      <span className="shrink-0 whitespace-nowrap border-r border-border pr-4 font-mono text-[10px] uppercase tracking-[2px] text-gold">
        Latest
      </span>
      {/* The track gets its own clipping context. With overflow on the outer
          flex row, items translated left slid across the "Latest" label. */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max gap-12 whitespace-nowrap">
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
    </div>
  );
}

/** Desktop "More ▾" dropdown of secondary destinations. */
function MoreMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 whitespace-nowrap text-[13px] font-medium tracking-[0.3px] text-muted transition-colors hover:text-ink"
      >
        More
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-md border border-border bg-bg2 py-1 shadow-xl">
            {MORE_LINKS.map((l) => (
              <Link
                key={l.url}
                href={l.url}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-[13px] text-muted transition-colors hover:bg-surface-1 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** "Everyday Data Science" -> ["Everyday ", "Data Science"] so the rest can be gold. */
function splitBrand(name: string): [string, string] {
  const i = name.indexOf(" ");
  return i > 0 ? [name.slice(0, i + 1), name.slice(i + 1)] : [name, ""];
}
