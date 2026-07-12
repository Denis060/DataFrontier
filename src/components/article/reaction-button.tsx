"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleArticleReaction } from "@/app/actions/react";

export function ReactionButton({
  articleId,
  initialCount,
  initialReacted,
  signedIn,
  slug,
}: {
  articleId: string;
  initialCount: number;
  initialReacted: boolean;
  signedIn: boolean;
  slug: string;
}) {
  const router = useRouter();
  const [reacted, setReacted] = useState(initialReacted);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  function toggle() {
    if (!signedIn) {
      router.push(`/login?next=/article/${slug}`);
      return;
    }
    const prev = { reacted, count };
    const next = !reacted;
    setReacted(next);
    setCount((c) => c + (next ? 1 : -1));
    start(async () => {
      const res = await toggleArticleReaction(articleId);
      if ("error" in res) {
        setReacted(prev.reacted);
        setCount(prev.count);
      } else {
        setReacted(res.reacted);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={reacted}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
        reacted
          ? "border-gold/40 bg-gold-dim text-gold"
          : "border-border text-muted hover:border-border-strong hover:text-ink"
      }`}
    >
      <Heart className={`size-4 ${reacted ? "fill-current" : ""}`} aria-hidden />
      {count > 0 ? count : "Like"}
    </button>
  );
}
