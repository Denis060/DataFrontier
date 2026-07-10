import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CheatSheetForm, type CheatSheetDraft } from "@/components/admin/cheat-sheet-form";

export const metadata = { title: "Edit cheat sheet — Newsroom", robots: { index: false } };

export default async function EditCheatSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;
  const db = await createClient();

  const [{ data: row }, { data: categories }] = await Promise.all([
    db.from("cheat_sheets").select("*").eq("id", id).maybeSingle(),
    db.from("categories").select("id, name").order("sort_order"),
  ]);
  if (!row) notFound();

  const sheet: CheatSheetDraft = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    image_url: row.image_url,
    download_url: row.download_url ?? "",
    category_id: row.category_id ?? "",
    published: row.published,
  };

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <CheatSheetForm sheet={sheet} categories={categories ?? []} />
    </AdminShell>
  );
}
