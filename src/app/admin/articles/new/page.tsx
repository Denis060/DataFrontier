import { requireStaff, listFormatsAndCategories, listWriterProfiles } from "@/lib/admin";
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
  canonical_url: "",
  review_note: "",
  tags: "",
  coauthor_ids: [],
  guest_authors: [],
  author_id: null, // set per request below: the writer is the primary author
};

export default async function NewArticlePage() {
  const profile = await requireStaff();
  const [{ formats, categories, series }, writers] = await Promise.all([listFormatsAndCategories(), listWriterProfiles()]);

  return (
    <ArticleEditor
      article={{ ...EMPTY, author_id: profile.id }}
      categories={categories}
      formats={formats}
      series={series}
      writers={writers}
      canPublish={hasRole(profile.role, ["admin", "editor"])}
      justSaved={false}
    />
  );
}
