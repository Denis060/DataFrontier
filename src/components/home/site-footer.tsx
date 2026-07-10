import Link from "next/link";
import { BrandIcon } from "@/components/brand-icons";
import { menuFor, type HomeData } from "@/lib/queries";

/** Icon buttons, so four platforms can't overflow a 320px screen as text did. */
function SocialRow({ links }: { links: HomeData["menus"] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className="inline-flex size-9 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <BrandIcon name={s.icon ?? s.label} />
        </a>
      ))}
    </div>
  );
}

function Column({ title, links }: { title: string; links: HomeData["menus"] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[2px] text-muted">{title}</p>
      <div className="flex flex-col gap-2.5">
        {links.map((l) => (
          <Link
            key={l.id}
            href={l.url}
            className="text-[13px] text-muted transition-colors hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SiteFooter({
  siteName,
  tagline,
  menus,
  year,
  editorName,
}: {
  siteName: string;
  tagline: string | null;
  menus: HomeData["menus"];
  year: number;
  editorName: string | null;
}) {
  const socials = menuFor(menus, "social");
  const brandIndex = siteName.lastIndexOf("Frontier");

  return (
    <footer className="border-t border-border bg-bg2 px-5 py-12 sm:px-8 lg:px-12">
      {/* Two link columns even on the narrowest screens; the brand block spans both. */}
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-x-6 gap-y-9 lg:grid-cols-[220px_1fr_1fr_1fr] lg:gap-12">
        <div className="col-span-2 lg:col-span-1">
          <p className="mb-2.5 font-serif text-lg font-black">
            {brandIndex > 0 ? siteName.slice(0, brandIndex) : siteName}
            <span className="text-gold">
              {brandIndex > 0 ? siteName.slice(brandIndex) : ""}
            </span>
          </p>
          {tagline && <p className="mb-4 text-[13px] leading-relaxed text-muted">{tagline}</p>}
          <SocialRow links={socials} />
        </div>

        <Column title="Topics" links={menuFor(menus, "footer_topics")} />
        <Column title="Resources" links={menuFor(menus, "footer_resources")} />
        <Column title="Company" links={menuFor(menus, "footer_company")} />
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-[1440px] flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          © {year} {siteName}
          {editorName && (
            <>
              {" · Built by "}
              <strong className="font-semibold text-gold">{editorName}</strong>
            </>
          )}
          {" · All rights reserved."}
        </p>
        <div className="flex gap-4">
          {["Terms", "Privacy", "RSS"].map((l) => (
            <Link
              key={l}
              href={`/${l.toLowerCase()}`}
              className="font-mono text-[11px] tracking-[1px] text-muted transition-colors hover:text-ink"
            >
              {l}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
