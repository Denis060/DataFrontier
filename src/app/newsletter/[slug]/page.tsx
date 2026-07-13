import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Shell } from "@/components/layout/shell";
import { getNewsletterIssueBySlug } from "@/lib/queries";
import { SECTION_DEFS, type IssueContent } from "@/lib/newsletter";

export const revalidate = 300;

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getNewsletterIssueBySlug(slug);
  if (!issue) return { title: "Issue not found" };
  const title = `${issue.title} | Everyday Data Science`;
  return {
    title,
    description: issue.summary ?? undefined,
    alternates: { canonical: `/newsletter/${issue.slug}` },
    openGraph: { title, description: issue.summary ?? undefined, type: "article" },
  };
}

export default async function NewsletterIssuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const issue = await getNewsletterIssueBySlug(slug);
  if (!issue) notFound();

  const content = (issue.content ?? {}) as IssueContent;
  const sections = SECTION_DEFS.filter((def) => {
    const s = content[def.key];
    return s && (s.text || s.url || s.image_url);
  });

  return (
    <Shell>
      <article className="mx-auto w-full max-w-[680px] px-5 py-12 sm:px-8 lg:py-16">
        <header className="border-b border-border pb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-teal">
            The Everyday Brief · Issue #{String(issue.issue_number).padStart(2, "0")}
          </p>
          <h1 className="font-serif text-[clamp(28px,4.5vw,40px)] leading-[1.12] font-black tracking-[-1px]">
            {issue.title}
          </h1>
          {issue.summary && (
            <p className="mt-4 text-[17px] leading-relaxed text-muted">{issue.summary}</p>
          )}
          {fmt(issue.sent_at) && (
            <p className="mt-4 font-mono text-[11px] text-muted">{fmt(issue.sent_at)}</p>
          )}
        </header>

        {content.intro && (
          <p className="mt-8 text-[17px] leading-[1.7] text-ink">
            <Inline text={content.intro} />
          </p>
        )}

        <div className="mt-4">
          {sections.map((def) => {
            const s = content[def.key]!;
            return (
              <section key={def.key} className="mt-10">
                <h2 className="font-mono text-[11px] uppercase tracking-[1.5px] text-gold">{def.label}</h2>
                {def.hasImage && s.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image_url}
                    alt={s.text ? s.text.slice(0, 90) : def.label}
                    className="mt-3 w-full rounded-md border border-border"
                  />
                )}
                {s.text && (
                  <p className="mt-3 text-[16px] leading-[1.7] text-ink">
                    <Inline text={s.text} />
                  </p>
                )}
                {def.hasUrl && s.url && (
                  <p className="mt-3">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-gold hover:underline">
                      Read more →
                    </a>
                  </p>
                )}
              </section>
            );
          })}
        </div>

        <footer className="mt-14 border-t border-border pt-8">
          <p className="text-[15px] text-muted">
            Get the next issue in your inbox.{" "}
            <Link href="/newsletter" className="font-bold text-gold hover:underline">
              Subscribe free →
            </Link>
          </p>
          <p className="mt-3 text-[13px]">
            <Link href="/newsletter/archive" className="text-muted hover:text-ink">
              ← All issues
            </Link>
          </p>
        </footer>
      </article>
    </Shell>
  );
}

/**
 * Minimal, XSS-safe inline formatter for section text: **bold**, *italic*, and
 * line breaks. Builds React nodes rather than injecting HTML, so authored text
 * can never inject markup.
 */
function Inline({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {formatLine(line)}
        </Fragment>
      ))}
    </>
  );
}

function formatLine(line: string) {
  // Split on **bold** and *italic* while keeping the delimiters' content.
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
