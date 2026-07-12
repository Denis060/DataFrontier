"use client";

import { MessageSquare } from "lucide-react";

/** Smooth-scrolls to the comment thread on the same page, Facebook-style. */
export function CommentButton({ count }: { count: number }) {
  return (
    <button
      type="button"
      onClick={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" })}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:border-border-strong hover:text-ink"
    >
      <MessageSquare className="size-4" aria-hidden />
      {count > 0 ? count : "Comment"}
    </button>
  );
}
