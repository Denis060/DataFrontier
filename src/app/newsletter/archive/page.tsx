import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { Pagination } from "@/components/article-list";
import { getNewsletterIssues, paginate, toPageNumber } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Newsletter Archive",
  description: "Past issues of Everyday Data Science weekly dispatch.",
};

export const revalidate = 300;

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

export default async function NewsletterArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = toPageNumber((await searchParams).page);
  const { items, total, perPage } = paginate(await getNewsletterIssues(), page);
  if (page > 1 && items.length === 0) notFound();

  return (
    <Shell>
      <header className="border-b border-border px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[760px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-teal">Archive</p>
          <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            Every issue, in one place
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            The weekly dispatch, AI research, agentic breakdowns, and career intelligence.{" "}
            <Link href="/newsletter" className="text-gold hover:underline">
              Subscribe free →
            </Link>
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8">
        {total === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No issues published yet.
          </p>
        ) : (
          <>
          <ul className="divide-y divide-border border-y border-border">
            {items.map((issue) => (
              <li key={issue.issue_number}>
                <Link href={`/newsletter/${issue.slug}`} className="flex items-baseline gap-4 py-5 hover:opacity-80">
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    #{String(issue.issue_number).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-bold">{issue.title}</p>
                    {issue.summary && (
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">{issue.summary}</p>
                    )}
                    <p className="mt-1.5 font-mono text-[11px] text-muted">{fmt(issue.sent_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={total} perPage={perPage} basePath="/newsletter/archive" />
          </>
        )}
      </div>
    </Shell>
  );
}
