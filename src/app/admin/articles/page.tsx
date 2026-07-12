import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff, listArticles } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { ArticlesList } from "@/components/admin/articles-list";

export const metadata = { title: "Articles — Newsroom", robots: { index: false } };

export default async function AdminArticlesPage() {
  const profile = await requireStaff();
  // Fetch all (already author-scoped in listArticles); the client list filters,
  // searches, and pages.
  const articles = await listArticles(undefined, profile);

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

        {articles.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Nothing here yet.{" "}
            <Link href="/admin/articles/new" className="text-gold hover:underline">
              Write the first one →
            </Link>
          </p>
        ) : (
          <ArticlesList articles={articles} />
        )}
      </div>
    </AdminShell>
  );
}
