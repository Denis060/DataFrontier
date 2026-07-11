import Link from "next/link";
import { FileText, Inbox, LayoutDashboard, LayoutGrid, Mail, MessageSquare, Settings, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["admin", "editor", "author"] },
  { href: "/admin/articles", label: "Articles", icon: FileText, roles: ["admin", "editor", "author"] },
  { href: "/admin/cheat-sheets", label: "Cheat Sheets", icon: LayoutGrid, roles: ["admin", "editor", "author"] },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare, roles: ["admin", "editor"] },
  { href: "/admin/applications", label: "Applications", icon: Inbox, roles: ["admin", "editor"] },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, roles: ["admin", "editor"] },
  { href: "/admin/users", label: "People", icon: Users, roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
] as const;

export function AdminShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(role));

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-border bg-bg2 lg:w-60 lg:border-r lg:border-b-0">
        <Link href="/" className="flex h-16 items-center gap-2 px-6 font-serif text-lg font-black">
          The Data<span className="text-gold">Frontier</span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pt-2">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2.5 rounded px-3 py-2.5 text-[13px] text-muted whitespace-nowrap transition-colors hover:bg-surface-1 hover:text-ink"
            >
              <n.icon className="size-4" aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden items-center justify-between border-t border-border px-4 py-3 lg:flex">
          <span className="truncate text-[11px] text-muted">{name}</span>
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
