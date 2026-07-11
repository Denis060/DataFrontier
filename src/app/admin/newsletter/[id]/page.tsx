import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { IssueComposer, type IssueDraft } from "@/components/admin/issue-composer";
import { SECTION_DEFS } from "@/lib/newsletter";

export const metadata = { title: "Edit issue — Newsroom", robots: { index: false } };

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
  const { data: row } = await db
    .from("newsletter_issues")
    .select("id, title, summary, status, scheduled_for, content")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

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
      <IssueComposer issue={issue} sections={SECTION_DEFS} justSaved={saved === "1"} />
    </AdminShell>
  );
}
