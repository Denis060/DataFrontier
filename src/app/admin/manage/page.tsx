import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { RESOURCES } from "@/lib/managed";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "Site content | Newsroom", robots: { index: false } };

export default async function ManageIndexPage() {
  const profile = await requireStaff();
  const mine = RESOURCES.filter((r) => hasRole(profile.role, r.roles));
  const db = await createClient();
  const counts = await Promise.all(
    mine.map((r) => db.from(r.table as never).select("id", { count: "exact", head: true })),
  );

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="w-full max-w-[1200px] px-5 py-10 sm:px-8">
        <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">Site content</h1>
        <p className="mt-1 text-[13px] text-muted">
          Everything on the site that isn&apos;t an article: menus, the ticker, events, jobs,
          corrections, the scoreboard, and how articles are organised.
        </p>
        {mine.length === 0 ? (
          <p className="mt-8 text-[13px] text-muted">Nothing here for your role.</p>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {mine.map((r, i) => (
              <Link
                key={r.key}
                href={`/admin/manage/${r.key}`}
                className="rounded-md border border-border bg-bg2 p-5 transition-colors hover:border-gold/40"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-lg font-black">{r.title}</span>
                  <span className="font-mono text-[11px] text-muted">{counts[i].count ?? 0}</span>
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted">{r.description}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
