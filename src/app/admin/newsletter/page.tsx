import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emailConfigured } from "@/lib/email";
import { AdminShell } from "@/components/admin/admin-shell";
import { NewsletterList } from "@/components/admin/newsletter-list";

export const metadata = { title: "Newsletter — Newsroom", robots: { index: false } };

export default async function AdminNewsletterPage() {
  const profile = await requireStaff();
  const db = await createClient();

  const [issuesRes, confirmedRes, pendingRes] = await Promise.all([
    db.from("newsletter_issues").select("id, issue_number, title, status, scheduled_for, sent_at, recipients").order("issue_number", { ascending: false }),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const issues = issuesRes.data ?? [];

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">Newsletter</h1>
            <p className="mt-1 text-[13px] text-muted">
              {confirmedRes.count ?? 0} confirmed · {pendingRes.count ?? 0} pending confirmation
              {hasRole(profile.role, ["admin"]) && (
                <>
                  {" · "}
                  <Link href="/admin/newsletter/subscribers" className="text-gold hover:underline">
                    View subscribers →
                  </Link>
                </>
              )}
            </p>
          </div>
          <Link href="/admin/newsletter/new" className="inline-flex items-center gap-2 rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85">
            <Plus className="size-4" /> New issue
          </Link>
        </header>

        {!emailConfigured && (
          <p className="mb-6 rounded border border-gold/30 bg-gold-dim px-4 py-3 text-[13px] text-gold">
            Sending needs <code>RESEND_API_KEY</code> and a verified domain. You can compose and
            schedule now; nothing is delivered until that lands and the first send is approved.
          </p>
        )}

        {issues.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No issues yet.{" "}
            <Link href="/admin/newsletter/new" className="text-gold hover:underline">Compose the first →</Link>
          </p>
        ) : (
          <NewsletterList issues={issues} />
        )}
      </div>
    </AdminShell>
  );
}
