import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "Newsroom", robots: { index: false } };

const STAFF = ["admin", "editor", "author"] as const;

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  // The proxy keeps anonymous users out. Role is enforced here, because the
  // proxy only knows there is a session — not what it is allowed to do.
  // (This page can't use requireStaff(), which redirects non-staff to /admin
  // and would loop.)
  if (!profile) redirect("/login?next=/admin");
  if (!hasRole(profile.role, [...STAFF])) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-serif text-3xl font-black">Not authorised</h1>
        <p className="max-w-sm text-sm text-muted">
          Your account is a reader. Ask an editor to grant you author access.
        </p>
        <Link href="/" className="mt-2 text-[13px] text-gold hover:underline">
          ← Back to the site
        </Link>
      </main>
    );
  }

  const db = await createClient();
  // RLS scopes these counts automatically: an author sees only their own
  // drafts, an editor sees every one.
  const [drafts, review, published, subscribers] = await Promise.all([
    db.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
    db.from("articles").select("id", { count: "exact", head: true }).eq("status", "in_review"),
    db.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
    hasRole(profile.role, ["admin"])
      ? db.from("newsletter_subscribers").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: null }),
  ]);

  const tiles = [
    { label: "Drafts", value: drafts.count ?? 0, href: "/admin/articles?status=draft" },
    { label: "In review", value: review.count ?? 0, href: "/admin/articles?status=in_review" },
    { label: "Published", value: published.count ?? 0, href: "/admin/articles?status=published" },
    ...(subscribers.count != null
      ? [{ label: "Subscribers", value: subscribers.count, href: "/admin/settings" }]
      : []),
  ];

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[1000px] px-5 py-10 sm:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[2px] text-gold">Newsroom</p>
            <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">{profile.full_name}</h1>
            <p className="mt-1 text-[13px] text-muted">
              {profile.email} · <span className="font-mono">{profile.role}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded border border-border px-4 py-2 text-[13px] transition-colors hover:border-border-strong hover:bg-surface-1"
            >
              View site
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center rounded border border-border px-4 py-2 text-[13px] transition-colors hover:border-border-strong hover:bg-surface-1"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="rounded-md border border-border bg-bg2 p-5 transition-colors hover:border-border-strong"
            >
              <p className="font-serif text-3xl font-black text-gold">{t.value}</p>
              <p className="mt-1 text-xs text-muted">{t.label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
          >
            <PenLine className="size-4" aria-hidden />
            Write an article
          </Link>
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-2 rounded border border-border px-4 py-2.5 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-1"
          >
            Manage all articles
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
