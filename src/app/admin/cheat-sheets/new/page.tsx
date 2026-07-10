import { requireStaff } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CheatSheetForm, type CheatSheetDraft } from "@/components/admin/cheat-sheet-form";

export const metadata = { title: "New cheat sheet — Newsroom", robots: { index: false } };

const EMPTY: CheatSheetDraft = {
  id: null,
  title: "",
  slug: "",
  description: "",
  image_url: "",
  download_url: "",
  category_id: "",
  published: false,
};

export default async function NewCheatSheetPage() {
  const profile = await requireStaff();
  const db = await createClient();
  const { data: categories } = await db.from("categories").select("id, name").order("sort_order");

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <CheatSheetForm sheet={EMPTY} categories={categories ?? []} />
    </AdminShell>
  );
}
