"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

type Item = { href: string; label: string; icon: React.ReactNode; badge?: number };

/**
 * The admin menu, with the current section highlighted. A sidebar list from
 * lg up; on phones, a bar naming the current section that opens the full
 * menu as a slide-out drawer. Icons arrive as rendered elements: component
 * functions can't cross the server/client line.
 */
export function AdminNav({ items, footer }: { items: Item[]; footer?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Overview matches exactly; every other section also owns its sub-pages.
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const current = items.find((n) => isActive(n.href));
  const waiting = items.reduce((s, n) => s + (n.badge ?? 0), 0);

  // Close on navigation and on Escape; keep the page from scrolling behind it.
  // The pathname check runs during render (React's "adjust state on prop
  // change" pattern) rather than in an effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const list = (onPick?: () => void) =>
    items.map((n) => {
      const on = isActive(n.href);
      return (
        <Link
          key={n.href}
          href={n.href}
          onClick={onPick}
          aria-current={on ? "page" : undefined}
          className={`flex items-center gap-2.5 rounded px-3 py-2.5 text-[14px] whitespace-nowrap transition-colors lg:text-[13px] ${
            on ? "bg-gold-dim font-semibold text-gold" : "text-muted hover:bg-surface-1 hover:text-ink"
          }`}
        >
          {n.icon}
          {n.label}
          {!!n.badge && (
            <span
              aria-label={`${n.badge} waiting`}
              className="ml-auto rounded-full bg-gold px-1.5 py-px font-mono text-[10px] font-bold text-on-accent"
            >
              {n.badge}
            </span>
          )}
        </Link>
      );
    });

  return (
    <>
      {/* Wide screens: the sidebar list. */}
      <nav className="hidden flex-col gap-1 px-3 pt-2 pb-3 lg:flex">{list()}</nav>

      {/* Phones and tablets: current section + menu button. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="admin-drawer"
        className="mx-3 mb-3 flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2.5 text-left lg:hidden"
      >
        <Menu className="size-5 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[14px] font-semibold">
          <span className="text-gold">{current?.icon}</span>
          <span className="truncate">{current?.label ?? "Menu"}</span>
        </span>
        {waiting > 0 && (
          <span className="rounded-full bg-gold px-2 py-0.5 font-mono text-[10px] font-bold text-on-accent">{waiting} waiting</span>
        )}
      </button>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          id="admin-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Newsroom menu"
          className={`absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-bg2 shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
            <span className="font-serif text-lg font-black">
              Everyday <span className="text-gold">Data Science</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded p-2 text-muted hover:bg-surface-1 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">{list(() => setOpen(false))}</nav>
          {footer && <div className="shrink-0 border-t border-border px-5 py-4">{footer}</div>}
        </div>
      </div>
    </>
  );
}
