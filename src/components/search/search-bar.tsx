"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type SearchResult = {
  kind: string;
  title: string;
  description: string | null;
  url: string;
  category: string | null;
};

const KIND_LABEL: Record<string, string> = {
  article: "Article",
  "cheat-sheet": "Cheat Sheet",
  event: "Event",
};

/** Header search: an expanding input with a debounced instant-results dropdown.
 *  Enter (or "See all") goes to the full /search page. */
export function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounced instant search. All state updates happen inside the timeout
  // (async), never synchronously during the effect.
  useEffect(() => {
    const term = q.trim();
    const t = setTimeout(async () => {
      if (term.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const db = createClient();
      const { data } = await db.rpc("search_content", { q: term, max_results: 6 });
      setResults((data as SearchResult[]) ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) {
      router.push(`/search?q=${encodeURIComponent(term)}`);
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search"
          className="inline-flex size-9 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-strong hover:text-ink"
        >
          <Search className="size-4" />
        </button>
      ) : (
        <form onSubmit={submit} className="flex items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles, cheat sheets, events…"
              className="w-[min(72vw,340px)] rounded border border-border bg-surface-1 py-2 pr-9 pl-9 text-sm outline-none focus:border-gold/40"
            />
            <button
              type="button"
              onClick={() => (q ? setQ("") : setOpen(false))}
              aria-label="Clear"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            </button>
          </div>

          {q.trim().length >= 2 && (
            <div className="absolute top-11 right-0 z-50 w-[min(92vw,420px)] overflow-hidden rounded-md border border-border bg-bg2 shadow-xl">
              {results.length === 0 && !loading ? (
                <p className="px-4 py-6 text-center text-[13px] text-muted">
                  No matches for “{q.trim()}”.
                </p>
              ) : (
                <>
                  <ul className="max-h-[60vh] overflow-y-auto">
                    {results.map((r) => (
                      <li key={r.url}>
                        <Link
                          href={r.url}
                          onClick={() => setOpen(false)}
                          className="flex flex-col gap-0.5 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-1"
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-[1px] text-gold">
                              {KIND_LABEL[r.kind] ?? r.kind}
                            </span>
                            {r.category && (
                              <span className="font-mono text-[9px] text-muted">· {r.category}</span>
                            )}
                          </span>
                          <span className="font-serif text-[14px] leading-tight font-bold">{r.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="submit"
                    className="block w-full bg-surface-1 px-4 py-2.5 text-center text-[12px] font-medium text-gold hover:bg-surface-2"
                  >
                    See all results →
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
