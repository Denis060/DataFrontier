import Link from "next/link";
import { FileText, GraduationCap, Inbox, LayoutDashboard, LayoutGrid, LogOut, Mail, MessageSquare, Settings, Users, Wrench } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["admin", "editor", "author"] },
  { href: "/admin/articles", label: "Articles", icon: FileText, roles: ["admin", "editor", "author"] },
  { href: "/admin/cheat-sheets", label: "Cheat Sheets", icon: LayoutGrid, roles: ["admin", "editor", "author"] },
  { href: "/admin/series", label: "Learning Paths", icon: GraduationCap, roles: ["admin", "editor"] },
  { href: "/admin/resources", label: "Resources", icon: Wrench, roles: ["admin", "editor"] },
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
      <aside className="flex shrink-0 flex-col border-b border-border bg-bg2 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:self-start lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between gap-3 px-6">
          <Link href="/" className="font-serif text-lg font-black whitespace-nowrap">
            Everyday <span className="text-gold">Data Science</span>
          </Link>
          {/* Phones: the account controls live up here, since the footer is desktop-only. */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <SignOut />
          </div>
        </div>
        <AdminNav items={items.map(({ href, label, icon: Icon }) => ({ href, label, icon: <Icon className="size-4" aria-hidden /> }))} />
        <div className="mt-auto hidden flex-col gap-2 border-t border-border px-4 py-3 lg:flex">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-muted">{name}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <Link href="/" className="text-muted hover:text-ink">
              View site
            </Link>
            <SignOut />
          </div>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/** Sign out from any admin page (it used to exist only on Overview). */
function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
      >
        <LogOut className="size-3.5" aria-hidden />
        Sign out
      </button>
    </form>
  );
}
