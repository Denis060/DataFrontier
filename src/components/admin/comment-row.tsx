"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { approveComment, hideComment, removeComment, replyToComment } from "@/app/admin/comments/actions";

type Row = {
  id: string;
  article_id: string;
  parent_id: string | null;
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
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [replyPending, startReply] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function sendReply() {
    if (!row.article) return;
    setError(null);
    startReply(async () => {
      const res = await replyToComment(row.article_id, row.id, row.article!.slug, reply);
      if ("error" in res) setError(res.error);
      else {
        setReply("");
        setReplying(false);
      }
    });
  }

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
          onClick={() => setReplying((v) => !v)}
          className="rounded border border-border px-3 py-1.5 text-[12px] transition-colors hover:border-border-strong hover:bg-surface-1"
        >
          {replying ? "Cancel" : "Reply"}
        </button>
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

      {replying && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Write a public reply…"
            className="w-full rounded border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none focus:border-gold/40"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={replyPending || reply.trim().length < 2}
              onClick={sendReply}
              className="rounded bg-gold px-3.5 py-1.5 text-[12px] font-bold text-on-accent hover:opacity-85 disabled:opacity-50"
            >
              {replyPending ? "Posting…" : "Post reply"}
            </button>
            {error && <span className="text-[12px] text-red">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
