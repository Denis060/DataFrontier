import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emailConfigured } from "@/lib/email";
import { AdminShell } from "@/components/admin/admin-shell";
import { SendIssueButton } from "@/components/admin/send-issue-button";

export const metadata = { title: "Newsletter — Newsroom", robots: { index: false } };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default async function AdminNewsletterPage() {
  const profile = await requireStaff();
  const db = await createClient();

  const [issuesRes, confirmedRes, pendingRes] = await Promise.all([
    db.from("newsletter_issues").select("id, issue_number, title, sent_at, recipients").order("issue_number", { ascending: false }),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    db.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const issues = issuesRes.data ?? [];
  const isAdmin = hasRole(profile.role, ["admin"]);

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Newsletter</h1>
        <p className="mb-6 text-[13px] text-muted">
          {confirmedRes.count ?? 0} confirmed · {pendingRes.count ?? 0} pending confirmation
        </p>

        {!emailConfigured && (
          <p className="mb-6 rounded border border-gold/30 bg-gold-dim px-4 py-3 text-[13px] text-gold">
            Sending is disabled until <code>RESEND_API_KEY</code> is set in <code>.env.local</code>.
            Subscriptions still record; confirmation emails are logged to the server console.
          </p>
        )}

        {issues.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No issues yet.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {issues.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-4">
                <span className="font-mono text-[11px] text-muted">#{String(i.issue_number).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate font-serif text-[15px] font-bold">{i.title}</span>
                {i.sent_at ? (
                  <span className="font-mono text-[11px] text-teal">
                    sent {fmt(i.sent_at)} · {i.recipients ?? 0}
                  </span>
                ) : isAdmin ? (
                  <SendIssueButton issueId={i.id} disabled={!emailConfigured} />
                ) : (
                  <span className="font-mono text-[11px] text-muted">draft</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
