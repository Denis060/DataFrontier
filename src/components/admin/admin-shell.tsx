import Link from "next/link";
import { CircleUser, FileText, GraduationCap, Heart, Inbox, LayoutDashboard, LayoutGrid, LogOut, MessagesSquare, Shapes, Mail, MessageSquare, Settings, Users, Wrench } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["admin", "editor", "author"] },
  { href: "/admin/articles", label: "Articles", icon: FileText, roles: ["admin", "editor", "author"] },
  { href: "/admin/cheat-sheets", label: "Cheat Sheets", icon: LayoutGrid, roles: ["admin", "editor", "author"] },
  { href: "/admin/followers", label: "Followers", icon: Heart, roles: ["admin", "editor", "author"] },
  { href: "/admin/responses", label: "On my pieces", icon: MessagesSquare, roles: ["admin", "editor", "author"] },
  { href: "/admin/profile", label: "My profile", icon: CircleUser, roles: ["admin", "editor", "author"] },
  { href: "/admin/series", label: "Learning Paths", icon: GraduationCap, roles: ["admin", "editor"] },
  { href: "/admin/resources", label: "Resources", icon: Wrench, roles: ["admin", "editor"] },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare, roles: ["admin", "editor"] },
  { href: "/admin/applications", label: "Applications", icon: Inbox, roles: ["admin", "editor"] },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, roles: ["admin", "editor"] },
  { href: "/admin/manage", label: "Site content", icon: Shapes, roles: ["admin", "editor"] },
  { href: "/admin/users", label: "People", icon: Users, roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
] as const;

/**
 * What's waiting on an editor: pitches to decide, pieces to review, comments
 * to approve. Counted on every admin page so nothing sits unnoticed.
 */
async function waiting(role: Role): Promise<Record<string, number>> {
  if (role !== "admin" && role !== "editor") return {};
  const db = await createClient();
  const head = { count: "exact" as const, head: true };
  const [apps, review, comments] = await Promise.all([
    db.from("author_applications").select("id", head).eq("status", "pending"),
    db.from("articles").select("id", head).eq("status", "in_review"),
    db.from("comments").select("id", head).eq("is_approved", false),
  ]);
  return {
    "/admin/applications": apps.count ?? 0,
    "/admin/articles": review.count ?? 0,
    "/admin/comments": comments.count ?? 0,
  };
}

export async function AdminShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(role));
  const counts = await waiting(role);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-border bg-bg2 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:self-start lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between gap-3 px-6">
          <Link href="/" className="font-serif text-lg font-black whitespace-nowrap">
            Everyday <span className="text-gold">Data Science</span>
          </Link>
          {/* Phones: the theme switch stays up here; account links are in the menu drawer. */}
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>
        <AdminNav
          items={items.map(({ href, label, icon: Icon }) => ({
            href,
            label,
            icon: <Icon className="size-4" aria-hidden />,
            badge: counts[href] ?? 0,
          }))}
          footer={
            <div className="flex flex-col gap-3">
              <span className="truncate text-[12px] text-muted">{name}</span>
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <Link href="/" className="text-muted hover:text-ink">
                  View site
                </Link>
                <SignOut />
              </div>
            </div>
          }
        />
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
      <div className="min-w-0 flex-1">{children}</div>
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
