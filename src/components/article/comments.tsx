"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import { postComment, deleteOwnComment, type CommentState } from "@/app/article/[slug]/comment-actions";
import { Honeypot } from "@/components/honeypot";
import type { CommentNode } from "@/lib/queries";

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function CommentForm({
  articleId,
  slug,
  parentId,
  onDone,
  compact,
}: {
  articleId: string;
  slug: string;
  parentId?: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<CommentState, FormData>(async (prev, fd) => {
    const res = await postComment(prev, fd);
    if (res?.ok) onDone?.();
    return res;
  }, null);

  if (state?.ok) {
    return <p className="rounded border border-teal/30 bg-teal-dim px-4 py-3 text-[13px] text-teal">{state.message}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="article_id" value={articleId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <Honeypot />
      <textarea
        name="body"
        required
        rows={compact ? 2 : 3}
        maxLength={2000}
        placeholder={compact ? "Write a reply…" : "Add to the discussion…"}
        className="w-full rounded border border-border bg-surface-1 px-3.5 py-3 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 self-start rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {compact ? "Reply" : "Post comment"}
        </button>
        {state && !state.ok && <span className="text-[12px] text-red">{state.message}</span>}
      </div>
    </form>
  );
}

function Comment({
  node,
  articleId,
  slug,
  currentUserId,
}: {
  node: CommentNode;
  articleId: string;
  slug: string;
  currentUserId: string | null;
}) {
  const [replying, setReplying] = useState(false);
  const isOwn = currentUserId === node.profile_id;
  const pending = !node.is_approved;

  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-135 from-gold to-[#8B6914] font-serif text-[11px] font-bold text-on-accent">
          {node.author ? initials(node.author.full_name) : "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold">
              {node.author?.slug ? (
                <Link href={`/author/${node.author.slug}`} className="hover:text-gold">
                  {node.author.full_name}
                </Link>
              ) : (
                node.author?.full_name ?? "Unknown"
              )}
            </span>
            <span className="text-[11px] text-muted">{fmt(node.created_at)}</span>
            {pending && (
              <span className="rounded-[3px] bg-gold-dim px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1px] text-gold">
                Awaiting review
              </span>
            )}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap">{node.body}</p>

          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
            {currentUserId && !node.parent_id && (
              <button type="button" onClick={() => setReplying((v) => !v)} className="hover:text-ink">
                {replying ? "Cancel" : "Reply"}
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete your comment?")) deleteOwnComment(node.id, slug);
                }}
                className="hover:text-red"
              >
                Delete
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-3">
              <CommentForm articleId={articleId} slug={slug} parentId={node.id} compact onDone={() => setReplying(false)} />
            </div>
          )}

          {node.replies.length > 0 && (
            <div className="mt-3 border-l border-border pl-4">
              {node.replies.map((r) => (
                <Comment key={r.id} node={r} articleId={articleId} slug={slug} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Comments({
  articleId,
  slug,
  tree,
  count,
  currentUserId,
  signedIn,
}: {
  articleId: string;
  slug: string;
  tree: CommentNode[];
  count: number;
  currentUserId: string | null;
  signedIn: boolean;
}) {
  return (
    <section className="border-t border-border bg-bg2 px-5 py-12 sm:px-8 lg:px-12" id="comments">
      <div className="mx-auto w-full max-w-[760px]">
        <h2 className="mb-6 flex items-center gap-2.5 font-serif text-2xl font-black tracking-[-0.5px]">
          <MessageSquare className="size-5 text-gold" aria-hidden />
          {count} {count === 1 ? "Comment" : "Comments"}
        </h2>

        {signedIn ? (
          <div className="mb-8">
            <CommentForm articleId={articleId} slug={slug} />
          </div>
        ) : (
          <p className="mb-8 rounded border border-border bg-surface-1 px-4 py-4 text-sm text-muted">
            <Link href={`/login?next=/article/${slug}`} className="text-gold hover:underline">
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        )}

        {tree.length === 0 ? (
          <p className="text-sm text-muted">No comments yet. Be the first.</p>
        ) : (
          <div>
            {tree.map((node) => (
              <Comment key={node.id} node={node} articleId={articleId} slug={slug} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
