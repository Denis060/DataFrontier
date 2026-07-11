import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CommentRow } from "@/components/admin/comment-row";

export const metadata = { title: "Comments — Newsroom", robots: { index: false } };

export default async function AdminCommentsPage() {
  const profile = await requireStaff();
  if (!hasRole(profile.role, ["admin", "editor"])) redirect("/admin");

  const db = await createClient();
  // Staff read all comments (RLS). Pending first, then most recent.
  const { data } = await db
    .from("comments")
    .select("id, body, is_approved, created_at, author:profiles(full_name), article:articles(title, slug)")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const pending = rows.filter((r) => !r.is_approved);
  const approved = rows.filter((r) => r.is_approved);

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[760px] px-5 py-10 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Comments</h1>
        <p className="mb-8 text-[13px] text-muted">
          New comments start hidden until you approve them.
        </p>

        {rows.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No comments yet.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {pending.length > 0 && (
              <section>
                <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-gold">
                  Pending ({pending.length})
                </h2>
                {pending.map((r) => (
                  <CommentRow key={r.id} row={r} />
                ))}
              </section>
            )}
            <section>
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[2px] text-muted">
                Approved ({approved.length})
              </h2>
              {approved.length === 0 ? (
                <p className="py-4 text-sm text-muted">None yet.</p>
              ) : (
                approved.map((r) => <CommentRow key={r.id} row={r} />)
              )}
            </section>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
