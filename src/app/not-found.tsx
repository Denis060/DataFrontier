import Link from "next/link";
import { Search } from "lucide-react";

/** Branded 404. Kept dependency-light: no Shell (which needs DB chrome) so it
 *  renders instantly for any missing URL. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[3px] text-teal">Error 404</p>
      <h1 className="font-serif text-[clamp(32px,7vw,56px)] leading-[1.05] font-black tracking-[-1.5px]">
        This page went off the frontier.
      </h1>
      <p className="max-w-md text-[15px] leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist, moved, or was never published. Let&apos;s
        get you back to something real.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
        >
          Back to the homepage
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded border border-border px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-1"
        >
          <Search className="size-4" aria-hidden />
          Search the site
        </Link>
      </div>
    </main>
  );
}
