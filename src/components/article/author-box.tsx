import Link from "next/link";
import { AuthorAvatar } from "@/components/author-avatar";
import { BrandIcon } from "@/components/brand-icons";
import { FollowButton } from "@/components/follow-button";

/**
 * "About the writer" card at the end of an article, so readers meet the
 * person, not just the publication, and can follow them from where they
 * finished reading.
 */
export function AuthorBox({
  author,
  authorId,
  follow,
  canFollow,
  path,
}: {
  author: {
    full_name: string;
    slug: string | null;
    title: string | null;
    bio: string | null;
    avatar_url: string | null;
    socials: unknown;
  };
  authorId: string;
  follow: { following: boolean; count: number };
  canFollow: boolean;
  path: string;
}) {
  const socials = Object.entries((author.socials ?? {}) as Record<string, unknown>).filter(
    (e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0,
  );
  const href = author.slug ? `/author/${author.slug}` : null;
  const first = author.full_name.split(" ")[0];

  return (
    <section aria-label="About the writer" className="mt-12 rounded-lg border border-border bg-bg2 p-5 sm:p-6">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[2px] text-muted">About the writer</p>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {href ? (
          <Link href={href} className="shrink-0">
            <AuthorAvatar name={author.full_name} src={author.avatar_url} className="size-16 text-xl" />
          </Link>
        ) : (
          <AuthorAvatar name={author.full_name} src={author.avatar_url} className="size-16 text-xl" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {href ? (
                <Link href={href} className="font-serif text-[20px] leading-tight font-black hover:text-gold">
                  {author.full_name}
                </Link>
              ) : (
                <p className="font-serif text-[20px] leading-tight font-black">{author.full_name}</p>
              )}
              {author.title && <p className="mt-0.5 text-[12px] text-muted">{author.title}</p>}
            </div>
            <FollowButton
              authorId={authorId}
              initialFollowing={follow.following}
              initialCount={follow.count}
              canFollow={canFollow}
              path={path}
            />
          </div>
          {author.bio && <p className="mt-3 text-[14px] leading-relaxed text-muted">{author.bio}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {socials.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${author.full_name} on ${platform}`}
                className="inline-flex size-8 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-strong hover:text-ink"
              >
                <BrandIcon name={platform} className="size-4" />
              </a>
            ))}
            {href && (
              <Link href={href} className="text-[13px] font-semibold text-gold hover:underline">
                More from {first} →
              </Link>
            )}
            <Link href="/authors" className="text-[13px] text-muted hover:text-gold">
              All writers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
