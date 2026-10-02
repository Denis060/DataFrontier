import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { ArticleList, Pagination } from "@/components/article-list";
import { getTagPage, toPageNumber } from "@/lib/queries";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTagPage(slug);
  if (!data) return { title: "Not found" };
  return {
    title: `#${data.tag.name}`,
    description: `Articles tagged ${data.tag.name} on Everyday Data Science.`,
    alternates: { canonical: `/tag/${slug}` },
    // Thin tag pages shouldn't compete with articles in search.
    robots: data.total < 3 ? { index: false, follow: true } : undefined,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = toPageNumber(sp.page);
  const data = await getTagPage(slug, page);
  if (!data || (page > 1 && data.items.length === 0)) notFound();

  return (
    <Shell>
      <header className="border-b border-border bg-bg2 px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1100px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Tag</p>
          <h1 className="font-serif text-[clamp(28px,4.5vw,42px)] leading-tight font-black tracking-[-0.5px]">
            #{data.tag.name}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
            {data.total} {data.total === 1 ? "article" : "articles"}
          </p>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
        <ArticleList articles={data.items} />
        <Pagination page={page} total={data.total} perPage={data.perPage} basePath={`/tag/${slug}`} />
      </div>
    </Shell>
  );
}
