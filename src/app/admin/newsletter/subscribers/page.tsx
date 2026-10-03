import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { SubscribersList } from "@/components/admin/subscribers-list";
import { AudiencePanel } from "@/components/admin/audience-panel";

export const metadata = { title: "Subscribers | Newsroom", robots: { index: false } };

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const profile = await requireStaff();
  // Subscriber emails are PII — admin only, matching the RLS on the table.
  if (!hasRole(profile.role, ["admin"])) redirect("/admin/newsletter");

  const db = await createClient();
  const [{ data }, { data: offers }] = await Promise.all([
    db
      .from("newsletter_subscribers")
      .select("id, email, status, source, created_at, confirmed_at, magnet_id, survey")
      .order("created_at", { ascending: false }),
    db.from("lead_magnets").select("id, slug, title, is_active").order("sort_order"),
  ]);

  const rows = data ?? [];
  const confirmed = rows.filter((r) => r.status === "confirmed").length;

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">Subscribers</h1>
            <p className="mt-1 text-[13px] text-muted">
              {rows.length} total · {confirmed} confirmed
            </p>
          </div>
          <Link href="/admin/newsletter" className="text-[13px] text-muted hover:text-ink">
            ← Newsletter
          </Link>
        </header>

        <AudiencePanel subs={rows} offers={offers ?? []} />

        <SubscribersList subscribers={rows} initialFilter={status} />
      </div>
    </AdminShell>
  );
}
