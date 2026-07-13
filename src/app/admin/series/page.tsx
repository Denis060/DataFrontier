import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { SeriesManager, type Series } from "@/components/admin/series-manager";

export const metadata = { title: "Learning Paths | Newsroom", robots: { index: false } };

export default async function AdminSeriesPage() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) redirect("/admin");

  const db = await createClient();
  const { data } = await db
    .from("series")
    .select("id, title, slug, description, sort_order, articles(count)")
    .order("sort_order");

  const series: Series[] = (data ?? []).map((s) => {
    const row = s as unknown as { id: string; title: string; slug: string; description: string | null; sort_order: number; articles: { count: number }[] };
    return { id: row.id, title: row.title, slug: row.slug, description: row.description, sort_order: row.sort_order, count: row.articles?.[0]?.count ?? 0 };
  });

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[760px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Learning Paths</h1>
        <p className="mb-8 text-[13px] text-muted">
          Create a series, then assign articles to it (and set their order) from each article&apos;s editor,
          under <span className="text-ink">Series</span>.
        </p>
        <SeriesManager series={series} />
      </div>
    </AdminShell>
  );
}
