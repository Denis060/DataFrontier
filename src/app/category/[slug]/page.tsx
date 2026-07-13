import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { ArticleList, Pagination } from "@/components/article-list";
import { getArticlesByCategory, getCategory, getFollowState } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";
import { FollowButton } from "@/components/follow-button";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

/** Clamp to a sane integer so `?page=-3` or `?page=abc` can't reach the query. */
const toPage = (raw?: string) => Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Not found" };

  return {
    title: `${category.name}`,
    description: category.description ?? `Articles on ${category.name}.`,
    // Canonical to page 1 so ?page= variants don't split ranking.
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  const viewer = await getCurrentProfile();
  const page = toPage(sp.page);
  const [{ items, total, perPage }, follow] = await Promise.all([
    getArticlesByCategory(category.id, page),
    getFollowState({ categoryId: category.id }, viewer?.id ?? null),
  ]);

  // Page 1 of an empty category is a valid, informative page. Page 7 of a
  // 2-page category is not — that's a broken URL, and should say so.
  if (page > 1 && items.length === 0) notFound();

  return (
    <Shell>
      <header className="border-b border-border px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <p className="mb-3 text-3xl">{category.icon}</p>
          <h1 className="mb-3 font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-[620px] text-[15px] leading-relaxed text-muted">
              {category.description}
            </p>
          )}
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[2px] text-muted">
            {total} {total === 1 ? "article" : "articles"}
          </p>
          <div className="mt-5">
            <FollowButton
              categoryId={category.id}
              initialFollowing={follow.following}
              initialCount={follow.count}
              canFollow={!!viewer}
              path={`/category/${slug}`}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
        <ArticleList articles={items} />
        <Pagination page={page} total={total} perPage={perPage} basePath={`/category/${slug}`} />
      </div>
    </Shell>
  );
}
