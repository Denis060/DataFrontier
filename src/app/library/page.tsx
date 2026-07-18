import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Pill } from "@/components/pill";
import { getCurrentProfile } from "@/lib/auth";
import { getLibrary, paginate, toPageNumber } from "@/lib/queries";
import { Pagination } from "@/components/article-list";

export const metadata: Metadata = { title: "Your Library", robots: { index: false } };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/library");

  const page = toPageNumber((await searchParams).page);
  const { items, total, perPage } = paginate(await getLibrary(profile.id), page);

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8 lg:py-16">
        <header className="mb-8 border-b border-border pb-6">
          <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">
            <Bookmark className="size-3.5" aria-hidden /> Your Library
          </p>
          <h1 className="font-serif text-[clamp(28px,5vw,40px)] leading-[1.1] font-black tracking-[-1px]">
            Saved to read later
          </h1>
          <p className="mt-2 text-[14px] text-muted">{total} saved</p>
        </header>

        {total === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Nothing saved yet. Tap <span className="font-semibold text-ink">Save</span> on any article to keep it here.{" "}
            <Link href="/" className="text-gold hover:underline">Browse articles →</Link>
          </p>
        ) : (
          <>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {items.map((a) => (
              <li key={a.id}>
                <Link href={`/article/${a.slug}`} className="block py-5 transition-opacity hover:opacity-70">
                  {a.category && (
                    <Pill color={a.category.color} className="mb-2">
                      {a.category.name}
                    </Pill>
                  )}
                  <p className="mb-1.5 font-serif text-lg leading-[1.25] font-bold">{a.title}</p>
                  {a.excerpt && <p className="mb-2 text-[13px] leading-relaxed text-muted">{a.excerpt}</p>}
                  <p className="text-[11px] text-muted">
                    {a.author?.full_name}
                    {a.reading_time ? ` · ${a.reading_time} min read` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={total} perPage={perPage} basePath="/library" />
          </>
        )}
      </div>
    </Shell>
  );
}
