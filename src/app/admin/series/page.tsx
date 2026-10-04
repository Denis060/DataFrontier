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
    .select("id, title, slug, description, long_description, sort_order, cover_url, articles(id, slug, title, status, cover_image, reading_time, series_position)")
    .order("sort_order")
    .order("series_position", { referencedTable: "articles", ascending: true, nullsFirst: false });

  type Row = Omit<Series, "lessons"> & { articles: Series["lessons"] };
  const series: Series[] = ((data ?? []) as unknown as Row[]).map(({ articles, ...s }) => ({ ...s, lessons: articles ?? [] }));

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="w-full max-w-[1440px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Learning Paths</h1>
        <p className="mb-8 text-[13px] text-muted">
          Each path is a set of articles meant to be read in order. Add an article to a path from its editor
          (under <span className="text-ink">Series</span>), then arrange the lessons here.
        </p>
        <SeriesManager series={series} />
      </div>
    </AdminShell>
  );
}
