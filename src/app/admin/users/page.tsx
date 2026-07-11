import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { RoleSelect } from "@/components/admin/role-select";

export const metadata = { title: "People — Newsroom", robots: { index: false } };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default async function AdminUsersPage() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin"])) redirect("/admin");

  const db = await createClient();
  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name, slug, role, created_at")
    .order("created_at", { ascending: true });

  // Emails live in auth.users, not profiles — fetch them with the service role
  // and map by id.
  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  const rows = profiles ?? [];
  const staffCount = rows.filter((r) => r.role !== "reader").length;

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">People</h1>
        <p className="mb-8 text-[13px] text-muted">
          {rows.length} {rows.length === 1 ? "account" : "accounts"} · {staffCount} with newsroom access.
          Changing a role takes effect immediately.
        </p>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-border bg-bg2 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-surface-1">
                  <td className="px-4 py-3 font-serif text-[14px] font-bold">{u.full_name}</td>
                  <td className="px-4 py-3 text-[13px] text-muted">{emailById.get(u.id) || "—"}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted">{fmt(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={u.id} role={u.role} disabled={u.id === profile.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
