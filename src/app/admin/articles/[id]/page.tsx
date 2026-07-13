import { notFound } from "next/navigation";
import { requireStaff, getArticleForEdit, listFormatsAndCategories } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { ArticleEditor, type EditorArticle } from "@/components/admin/article-editor";

export const metadata = { title: "Edit article — Newsroom", robots: { index: false } };

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [profile, { id }, { saved }] = await Promise.all([
    requireStaff(),
    params,
    searchParams,
  ]);

  const [row, { formats, categories, series }] = await Promise.all([
    getArticleForEdit(id, profile),
    listFormatsAndCategories(),
  ]);
  // An author reaching for someone else's article gets null → 404.
  if (!row) notFound();

  const article: EditorArticle = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    excerpt: row.excerpt ?? "",
    kicker: row.kicker ?? "",
    body: row.body ?? "",
    category_id: row.category_id ?? "",
    format_id: row.format_id ?? "",
    cover_image: row.cover_image ?? "",
    status: row.status,
    series_id: row.series_id ?? "",
    series_position: row.series_position != null ? String(row.series_position) : "",
  };

  return (
    <ArticleEditor
      article={article}
      categories={categories}
      formats={formats}
      series={series}
      canPublish={hasRole(profile.role, ["admin", "editor"])}
      justSaved={saved === "1"}
    />
  );
}
