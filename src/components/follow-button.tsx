"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { toggleFollow } from "@/app/actions/follow";

export function FollowButton({
  authorId,
  categoryId,
  initialFollowing,
  initialCount,
  canFollow,
  path,
}: {
  authorId?: string;
  categoryId?: string;
  initialFollowing: boolean;
  initialCount: number;
  canFollow: boolean; // false when signed out or viewing your own author page
  path: string;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  function onClick() {
    if (!canFollow) {
      router.push(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    // Optimistic.
    const next = !following;
    setFollowing(next);
    setCount((c) => c + (next ? 1 : -1));
    start(async () => {
      const res = await toggleFollow({ authorId, categoryId }, path);
      if (!res.ok) {
        setFollowing(!next);
        setCount((c) => c + (next ? -1 : 1));
      } else {
        setFollowing(res.following);
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={following}
        className={`inline-flex items-center gap-1.5 rounded px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
          following
            ? "border border-border text-muted hover:border-border-strong hover:text-ink"
            : "bg-gold text-on-accent hover:opacity-85"
        }`}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : following ? (
          <Check className="size-3.5" />
        ) : (
          <Plus className="size-3.5" />
        )}
        {following ? "Following" : "Follow"}
      </button>
      <span className="font-mono text-[11px] text-muted">
        {count} {count === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}
