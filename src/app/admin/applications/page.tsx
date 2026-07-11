import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ApplicationsList } from "@/components/admin/applications-list";

export const metadata = { title: "Applications — Newsroom", robots: { index: false } };

export default async function ApplicationsPage() {
  const profile = await requireStaff();
  const db = await createClient();

  // RLS lets staff read all applications; most recent first. The client list
  // handles filtering, search, collapse, and paging.
  const { data } = await db
    .from("author_applications")
    .select(
      "id, bio, topics, writing_links, status, review_note, created_at, applicant:profiles!author_applications_profile_id_fkey(full_name, slug)",
    )
    .order("created_at", { ascending: false });

  const apps = data ?? [];
  const canApprove = hasRole(profile.role, ["admin"]);

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[760px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Contributor applications</h1>
        <p className="mb-8 text-[13px] text-muted">
          {canApprove
            ? "Approve to grant author access; the applicant is promoted automatically."
            : "Only an admin can approve — approval grants author access."}
        </p>

        {apps.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No applications yet.
          </p>
        ) : (
          <ApplicationsList apps={apps} canApprove={canApprove} />
        )}
      </div>
    </AdminShell>
  );
}
