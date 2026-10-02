import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { IssueComposer, type IssueDraft } from "@/components/admin/issue-composer";
import { IssueStats } from "@/components/admin/issue-stats";
import { SECTION_DEFS } from "@/lib/newsletter";
import { composerSources } from "@/app/admin/newsletter/sources";
import { sentCounts } from "@/lib/newsletter-stats";

export const metadata = { title: "Edit issue | Newsroom", robots: { index: false } };

export default async function EditIssuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) redirect("/admin/newsletter");

  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const db = await createClient();
  const sources = await composerSources();
  const { data: row } = await db
    .from("newsletter_issues")
    .select("id, title, summary, status, scheduled_for, content, recipients, delivered_count, opened_count, bounced_count, complained_count")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const showStats = row.status === "sending" || row.status === "sent";
  const recipients = showStats ? ((await sentCounts(db, [row.id])).get(row.id) ?? row.recipients ?? 0) : 0;
  // Click data lives in columns added by migration 20261004120000; read it
  // separately so the page still works before that migration runs.
  let clicked: number | null = null;
  let topLinks: { link: string; clicks: number }[] = [];
  if (showStats) {
    const [{ data: c, error: ce }, { data: links }] = await Promise.all([
      db.from("newsletter_issues").select("clicked_count").eq("id", row.id).maybeSingle(),
      db.from("email_link_clicks" as never).select("link").eq("issue_id" as never, row.id as never),
    ]);
    if (!ce && c) clicked = c.clicked_count ?? 0;
    const tally = new Map<string, number>();
    for (const l of (links ?? []) as { link: string }[]) tally.set(l.link, (tally.get(l.link) ?? 0) + 1);
    topLinks = [...tally].map(([link, clicks]) => ({ link, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 8);
  }

  const issue: IssueDraft = {
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    status: row.status,
    scheduled_for: row.scheduled_for,
    content: (row.content ?? {}) as IssueDraft["content"],
  };

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      {showStats && (
        <div className="mx-auto w-full max-w-[760px] px-5 pt-10 sm:px-8">
          <IssueStats
            recipients={recipients}
            clicked={clicked}
            topLinks={topLinks}
            delivered={row.delivered_count ?? 0}
            opened={row.opened_count ?? 0}
            bounced={row.bounced_count ?? 0}
            complained={row.complained_count ?? 0}
          />
        </div>
      )}
      <IssueComposer issue={issue} sections={SECTION_DEFS} justSaved={saved === "1"} sources={sources} />
    </AdminShell>
  );
}
