"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import { OfferForm } from "@/components/offer-form";

/**
 * A cheat sheet's Download button. Signed-in readers download straight away;
 * everyone else gets a small pop-up (a bottom sheet on phones) asking for
 * their email, and the file arrives by email (new readers confirm first, as
 * for every signup). The sheet itself stays visible on the page for everyone.
 */
export function SheetDownload({ slug, title, label, signedIn }: { slug: string; title: string; label: string; signedIn: boolean }) {
  // ?get=1: sent back here from the download link without access; open the pop-up.
  const asked = useSearchParams().get("get") === "1";
  const [open, setOpen] = useState(asked && !signedIn);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const button =
    "inline-flex items-center gap-2 rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85";

  if (signedIn) {
    return (
      <a href={`/cheat-sheets/${slug}/download`} className={button}>
        <Download className="size-4" aria-hidden />
        {label}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={button}>
        <Download className="size-4" aria-hidden />
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-dl-title"
            className="relative w-full max-w-[440px] rounded-t-xl border border-border bg-bg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-xl sm:p-6"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 rounded p-1.5 text-muted hover:bg-surface-1 hover:text-ink"
            >
              <X className="size-4" />
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">Free download</p>
            <p id="sheet-dl-title" className="mt-1 pr-6 font-serif text-xl leading-snug font-black">
              {title}
            </p>
            <p className="mt-2 mb-4 text-[13px] text-muted">
              We email you the download, plus The Everyday Brief once a week. Already have an account?{" "}
              <a href={`/login?next=/cheat-sheets/${slug}`} className="font-semibold text-gold hover:underline">
                Sign in
              </a>{" "}
              to download straight away.
            </p>
            <OfferForm slug={slug} title={title} kind="sheet" id="sheet-email" cta="Email me the download →" />
          </div>
        </div>
      )}
    </>
  );
}
