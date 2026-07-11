import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { ArticleList, Pagination } from "@/components/article-list";
import { BrandIcon } from "@/components/brand-icons";
import { getArticlesByAuthor, getAuthor, getFollowState } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";
import { FollowButton } from "@/components/follow-button";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

const toPage = (raw?: string) => Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return { title: "Not found" };

  return {
    title: `${author.full_name} — The Data Frontier`,
    description: author.bio ?? author.title ?? undefined,
    alternates: { canonical: `/author/${slug}` },
  };
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const author = await getAuthor(slug);
  if (!author) notFound();

  const viewer = await getCurrentProfile();
  const page = toPage(sp.page);
  const [{ items, total, perPage }, follow] = await Promise.all([
    getArticlesByAuthor(author.id, page),
    getFollowState({ authorId: author.id }, viewer?.id ?? null),
  ]);
  if (page > 1 && items.length === 0) notFound();

  // `socials` is jsonb, so it arrives untyped; only keep non-empty string values.
  const socials = Object.entries((author.socials ?? {}) as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
  );

  return (
    <Shell>
      <header className="border-b border-border bg-bg2 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full border-[3px] border-gold/30 bg-linear-135 from-gold to-[#4A3000] font-serif text-[26px] font-black text-on-accent">
            {initials(author.full_name)}
          </span>
          <div>
            <h1 className="font-serif text-[clamp(26px,4vw,38px)] leading-tight font-black tracking-[-0.8px]">
              {author.full_name}
            </h1>
            {author.title && <p className="mt-1 text-sm text-muted">{author.title}</p>}
            {author.bio && (
              <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-muted">
                {author.bio}
              </p>
            )}
            <div className="mt-5">
              <FollowButton
                authorId={author.id}
                initialFollowing={follow.following}
                initialCount={follow.count}
                canFollow={!!viewer && viewer.id !== author.id}
                path={`/author/${slug}`}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-muted">
                {total} {total === 1 ? "article" : "articles"}
              </span>
              {socials.length > 0 && (
                <div className="flex gap-2">
                  {socials.map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={platform}
                      className="inline-flex size-8 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-strong hover:text-ink"
                    >
                      <BrandIcon name={platform} className="size-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
        <ArticleList articles={items} />
        <Pagination page={page} total={total} perPage={perPage} basePath={`/author/${slug}`} />
      </div>
    </Shell>
  );
}
