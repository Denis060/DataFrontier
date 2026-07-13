import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "Cheat Sheets | Newsroom", robots: { index: false } };

export default async function AdminCheatSheetsPage() {
  const profile = await requireStaff();
  const db = await createClient();
  let q = db
    .from("cheat_sheets")
    .select("id, title, slug, published, created_at")
    .order("created_at", { ascending: false });
  // Same as articles: authors see only their own; editors/admins see all.
  if (!hasRole(profile.role, ["admin", "editor"])) q = q.eq("author_id", profile.id);
  const { data } = await q;
  const sheets = data ?? [];

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">Cheat Sheets</h1>
          <Link
            href="/admin/cheat-sheets/new"
            className="inline-flex items-center gap-2 rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85"
          >
            <Plus className="size-4" /> New cheat sheet
          </Link>
        </header>

        {sheets.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No cheat sheets yet.{" "}
            <Link href="/admin/cheat-sheets/new" className="text-gold hover:underline">Add the first →</Link>
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {sheets.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/cheat-sheets/${s.id}`} className="flex items-center gap-3 py-4 hover:bg-surface-1">
                  <span className="min-w-0 flex-1 truncate font-serif text-[15px] font-bold">{s.title}</span>
                  <span
                    className={`rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] ${
                      s.published ? "bg-teal-dim text-teal" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {s.published ? "published" : "draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
