"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The admin menu, with the current section highlighted. Icons arrive as
 * rendered elements: component functions can't cross the server/client line.
 */
export function AdminNav({ items }: { items: { href: string; label: string; icon: React.ReactNode; badge?: number }[] }) {
  const pathname = usePathname();
  // Overview matches exactly; every other section also owns its sub-pages.
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pt-2">
      {items.map((n) => {
        const on = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded px-3 py-2.5 text-[13px] whitespace-nowrap transition-colors ${
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
      })}
    </nav>
  );
}
