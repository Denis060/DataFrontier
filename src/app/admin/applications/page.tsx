import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ApplicationsList } from "@/components/admin/applications-list";

export const metadata = { title: "Applications | Newsroom", robots: { index: false } };

export default async function ApplicationsPage() {
  const profile = await requireStaff();
  const db = await createClient();

  // RLS lets staff read all applications; most recent first. The client list
  // handles filtering, search, collapse, and paging.
  const { data } = await db
    .from("author_applications")
    .select(
      "id, bio, topics, writing_links, status, review_note, created_at, profile_id, applicant:profiles!author_applications_profile_id_fkey(full_name, slug, avatar_url)",
    )
    .order("created_at", { ascending: false });

  const canApprove = hasRole(profile.role, ["admin"]);
  // Admins can email a pending applicant directly. Emails live in auth, so
  // they're looked up with the service role, and only for the few pending.
  const rows = data ?? [];
  const emails = new Map<string, string>();
  if (canApprove) {
    const admin = createAdminClient();
    await Promise.all(
      rows
        .filter((r) => r.status === "pending")
        .map(async (r) => {
          const { data: u } = await admin.auth.admin.getUserById(r.profile_id);
          if (u?.user?.email) emails.set(r.id, u.user.email);
        }),
    );
  }
  const apps = rows.map((r) => ({ ...r, email: emails.get(r.id) ?? null }));

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Contributor applications</h1>
        <p className="mb-8 text-[13px] text-muted">
          {canApprove
            ? "Approve to grant author access; the applicant is promoted automatically."
            : "Only an admin can approve, approval grants author access."}
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
