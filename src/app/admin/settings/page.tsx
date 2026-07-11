import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm, type Settings } from "@/components/admin/settings-form";

export const metadata = { title: "Settings — Newsroom", robots: { index: false } };

export default async function AdminSettingsPage() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin"])) redirect("/admin");

  const db = await createClient();
  const { data } = await db
    .from("site_settings")
    .select(
      "site_name, tagline, established_year, contact_email, default_meta_title, default_meta_description, newsletter_headline, newsletter_subtext, newsletter_show_stats, spotlight_headline, spotlight_body, spotlight_cta_url",
    )
    .eq("id", true)
    .single();

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Settings</h1>
        <p className="mb-8 text-[13px] text-muted">
          Site-wide identity and homepage copy. Changes go live immediately.
        </p>
        <SettingsForm settings={(data ?? {}) as Settings} />
      </div>
    </AdminShell>
  );
}
