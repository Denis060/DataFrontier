import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { createClient } from "@/lib/supabase/server";
import type { SearchResult } from "@/components/search/search-bar";

export const metadata: Metadata = { title: "Search | Everyday Data Science", robots: { index: false } };

const KIND_LABEL: Record<string, string> = {
  article: "Article",
  "cheat-sheet": "Cheat Sheet",
  event: "Event",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  let results: SearchResult[] = [];
  if (term) {
    const db = await createClient();
    const { data } = await db.rpc("search_content", { q: term, max_results: 50 });
    results = (data as SearchResult[]) ?? [];
  }

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8 lg:py-16">
        <h1 className="font-serif text-[clamp(26px,5vw,38px)] leading-[1.1] font-black tracking-[-0.8px]">
          {term ? <>Results for “{term}”</> : "Search"}
        </h1>
        {term && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[2px] text-muted">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
        )}

        {!term ? (
          <p className="mt-8 text-[15px] text-muted">
            Use the search box in the header to find articles, cheat sheets, and events.
          </p>
        ) : results.length === 0 ? (
          <p className="mt-8 rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No matches. Try a different term or a broader keyword.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {results.map((r) => (
              <li key={r.url}>
                <Link href={r.url} className="block py-5 transition-colors hover:bg-surface-1">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-gold">
                      {KIND_LABEL[r.kind] ?? r.kind}
                    </span>
                    {r.category && (
                      <span className="font-mono text-[10px] text-muted">· {r.category}</span>
                    )}
                  </span>
                  <p className="mt-1 font-serif text-xl leading-tight font-bold">{r.title}</p>
                  {r.description && (
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{r.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
