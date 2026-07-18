import { requireStaff, listFormatsAndCategories } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { ArticleEditor, type EditorArticle } from "@/components/admin/article-editor";

export const metadata = { title: "New article | Newsroom", robots: { index: false } };

const EMPTY: EditorArticle = {
  id: null,
  slug: "",
  title: "",
  subtitle: "",
  excerpt: "",
  kicker: "",
  body: "",
  category_id: "",
  format_id: "",
  cover_image: "",
  status: "draft",
  series_id: "",
  series_position: "",
  featured: false,
  meta_title: "",
  meta_description: "",
};

export default async function NewArticlePage() {
  const profile = await requireStaff();
  const { formats, categories, series } = await listFormatsAndCategories();

  return (
    <ArticleEditor
      article={EMPTY}
      categories={categories}
      formats={formats}
      series={series}
      canPublish={hasRole(profile.role, ["admin", "editor"])}
      justSaved={false}
    />
  );
}
