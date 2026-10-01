"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronDown, PenLine } from "lucide-react";
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
  const closeMenu = useCallback(() => setOpen(false), []);
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
          {nav.filter((i) => !i.is_button).map((item) =>
            isWriteLink(item.url) ? (
              // The contributor invitation gets its own look so it reads as an
              // invitation, not just another section.
              <Link
                key={item.id}
                href={item.url}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1 text-[13px] font-medium whitespace-nowrap text-gold transition-colors hover:border-gold hover:bg-gold-dim"
              >
                <PenLine className="size-3.5" aria-hidden />
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.id}
                href={item.url}
                className="whitespace-nowrap text-[13px] font-medium tracking-[0.3px] text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ),
          )}

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
            aria-controls="mobile-menu"
            className={`inline-flex size-9 items-center justify-center rounded border transition-colors ${
              open ? "border-gold/50 text-gold" : "border-border text-muted"
            }`}
          >
            {/* Three bars that fold into an X. */}
            <span aria-hidden className="relative block h-[11.5px] w-4">
              {[
                open ? "top-[5px] rotate-45" : "top-0",
                open ? "top-[5px] scale-x-0 opacity-0" : "top-[5px]",
                open ? "top-[5px] -rotate-45" : "top-[10px]",
              ].map((pos, i) => (
                <span
                  key={i}
                  className={`absolute left-0 h-[1.5px] w-4 rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none ${pos}`}
                />
              ))}
            </span>
          </button>
        </div>
      </div>

      <MobileMenu open={open} close={closeMenu} nav={nav} profile={profile} />

      {ticker.length > 0 && <Ticker items={ticker} />}
    </header>
  );
}

const isWriteLink = (url: string) => url === "/write";

/**
 * Full-screen phone menu. It stays mounted so it can animate: the panel fades
 * and slides in, then each link rises in a beat after the one before. Closed,
 * it's `inert`, so it can't be tabbed into or read out.
 */
function MobileMenu({
  open,
  close,
  nav,
  profile,
}: {
  open: boolean;
  close: () => void;
  nav: HomeData["menus"];
  profile: SessionProfile;
}) {
  // Freeze the page behind the menu, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const primary = nav.filter((i) => !i.is_button && !isWriteLink(i.url));
  const write = nav.find((i) => !i.is_button && isWriteLink(i.url));
  const buttons = nav.filter((i) => i.is_button);

  // Staggered entrance: item n starts n beats after the panel.
  let beat = 0;
  const rise = () => {
    const n = beat++;
    return {
      className: `transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
        open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`,
      style: { transitionDelay: open ? `${90 + n * 40}ms` : "0ms" },
    };
  };

  return (
    <div
      id="mobile-menu"
      inert={!open}
      className={`absolute inset-x-0 top-16 z-10 h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-bg transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none lg:hidden ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <nav className="flex min-h-full flex-col px-5 pt-4 pb-8">
        {primary.map((item) => {
          const r = rise();
          return (
            <Link
              key={item.id}
              href={item.url}
              onClick={close}
              style={r.style}
              className={`group flex items-center justify-between border-b border-border py-4 font-serif text-[24px] font-black tracking-[-0.4px] ${r.className}`}
            >
              {item.label}
              <ArrowRight
                className="size-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold"
                aria-hidden
              />
            </Link>
          );
        })}

        {(() => {
          const r = rise();
          return (
            <div style={r.style} className={`mt-6 ${r.className}`}>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-muted">Explore</p>
              <div className="grid grid-cols-2 gap-2">
                {MORE_LINKS.map((l) => (
                  <Link
                    key={l.url}
                    href={l.url}
                    onClick={close}
                    className="rounded-md border border-border bg-bg2 px-3 py-2.5 text-[13px] font-medium transition-colors active:bg-surface-1"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {write &&
          (() => {
            const r = rise();
            return (
              <Link
                href={write.url}
                onClick={close}
                style={r.style}
                className={`mt-6 flex items-center gap-3.5 rounded-lg border border-gold/30 bg-gold-dim px-4 py-4 ${r.className}`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold text-on-accent">
                  <PenLine className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[17px] font-black">{write.label}</span>
                  <span className="block text-[12px] text-muted">
                    Pitch an idea or republish your blog post.
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-gold" aria-hidden />
              </Link>
            );
          })()}

        {buttons.map((item) => {
          const r = rise();
          return (
            <Link
              key={item.id}
              href={item.url}
              onClick={close}
              style={r.style}
              className={`mt-3 rounded bg-gold px-4 py-3 text-center text-sm font-bold text-on-accent ${r.className}`}
            >
              {item.label}
            </Link>
          );
        })}

        {(() => {
          const r = rise();
          return (
            <div style={r.style} className={`mt-auto pt-8 ${r.className}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                {profile ? (
                  <>
                    <span className="text-[13px] text-muted">{profile.full_name}</span>
                    <div className="flex items-center gap-4">
                      {["admin", "editor", "author"].includes(profile.role) && (
                        <Link href="/admin" className="text-[13px] text-gold" onClick={close}>
                          Newsroom
                        </Link>
                      )}
                      <Link href="/library" className="text-[13px] text-muted" onClick={close}>
                        Library
                      </Link>
                      <Link href="/account" className="text-[13px] text-muted" onClick={close}>
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
                  <>
                    <span className="text-[13px] text-muted">Save articles and join the discussion.</span>
                    <Link href="/login" className="text-[13px] font-semibold text-gold" onClick={close}>
                      Sign in →
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </nav>
    </div>
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
              {items.map((item) =>
                item.url ? (
                  <Link
                    key={`${pass}-${item.id}`}
                    href={item.url}
                    tabIndex={pass === 1 ? -1 : undefined}
                    className="text-xs text-muted transition-colors hover:text-gold"
                  >
                    {item.text}
                  </Link>
                ) : (
                  <span key={`${pass}-${item.id}`} className="text-xs text-muted">
                    {item.text}
                  </span>
                ),
              )}
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
