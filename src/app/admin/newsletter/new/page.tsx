import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { IssueComposer, type IssueDraft } from "@/components/admin/issue-composer";
import { SECTION_DEFS } from "@/lib/newsletter";

export const metadata = { title: "New issue — Newsroom", robots: { index: false } };

const EMPTY: IssueDraft = {
  id: null,
  title: "",
  summary: "",
  status: "draft",
  scheduled_for: null,
  content: {},
};

export default async function NewIssuePage() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) redirect("/admin/newsletter");

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <IssueComposer issue={EMPTY} sections={SECTION_DEFS} justSaved={false} />
    </AdminShell>
  );
}
