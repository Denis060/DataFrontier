import Link from "next/link";
import { Heart } from "lucide-react";
import { Pill } from "@/components/pill";
import { reactionCount, type ArticleCard, type HomeData } from "@/lib/queries";

/** "· ❤ N" meta, shown only once an article has reactions. */
function Reactions({ a }: { a: ArticleCard }) {
  const n = reactionCount(a);
  if (n < 1) return null;
  return (
    <>
      <span className="opacity-40">·</span>
      <span className="flex items-center gap-1 text-gold">
        <Heart className="size-3 fill-current" aria-hidden />
        {n}
      </span>
    </>
  );
}

/* ─── CATEGORY STRIP ─────────────────────────────────────── */

export function CategoryStrip({ categories }: { categories: HomeData["categories"] }) {
  return (
    <div className="flex overflow-x-auto border-b border-border">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.slug}`}
          className="flex min-w-[170px] shrink-0 flex-col border-r border-border px-6 py-6 whitespace-nowrap transition-colors hover:bg-bg2 sm:min-w-[200px] sm:px-9"
        >
          <span className="mb-2 text-2xl">{c.icon}</span>
          <span className="mb-0.5 text-sm font-semibold">{c.name}</span>
          <span className="font-mono text-[11px] text-muted">
            {c.count} {c.count === 1 ? "article" : "articles"}
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─── ARTICLE GRID ───────────────────────────────────────── */

function ArticleRow({ a }: { a: ArticleCard }) {
  return (
    <Link
      href={`/article/${a.slug}`}
      className="block border-b border-border py-4.5 transition-opacity last:border-b-0 last:pb-0 hover:opacity-70"
    >
      {a.format && (
        <Pill color={a.format.color} className="mb-2">
          {a.format.name}
        </Pill>
      )}
      <p className="mb-2 font-serif text-[17px] leading-[1.3] font-bold">{a.title}</p>
      {a.excerpt && (
        <p className="mb-2.5 text-[13px] leading-[1.55] text-muted">{a.excerpt}</p>
      )}
      <p className="flex items-center gap-2.5 text-[11px] text-muted">
        <span>{a.author?.full_name}</span>
        <span className="opacity-40">·</span>
        <span>{a.reading_time} min</span>
        <Reactions a={a} />
      </p>
    </Link>
  );
}

function GridSection({
  title,
  titleClass,
  href,
  linkLabel,
  articles,
  className = "",
}: {
  title: string;
  titleClass: string;
  href?: string;
  linkLabel?: string;
  articles: ArticleCard[];
  className?: string;
}) {
  return (
    <section className={`border-b border-border px-6 py-10 last:border-b-0 sm:px-8 xl:border-r xl:border-b-0 xl:last:border-r-0 ${className}`}>
      <div className="mb-7 flex items-center justify-between border-b-2 border-border pb-3.5">
        <h2 className={`font-mono text-[11px] font-medium uppercase tracking-[2px] ${titleClass}`}>
          {title}
        </h2>
        {href && (
          <Link href={href} className="text-[11px] text-muted transition-colors hover:text-gold">
            {linkLabel} →
          </Link>
        )}
      </div>
      {articles.length === 0 ? (
        <p className="text-sm text-muted">Nothing published here yet.</p>
      ) : (
        articles.map((a) => <ArticleRow key={a.id} a={a} />)
      )}
    </section>
  );
}

export function ArticleGrid({
  columns,
  resources,
}: {
  columns: ArticleCard[][];
  resources: HomeData["resources"];
}) {
  const meta = [
    { title: "Agentic AI", titleClass: "text-gold", href: "/category/agentic-ai", linkLabel: "All articles" },
    { title: "ML & Data Science", titleClass: "text-ink", href: "/category/ml-data", linkLabel: "All articles" },
    { title: "Research Digest", titleClass: "text-muted", href: "/category/research", linkLabel: "All papers" },
  ];

  return (
    <div className="grid border-b border-border md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_340px]">
      {meta.map((m, i) => (
        <GridSection key={m.title} {...m} articles={columns[i] ?? []} />
      ))}

      <section className="bg-bg2 px-6 py-10 sm:px-8">
        <div className="mb-7 flex items-center justify-between border-b-2 border-border pb-3.5">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-muted">
            Tools & Resources
          </h2>
        </div>
        {resources.map((r) => (
          <div key={r.id} className="border-b border-border py-4.5 last:border-b-0 last:pb-0">
            <p className="mb-2 font-serif text-sm font-bold">
              {r.emoji} {r.title}
            </p>
            {r.description && (
              <p className="mb-2.5 text-[13px] leading-[1.55] text-muted">{r.description}</p>
            )}
            <Link href={r.url} className="text-xs text-gold hover:underline">
              {r.cta_label}
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ─── AFRICA SPOTLIGHT ───────────────────────────────────── */

export function AfricaSpotlight({
  headline,
  body,
  ctaUrl,
  articles,
}: {
  headline: string;
  body: string;
  ctaUrl: string;
  articles: ArticleCard[];
}) {
  return (
    <section className="grid gap-10 border-t-[3px] border-b border-teal border-b-border bg-linear-160 from-spot-from to-spot-to px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:px-12">
      <div>
        <p className="mb-4 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[2.5px] text-teal after:h-px after:flex-1 after:bg-teal/20 after:content-['']">
          Africa AI Spotlight
        </p>
        <h2 className="mb-4 font-serif text-[28px] leading-[1.1] font-black tracking-[-0.8px] sm:text-[36px]">
          {headline}
        </h2>
        <p className="mb-6 text-[15px] leading-[1.7] text-muted">{body}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ctaUrl}
            className="inline-flex items-center gap-2 rounded bg-gold px-[22px] py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
          >
            Explore Africa AI →
          </Link>
          <Link
            href="/write"
            className="inline-flex items-center gap-2 rounded border border-border px-[22px] py-2.5 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-1"
          >
            Submit a story
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/article/${a.slug}`}
            className="rounded-md border border-border bg-surface-1 p-5 transition-colors hover:border-teal/30"
          >
            {a.kicker && (
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[1.5px] text-teal">
                {a.kicker}
              </p>
            )}
            <p className="mb-1.5 font-serif text-base leading-[1.3] font-bold">{a.title}</p>
            <p className="flex items-center gap-2 text-[11px] text-muted">
              <span>{a.author?.full_name} · {a.reading_time} min read</span>
              <Reactions a={a} />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── CAREERS ────────────────────────────────────────────── */

