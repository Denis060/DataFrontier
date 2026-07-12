"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toggleBookmark } from "@/app/actions/bookmark";

export function BookmarkButton({
  articleId,
  initialSaved,
  signedIn,
  slug,
}: {
  articleId: string;
  initialSaved: boolean;
  signedIn: boolean;
  slug: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  function toggle() {
    if (!signedIn) {
      router.push(`/login?next=/article/${slug}`);
      return;
    }
    const prev = saved;
    setSaved(!prev);
    start(async () => {
      const res = await toggleBookmark(articleId);
      if ("error" in res) setSaved(prev);
      else setSaved(res.saved);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
        saved
          ? "border-gold/40 bg-gold-dim text-gold"
          : "border-border text-muted hover:border-border-strong hover:text-ink"
      }`}
    >
      <Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} aria-hidden />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
