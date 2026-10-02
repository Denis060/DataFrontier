import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { getNewsletterIssueBySlug } from "@/lib/queries";
import { SECTION_DEFS, richText, type IssueContent, type RichStyle } from "@/lib/newsletter";
import { issueExtras } from "@/lib/newsletter-extras";

// Same formatter as the email, styled for the page (theme-aware colours).
// Safe to inject: richText escapes all authored text before adding tags.
const WEB: RichStyle = {
  p: "margin:0 0 14px;font-size:16px;line-height:1.7",
  list: "margin:0 0 14px;padding-left:22px;font-size:16px;line-height:1.7;list-style:revert",
  li: "margin:0 0 4px",
  link: "color:var(--df-gold);font-weight:700;text-decoration:underline",
};
const Rich = ({ text }: { text: string }) => <div dangerouslySetInnerHTML={{ __html: richText(text, WEB) }} />;

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
    return def.key !== "closing_question" && s && (s.title || s.text || s.url || s.image_url);
  });
  const question = content.closing_question;
  const { writers } = await issueExtras(content);

  return (
    <Shell>
      <article className="mx-auto w-full max-w-[680px] px-5 py-12 sm:px-8 lg:py-16">
        <header className="border-b border-border pb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-teal">
            The Everyday Brief · Issue #{String(issue.issue_number).padStart(2, "0")}
          </p>
          <h1 className="font-serif text-[clamp(28px,4.5vw,40px)] leading-[1.12] font-black tracking-[-0.5px]">
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
          <div className="mt-8 text-[17px] text-ink">
            <Rich text={content.intro} />
          </div>
        )}

        <div className="mt-4">
          {sections.map((def) => {
            const s = content[def.key]!;
            return (
              <section key={def.key} className="mt-8 rounded-lg border border-border bg-bg2 p-5 sm:p-6">
                <h2 className="font-mono text-[11px] uppercase tracking-[1.5px] text-gold">{def.label}</h2>
                {s.title && (
                  <p className="mt-2 font-serif text-[21px] leading-snug font-black">
                    {def.hasUrl && s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </p>
                )}
                {def.hasImage && s.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image_url}
                    alt={s.title || (s.text ? s.text.slice(0, 90) : def.label)}
                    className={
                      def.key === "writer_spotlight"
                        ? "mt-3 size-[88px] rounded-full border-2 border-gold/30 object-cover"
                        : "mt-3 w-full rounded-md border border-border"
                    }
                  />
                )}
                {s.text && (
                  <div className="mt-3 text-ink">
                    <Rich text={s.text} />
                  </div>
                )}
                {def.hasUrl && s.url && (
                  <p className="mt-3">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-gold hover:underline">
                      {def.key === "writer_spotlight" ? "See their author page →" : "Read the full piece →"}
                    </a>
                  </p>
                )}
              </section>
            );
          })}
        </div>

        {question && (question.title || question.text) && (
          <section className="mt-8 border-l-[3px] border-gold bg-gold-dim px-5 py-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[1.5px] text-gold">Over to you</h2>
            {question.title && <p className="mt-2 font-serif text-[19px] font-black">{question.title}</p>}
            {question.text && (
              <div className="mt-2">
                <Rich text={question.text} />
              </div>
            )}
          </section>
        )}

        {writers && writers.length > 0 && (
          <p className="mt-8 text-[14px] text-muted">
            This issue features work by <strong className="text-ink">{writers.join(", ")}</strong>.
          </p>
        )}

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

