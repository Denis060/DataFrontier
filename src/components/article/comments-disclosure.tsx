"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { MessageSquare } from "lucide-react";

/**
 * Facebook-style comments disclosure: the thread stays closed until the reader
 * taps the Comment button (which lives in the article action bar, far from the
 * thread — hence the shared context). The button shows the count; the thread
 * mounts hidden so it's still in the DOM for SEO but out of the way.
 */
const Ctx = createContext<{ open: boolean; toggle: () => void }>({ open: false, toggle: () => {} });

export function CommentsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, toggle: () => setOpen((o) => !o) }}>{children}</Ctx.Provider>;
}

export function CommentButton({ count }: { count: number }) {
  const { open, toggle } = useContext(Ctx);
  const label = count === 1 ? "1 Comment" : count > 1 ? `${count} Comments` : "Comment";

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => {
        const wasClosed = !open;
        toggle();
        if (wasClosed) {
          setTimeout(() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" }), 60);
        }
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
        open ? "border-gold/40 bg-gold-dim text-gold" : "border-border text-muted hover:border-border-strong hover:text-ink"
      }`}
    >
      <MessageSquare className="size-4" aria-hidden />
      {label}
    </button>
  );
}

export function CommentsReveal({ children }: { children: ReactNode }) {
  const { open } = useContext(Ctx);
  return (
    <div className={open ? "" : "hidden"} aria-hidden={!open}>
      {children}
    </div>
  );
}
