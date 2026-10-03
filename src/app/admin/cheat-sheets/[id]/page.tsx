import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CheatSheetForm, type CheatSheetDraft } from "@/components/admin/cheat-sheet-form";
import { isTrusted } from "@/lib/trust";

export const metadata = { title: "Edit cheat sheet | Newsroom", robots: { index: false } };

export default async function EditCheatSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const profile = await requireStaff();
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const isStaff = hasRole(profile.role, ["admin", "editor"]);
  const canPublish = isStaff || (await isTrusted(profile.id));
  const db = await createClient();

  const [{ data: row }, { data: categories }] = await Promise.all([
    db.from("cheat_sheets").select("*").eq("id", id).maybeSingle(),
    db.from("categories").select("id, name").order("sort_order"),
  ]);
  if (!row) notFound();
  // An author reaching for someone else's cheat sheet gets a 404.
  if (!hasRole(profile.role, ["admin", "editor"]) && row.author_id !== profile.id) notFound();

  const sheet: CheatSheetDraft = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    image_url: row.image_url,
    download_url: row.download_url ?? "",
    category_id: row.category_id ?? "",
    status: row.status ?? (row.published ? "published" : "draft"),
    review_note: row.review_note ?? "",
  };

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <CheatSheetForm
        sheet={sheet}
        categories={categories ?? []}
        canPublish={canPublish}
        isStaff={isStaff}
        justSaved={saved === "1" || saved === "sent"}
        justSent={saved === "sent"}
      />
    </AdminShell>
  );
}
