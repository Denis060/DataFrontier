"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Loader2, MessageSquare } from "lucide-react";
import { postComment, deleteOwnComment, toggleCommentLike, type CommentState } from "@/app/article/[slug]/comment-actions";
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

function LikeButton({
  commentId,
  initialCount,
  initialLiked,
  canLike,
}: {
  commentId: string;
  initialCount: number;
  initialLiked: boolean;
  canLike: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  function toggle() {
    if (!canLike) return;
    const prevLiked = liked;
    const prevCount = count;
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    start(async () => {
      const res = await toggleCommentLike(commentId);
      if ("error" in res) {
        setLiked(prevLiked);
        setCount(prevCount);
      } else {
        setLiked(res.liked);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!canLike || pending}
      aria-pressed={liked}
      title={canLike ? (liked ? "Unlike" : "Like") : "Sign in to like"}
      className={`flex items-center gap-1 transition-colors ${liked ? "text-gold" : "hover:text-ink"} ${canLike ? "" : "cursor-default"}`}
    >
      <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} aria-hidden />
      {count > 0 && <span>{count}</span>}
    </button>
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
        {node.author?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={node.author.avatar_url}
            alt={node.author.full_name}
            className="mt-0.5 size-8 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-135 from-gold to-[#8B6914] font-serif text-[11px] font-bold text-on-accent">
            {node.author ? initials(node.author.full_name) : "?"}
          </span>
        )}
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
            {node.author && ["author", "editor", "admin"].includes(node.author.role) && (
              <span className="rounded-[3px] bg-teal-dim px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1px] text-teal">
                Author
              </span>
            )}
            <span className="text-[11px] text-muted">{fmt(node.created_at)}</span>
            {pending && (
              <span className="rounded-[3px] bg-gold-dim px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1px] text-gold">
                Awaiting review
              </span>
            )}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap">{node.body}</p>

          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
            <LikeButton
              commentId={node.id}
              initialCount={node.like_count}
              initialLiked={node.liked}
              canLike={!!currentUserId}
            />
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

/** Unique people in the thread (top-level + replies), for the avatar bubbles. */
function uniqueAuthors(tree: CommentNode[]): string[] {
  const seen = new Map<string, string>();
  const walk = (nodes: CommentNode[]) => {
    for (const n of nodes) {
      const name = n.author?.full_name;
      if (name) seen.set(n.profile_id ?? name, name);
      walk(n.replies);
    }
  };
  walk(tree);
  return [...seen.values()];
}

function AvatarBubbles({ names, extra }: { names: string[]; extra: number }) {
  return (
    <div className="flex items-center">
      {names.map((name, i) => (
        <span
          key={i}
          title={name}
          className={`flex size-7 items-center justify-center rounded-full border-2 border-bg bg-linear-135 from-gold to-[#8B6914] font-serif text-[10px] font-bold text-on-accent ${i ? "-ml-2" : ""}`}
        >
          {initials(name)}
        </span>
      ))}
      {extra > 0 && <span className="ml-2 text-[12px] text-muted">+{extra}</span>}
    </div>
  );
}

const PREVIEW = 2;

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
  const [expanded, setExpanded] = useState(false);

  const people = uniqueAuthors(tree);
  const bubbles = people.slice(0, 5);
  // Long threads collapse to a preview so 1,000 comments aren't a wall of text.
  const collapsible = tree.length > PREVIEW;
  const visible = expanded || !collapsible ? tree : tree.slice(0, PREVIEW);
  const hidden = tree.length - visible.length;

  return (
    <section className="mt-10 scroll-mt-24 border-t border-border pt-8" id="comments">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-serif text-2xl font-black tracking-[-0.5px]">
          <MessageSquare className="size-5 text-gold" aria-hidden />
          {count} {count === 1 ? "Comment" : "Comments"}
        </h2>
        {bubbles.length > 0 && <AvatarBubbles names={bubbles} extra={people.length - bubbles.length} />}
      </div>

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
          {visible.map((node) => (
            <Comment key={node.id} node={node} articleId={articleId} slug={slug} currentUserId={currentUserId} />
          ))}

          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 w-full rounded border border-border py-2.5 text-[13px] font-semibold text-muted transition-colors hover:border-border-strong hover:bg-surface-1 hover:text-ink"
            >
              {expanded ? "Show fewer comments" : `View all ${count} comments →`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
