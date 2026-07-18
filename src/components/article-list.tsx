import Link from "next/link";
import { Pill } from "@/components/pill";
import type { ArticleCard } from "@/lib/queries";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

export function ArticleList({ articles }: { articles: ArticleCard[] }) {
  if (articles.length === 0) {
    return (
      <p className="border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
        Nothing published here yet.
      </p>
    );
  }

  return (
    <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a) => (
        <Link key={a.id} href={`/article/${a.slug}`} className="group flex flex-col">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            {a.format && <Pill color={a.format.color}>{a.format.name}</Pill>}
            {a.kicker && (
              <span className="font-mono text-[9px] uppercase tracking-[1.5px] text-muted">
                {a.kicker}
              </span>
            )}
          </div>
          <h2 className="mb-2 font-serif text-xl leading-[1.25] font-bold transition-opacity group-hover:opacity-75">
            {a.title}
          </h2>
          {a.excerpt && (
            <p className="mb-3 text-[13px] leading-[1.6] text-muted">{a.excerpt}</p>
          )}
          <p className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span>{a.author?.full_name}</span>
            <span className="opacity-40">·</span>
            <span>{fmtDate(a.published_at)}</span>
            <span className="opacity-40">·</span>
            <span>{a.reading_time} min</span>
          </p>
        </Link>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  total,
  perPage,
  basePath,
}: {
  page: number;
  total: number;
  perPage: number;
  basePath: string;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  // basePath may already carry a query string (e.g. /search?q=term), so pick
  // the right separator and only add page= for pages past the first.
  const sep = basePath.includes("?") ? "&" : "?";
  const href = (p: number) => (p === 1 ? basePath : `${basePath}${sep}page=${p}`);
  const link =
    "inline-flex items-center rounded border border-border px-4 py-2 text-[13px] transition-colors hover:border-border-strong hover:bg-surface-1";

  return (
    <nav className="mt-14 flex items-center justify-between" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={link} rel="prev">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={link} rel="next">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
