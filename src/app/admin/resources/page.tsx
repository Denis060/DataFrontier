import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ResourcesManager, type Resource } from "@/components/admin/resources-manager";

export const metadata = { title: "Resources — Newsroom", robots: { index: false } };

export default async function AdminResourcesPage() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) redirect("/admin");

  const db = await createClient();
  const { data } = await db
    .from("resources")
    .select("id, title, emoji, description, url, cta_label, sort_order, is_active")
    .order("sort_order");

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[760px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Tools &amp; Resources</h1>
        <p className="mb-8 text-[13px] text-muted">
          The items in the homepage “Tools &amp; Resources” column. Lowest order shows first;
          uncheck “Show on homepage” to hide one without deleting it.
        </p>
        <ResourcesManager resources={(data ?? []) as Resource[]} />
      </div>
    </AdminShell>
  );
}