export function CareersBand({ jobs, total }: { jobs: HomeData["jobs"]; total: number }) {
  if (jobs.length === 0) return null;

  return (
    <section className="border-b border-border px-5 py-12 sm:px-8 lg:px-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-[28px] font-black tracking-[-0.5px]">Data &amp; AI Careers</h2>
          <p className="mt-1 text-sm text-muted">
            Curated roles in AI &amp; data science — screened for quality, not volume
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded border border-border px-[22px] py-2.5 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-1"
        >
          Browse all {total} {total === 1 ? "job" : "jobs"} →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((j) => (
          <a
            key={j.id}
            href={j.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2.5 rounded-md border border-border bg-bg2 p-5 transition-all hover:-translate-y-0.5 hover:border-gold/30"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-md font-mono text-sm font-extrabold"
                style={{
                  backgroundColor: `${j.brand_color ?? "#6B7280"}1F`,
                  color: j.brand_color ?? "#6B7280",
                }}
              >
                {j.company[0]}
              </span>
              <div>
                <p className="text-[13px] font-semibold">{j.company}</p>
                <p className="text-[11px] text-muted">
                  {j.location}
                  {j.is_remote && " · Remote"}
                </p>
              </div>
            </div>
            <p className="font-serif text-base leading-[1.3] font-bold">{j.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {j.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[3px] border border-border bg-surface-1 px-2 py-0.5 font-mono text-[10px] text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-auto flex items-center gap-2 text-xs text-muted">
              {j.salary_range && <span>{j.salary_range}</span>}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ─── FROM THE EDITOR ────────────────────────────────────── */

type Badge = { label: string; color: string };

export function EditorSection({
  editor,
  headline,
  bio,
  badges,
}: {
  editor: { full_name: string; title: string | null; slug: string | null; avatar_url?: string | null } | null;
  headline: string;
  bio: string;
  badges: Badge[];
}) {
  if (!editor) return null;
  const initials = editor.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("");

  return (
    <section className="grid gap-10 border-b border-border bg-bg2 px-5 py-12 sm:px-8 lg:grid-cols-[320px_1fr] lg:items-center lg:gap-16 lg:px-12">
      <div className="flex flex-col items-center gap-3.5 rounded-lg border border-gold/20 bg-linear-160 from-editor-from to-editor-to p-8 text-center">
        {editor.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={editor.avatar_url}
            alt={editor.full_name}
            className="size-20 rounded-full border-[3px] border-gold/30 object-cover"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full border-[3px] border-gold/30 bg-linear-135 from-gold to-[#4A3000] font-serif text-[28px] font-black text-on-accent">
            {initials}
          </span>
        )}
        <p className="font-serif text-xl font-bold">{editor.full_name}</p>
        <p className="text-xs leading-relaxed text-muted">{editor.title}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {badges.map((b) => (
            <Pill key={b.label} color={b.color} className="!px-2 !py-0.5 !text-[9px] !tracking-[1px]">
              {b.label}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3.5 font-mono text-[10px] uppercase tracking-[2px] text-gold">
          From the Editor
        </p>
        <h2 className="mb-4 font-serif text-[26px] leading-[1.15] font-black tracking-[-0.5px] sm:text-[30px]">
          {headline}
        </h2>
        <p className="mb-6 text-[15px] leading-[1.75] text-muted">{bio}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/newsletter"
            className="inline-flex items-center gap-2 rounded bg-gold px-[22px] py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
          >
            Subscribe to the Newsletter
          </Link>
          {editor.slug && (
            <Link
              href={`/author/${editor.slug}`}
              className="inline-flex items-center gap-2 rounded border border-border px-[22px] py-2.5 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-1"
            >
              More from {editor.full_name.split(" ")[0]}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
