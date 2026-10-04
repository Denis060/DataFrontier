import { OfferPromo } from "@/components/offer-promo";
import type { PromoOffer } from "@/lib/offer-match";
import Link from "next/link";
import { BookOpen, CodeXml, Earth, FileSearch, FileText, Heart, Route, Scale } from "lucide-react";
import { Pill } from "@/components/pill";
import { CoverImage } from "@/components/cover-image";
import { reactionCount, type ArticleCard, type HomeData, type Writer } from "@/lib/queries";
import { AuthorAvatar } from "@/components/author-avatar";

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

/* ─── PROMISE STRIP ──────────────────────────────────────── */

// What sets the publication apart, said up front instead of at the bottom of
// the page. Phrased to hold for the archive as a whole (most pieces link
// sources and say what would prove them wrong; tutorials ship runnable code).
const PROOF = [
  { icon: FileSearch, label: "Sources you can check" },
  { icon: Scale, label: "Says what would prove it wrong" },
  { icon: CodeXml, label: "Code you can run" },
  { icon: Earth, label: "AI in Africa, taken seriously" },
];

export function PromiseStrip({ tagline }: { tagline: string | null }) {
  if (!tagline) return null;
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-bg2 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-12">
      <p className="font-serif text-[17px] leading-snug font-bold sm:text-[19px]">{tagline}</p>
      {/* One swipeable line on phones instead of three wrapped rows. */}
      <ul className="-mx-5 flex gap-x-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-y-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {PROOF.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-1.5 text-[12px] whitespace-nowrap text-muted">
            <Icon className="size-3.5 text-gold" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── CATEGORY STRIP ─────────────────────────────────────── */

export function CategoryStrip({ categories }: { categories: HomeData["categories"] }) {
  return (
    // Scrolls sideways on small screens; on wide ones the tiles share the full
    // width instead of leaving an empty run on the right.
    <div
      className="flex overflow-x-auto border-b border-border lg:grid lg:overflow-visible"
      style={{ gridTemplateColumns: `repeat(${Math.max(categories.length, 1)}, minmax(0, 1fr))` }}
    >
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.slug}`}
          className="flex min-w-[170px] shrink-0 flex-col border-r border-border px-6 py-6 whitespace-nowrap transition-colors last:border-r-0 hover:bg-bg2 sm:min-w-[200px] sm:px-9 lg:min-w-0"
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
  // On phones each row is compact (title + small thumbnail on the right, no
  // excerpt), so nine stacked articles don't take four screens of scrolling.
  // From md up it's the full card: cover on top, then text.
  return (
    <Link
      href={`/article/${a.slug}`}
      className={`border-b border-border py-4.5 transition-opacity last:border-b-0 last:pb-0 hover:opacity-70 md:block ${
        a.cover_image ? "grid grid-cols-[minmax(0,1fr)_112px] items-start gap-x-4" : "block"
      }`}
    >
      <CoverImage
        src={a.cover_image}
        alt={a.cover_alt ?? ""}
        sizes="(min-width: 1280px) 300px, (min-width: 768px) 50vw, 112px"
        className="col-start-2 row-start-1 md:mb-3"
      />
      <div className="col-start-1 row-start-1">
        {a.format && (
          <Pill color={a.format.color} className="mb-2">
            {a.format.name}
          </Pill>
        )}
        <p className="mb-2 font-serif text-[16px] leading-[1.3] font-bold md:text-[17px]">{a.title}</p>
        {a.excerpt && (
          <p className="mb-2.5 hidden text-[13px] leading-[1.55] text-muted md:block">{a.excerpt}</p>
        )}
        <p className="flex items-center gap-2.5 text-[11px] text-muted">
          <span>{a.author?.full_name}</span>
          <span className="opacity-40">·</span>
          <span>{a.reading_time} min</span>
          <Reactions a={a} />
        </p>
      </div>
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

export function ArticleGrid({ columns }: { columns: ArticleCard[][] }) {
  const meta = [
    { title: "Agentic AI", titleClass: "text-gold", href: "/category/agentic-ai", linkLabel: "All articles" },
    { title: "ML & Data Science", titleClass: "text-ink", href: "/category/ml-data", linkLabel: "All articles" },
    { title: "Research Digest", titleClass: "text-muted", href: "/category/research", linkLabel: "All papers" },
  ];

  return (
    <div className="grid border-b border-border md:grid-cols-2 xl:grid-cols-3">
      {meta.map((m, i) => (
        <GridSection key={m.title} {...m} articles={columns[i] ?? []} />
      ))}
    </div>
  );
}

/* ─── MOST READ ──────────────────────────────────────────── */

/** Top five by views, with big rank numerals. Hidden until there's data. */
export function MostRead({ articles }: { articles: ArticleCard[] }) {
  if (articles.length < 3) return null;
  return (
    <section className="border-b border-border px-5 py-12 sm:px-8 lg:px-12">
      <h2 className="mb-7 flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[2px] text-gold after:h-px after:flex-1 after:bg-border after:content-['']">
        Most read
      </h2>
      <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
        {articles.map((a, i) => (
          <li key={a.id}>
            <Link href={`/article/${a.slug}`} className="group flex gap-4 lg:flex-col lg:gap-2">
              <span
                aria-hidden
                className="w-7 shrink-0 font-serif text-[40px] leading-none font-black text-gold/40 transition-colors group-hover:text-gold lg:w-auto lg:text-[48px]"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                {a.format && (
                  <span className="mb-1 block font-mono text-[9px] uppercase tracking-[1.5px] text-muted">
                    {a.format.name}
                  </span>
                )}
                <span className="block font-serif text-[16px] leading-[1.3] font-bold transition-opacity group-hover:opacity-75">
                  {a.title}
                </span>
                <span className="mt-1.5 block text-[11px] text-muted">
                  {a.author?.full_name} · {a.reading_time} min
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─── START HERE ─────────────────────────────────────────── */

/** Where a newcomer should go next: learning paths, cheat sheets, the book. */
export function StartHere({
  series,
  cheatSheets,
  resources,
}: {
  series: HomeData["series"];
  cheatSheets: HomeData["cheatSheets"];
  resources: HomeData["resources"];
}) {
  if (series.length === 0 && cheatSheets.length === 0 && resources.length === 0) return null;

  const colTitle = "mb-4 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[2px]";
  const more = "mt-4 inline-block text-[12px] text-gold hover:underline";

  return (
    <section className="border-b border-border px-5 py-12 sm:px-8 lg:px-12">
      <div className="mb-8 max-w-[640px]">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Start here</p>
        <h2 className="font-serif text-[28px] leading-[1.1] font-black tracking-[-0.5px] sm:text-[32px]">
          New here? Go deeper than one article.
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Step-by-step learning paths, one-page cheat sheets you can keep open while you work, and
          the book.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
        {series.length > 0 && (
          <div>
            <p className={`${colTitle} text-teal`}>
              <Route className="size-3.5" aria-hidden />
              Learning paths
            </p>
            <div className="flex flex-col gap-3">
              {series.map((s) => (
                <Link
                  key={s.id}
                  href={`/series/${s.slug}`}
                  className="rounded-md border border-border bg-bg2 p-4 transition-colors hover:border-teal/40"
                >
                  <p className="font-serif text-[16px] leading-snug font-bold">{s.title}</p>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{s.description}</p>
                  )}
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[1.5px] text-teal">
                    {s.count} {s.count === 1 ? "part" : "parts"} →
                  </p>
                </Link>
              ))}
            </div>
            <Link href="/series" className={more}>
              All learning paths →
            </Link>
          </div>
        )}

        {cheatSheets.length > 0 && (
          <div>
            <p className={`${colTitle} text-gold`}>
              <FileText className="size-3.5" aria-hidden />
              Cheat sheets
            </p>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-bg2">
              {cheatSheets.map((c) => (
                <Link
                  key={c.id}
                  href={`/cheat-sheets/${c.slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 text-[14px] font-semibold transition-colors hover:bg-surface-1"
                >
                  <span className="min-w-0">{c.title}</span>
                  <span className="shrink-0 text-gold" aria-hidden>
                    →
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/cheat-sheets" className={more}>
              All cheat sheets →
            </Link>
          </div>
        )}

        {resources.length > 0 && (
          <div>
            <p className={`${colTitle} text-ink`}>
              <BookOpen className="size-3.5" aria-hidden />
              The book
            </p>
            {resources.map((r) => {
              const external = /^https?:\/\//.test(r.url);
              return (
                <div
                  key={r.id}
                  className="mb-3 rounded-md border border-gold/30 bg-linear-160 from-editor-from to-editor-to p-5 last:mb-0"
                >
                  <p className="font-serif text-[18px] leading-snug font-black">
                    {r.emoji} {r.title}
                  </p>
                  {r.description && (
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">{r.description}</p>
                  )}
                  <a
                    href={r.url}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="mt-4 inline-flex items-center gap-2 rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
                  >
                    {r.cta_label}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
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
            Curated roles in AI &amp; data science, screened for quality, not volume
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
  writers = [],
}: {
  editor: { full_name: string; title: string | null; slug: string | null; avatar_url?: string | null } | null;
  headline: string;
  bio: string;
  badges: Badge[];
  /** Everyone with a byline, so the section reads as a publication, not one person. */
  writers?: Writer[];
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
        {/* Clamped on phones; "More from …" below leads to the full bio. */}
        <p className="mb-6 line-clamp-6 text-[15px] leading-[1.75] text-muted sm:line-clamp-none">{bio}</p>
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

        {writers.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-muted">
              Writing on Everyday Data Science
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {writers.slice(0, 8).map((w) => (
                <Link
                  key={w.id}
                  href={`/author/${w.slug}`}
                  title={w.full_name}
                  className="flex items-center gap-2 rounded-full border border-border bg-bg py-1 pr-4 pl-1 text-[13px] font-medium transition-colors hover:border-gold/40"
                >
                  <AuthorAvatar name={w.full_name} src={w.avatar_url} className="size-7 text-[10px]" />
                  {w.full_name}
                </Link>
              ))}
              <Link
                href="/write"
                className="rounded-full border border-dashed border-gold/50 px-4 py-1.5 text-[13px] font-semibold text-gold transition-colors hover:bg-gold-dim"
              >
                + Join them
              </Link>
              <Link href="/authors" className="ml-1 text-[13px] text-muted hover:text-gold">
                All writers →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** The free downloads (lead magnets), each linking to its signup page. */
/** The free downloads (lead magnets): the first two here, the rest on /free. */
export function FreeDownloads({ offers }: { offers: PromoOffer[] }) {
  if (offers.length === 0) return null;
  const shown = offers.slice(0, 2);
  return (
    <section className="border-b border-border px-5 py-12 sm:px-8 lg:px-12">
      <h2 className="mb-7 flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[2px] text-gold after:h-px after:flex-1 after:bg-border after:content-['']">
        Free downloads
      </h2>
      <div className={`grid gap-5 ${shown.length > 1 ? "lg:grid-cols-2" : "max-w-[960px]"}`}>
        {shown.map((o) => (
          <OfferPromo key={o.slug} offer={o} variant="card" />
        ))}
      </div>
      {offers.length > shown.length && (
        <Link href="/free" className="mt-5 inline-block text-[13px] font-semibold text-gold hover:underline">
          See all {offers.length} free downloads →
        </Link>
      )}
    </section>
  );
}
