import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff, listArticles } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Articles — Newsroom", robots: { index: false } };

const STATUSES = ["all", "draft", "in_review", "changes_requested", "published", "archived"];

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [profile, { status = "all" }] = await Promise.all([requireStaff(), searchParams]);
  const articles = await listArticles(status);

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[1000px] px-5 py-10 sm:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">Articles</h1>
            <p className="mt-1 text-[13px] text-muted">
              {profile.role === "author"
                ? "Your drafts and published work."
                : "Every article across the newsroom."}
            </p>
          </div>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
          >
            <Plus className="size-4" aria-hidden />
            New article
          </Link>
        </header>

        <nav className="mb-6 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={s === "all" ? "/admin/articles" : `/admin/articles?status=${s}`}
              className={`rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-[1px] transition-colors ${
                status === s ? "bg-gold-dim text-gold" : "text-muted hover:bg-surface-1 hover:text-ink"
              }`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </nav>

        {articles.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Nothing here yet.{" "}
            <Link href="/admin/articles/new" className="text-gold hover:underline">
              Write the first one →
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="flex items-center gap-4 py-4 transition-colors hover:bg-surface-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[15px] font-bold">{a.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {a.author?.full_name}
                      {a.category && ` · ${a.category.name}`} · edited {fmt(a.updated_at)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
