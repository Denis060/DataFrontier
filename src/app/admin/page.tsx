import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Newsroom", robots: { index: false } };

const STAFF = ["admin", "editor", "author"] as const;

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  // The proxy keeps anonymous users out. Role is enforced here, because the
  // proxy only knows there is a session — not what it is allowed to do.
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
    { label: "Drafts", value: drafts.count ?? 0 },
    { label: "In review", value: review.count ?? 0 },
    { label: "Published", value: published.count ?? 0 },
    ...(subscribers.count != null ? [{ label: "Subscribers", value: subscribers.count }] : []),
  ];

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[2px] text-gold">Newsroom</p>
          <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">
            {profile.full_name}
          </h1>
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
          <div key={t.label} className="rounded-md border border-border bg-bg2 p-5">
            <p className="font-serif text-3xl font-black text-gold">{t.value}</p>
            <p className="mt-1 text-xs text-muted">{t.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 rounded border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
        The article editor and settings screens land next.
      </p>
    </main>
  );
}
