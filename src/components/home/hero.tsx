import Link from "next/link";
import { Pill } from "@/components/pill";
import type { ArticleCard } from "@/lib/queries";

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function Hero({ hero, latest }: { hero: ArticleCard | null; latest: ArticleCard[] }) {
  if (!hero) {
    return (
      <section className="border-b border-border px-5 py-24 text-center sm:px-8 lg:px-12">
        <p className="font-mono text-xs uppercase tracking-[2px] text-muted">
          No featured article yet
        </p>
      </section>
    );
  }

  return (
    <section className="grid border-b border-border lg:min-h-[580px] lg:grid-cols-[1fr_380px]">
      <div className="relative overflow-hidden border-b border-border px-5 py-12 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-25 -left-25 size-[500px] rounded-full bg-[radial-gradient(circle,var(--df-gold-dim)_0%,transparent_70%)] opacity-40"
        />
        <div className="relative">
          <div className="mb-7 flex flex-wrap items-center gap-3">
            {hero.category && <Pill color={hero.category.color}>{hero.category.name}</Pill>}
            <span className="text-xs text-muted">{fmtDate(hero.published_at)}</span>
          </div>

          <h1 className="mb-5 max-w-[700px] font-serif text-[clamp(30px,5vw,56px)] leading-[1.08] font-black tracking-[-1.5px]">
            {hero.title}
          </h1>

          {hero.excerpt && (
            <p className="mb-9 max-w-[580px] text-base leading-[1.65] text-muted sm:text-[17px]">
              {hero.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-5">
            {hero.author && (
              <Link
                href={hero.author.slug ? `/author/${hero.author.slug}` : "#"}
                className="flex items-center gap-2.5"
              >
                <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-linear-135 from-gold to-[#8B6914] font-serif text-sm font-bold text-on-accent">
                  {initials(hero.author.full_name)}
                </span>
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold">{hero.author.full_name}</span>
                  <span className="text-[11px] text-muted">{hero.author.title}</span>
                </span>
              </Link>
            )}
            <Link
              href={`/article/${hero.slug}`}
              className="inline-flex items-center gap-2 rounded border border-gold/30 px-5 py-2.5 text-[13px] font-semibold text-gold transition-colors hover:border-gold hover:bg-gold-dim"
            >
              Read Feature →
            </Link>
          </div>
        </div>
      </div>

      <aside className="px-5 py-8 sm:px-8 lg:px-8">
        <p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-muted before:h-px before:w-4 before:bg-muted before:content-['']">
          Also in This Issue
        </p>
        {latest.length === 0 ? (
          <p className="text-sm text-muted">Nothing else published yet.</p>
        ) : (
          latest.map((a) => (
            <Link
              key={a.id}
              href={`/article/${a.slug}`}
              className="block border-b border-border py-4 transition-opacity last:border-b-0 hover:opacity-75"
            >
              {a.format && (
                <Pill color={a.format.color} className="mb-1.5 !px-2 !py-0.5 !text-[9px] !tracking-[1.5px]">
                  {a.format.name}
                </Pill>
              )}
              <p className="mb-1.5 font-serif text-[15px] leading-[1.3] font-bold">{a.title}</p>
              <p className="text-[11px] text-muted">
                {a.reading_time} min read{a.kicker && ` · ${a.kicker}`}
              </p>
            </Link>
          ))
        )}
      </aside>
    </section>
  );
}
