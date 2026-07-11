"use client";

import { useTransition } from "react";
import Link from "next/link";
import { approveComment, hideComment, removeComment } from "@/app/admin/comments/actions";

type Row = {
  id: string;
  body: string;
  is_approved: boolean;
  created_at: string;
  author: { full_name: string } | null;
  article: { title: string; slug: string } | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function CommentRow({ row }: { row: Row }) {
  const [pending, start] = useTransition();

  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px]">
          <span className="font-semibold">{row.author?.full_name ?? "Unknown"}</span>
          <span className="ml-2 text-[11px] text-muted">{fmt(row.created_at)}</span>
          {!row.is_approved && (
            <span className="ml-2 rounded-[3px] bg-gold-dim px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1px] text-gold">
              Pending
            </span>
          )}
        </p>
        {row.article && (
          <Link href={`/article/${row.article.slug}#comments`} className="max-w-[240px] truncate text-[11px] text-muted hover:text-gold">
            on “{row.article.title}”
          </Link>
        )}
      </div>

      <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-wrap">{row.body}</p>

      <div className="mt-2.5 flex items-center gap-2">
        {row.is_approved ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => hideComment(row.id))}
            className="rounded border border-border px-3 py-1.5 text-[12px] transition-colors hover:border-border-strong hover:bg-surface-1 disabled:opacity-50"
          >
            Hide
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => approveComment(row.id))}
            className="rounded bg-gold px-3 py-1.5 text-[12px] font-bold text-on-accent hover:opacity-85 disabled:opacity-50"
          >
            Approve
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this comment permanently?")) start(() => removeComment(row.id));
          }}
          className="rounded border border-red/40 px-3 py-1.5 text-[12px] text-red transition-colors hover:bg-red-dim disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
