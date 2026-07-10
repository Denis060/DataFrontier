import { requireStaff, listFormatsAndCategories } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { ArticleEditor, type EditorArticle } from "@/components/admin/article-editor";

export const metadata = { title: "New article — Newsroom", robots: { index: false } };

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
};

export default async function NewArticlePage() {
  const profile = await requireStaff();
  const { formats, categories } = await listFormatsAndCategories();

  return (
    <ArticleEditor
      article={EMPTY}
      categories={categories}
      formats={formats}
      canPublish={hasRole(profile.role, ["admin", "editor"])}
      justSaved={false}
    />
  );
}
