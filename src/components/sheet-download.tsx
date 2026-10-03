"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import { OfferForm } from "@/components/offer-form";

/**
 * A cheat sheet's Download button. Signed-in readers download straight away;
 * everyone else leaves their email and gets the file by email (new readers
 * confirm first, as for every signup). The sheet itself stays visible on the
 * page for everyone.
 */
export function SheetDownload({ slug, title, label, signedIn }: { slug: string; title: string; label: string; signedIn: boolean }) {
  // ?get=1: sent back here from the download link without access; open the form.
  const asked = useSearchParams().get("get") === "1";
  const [open, setOpen] = useState(asked && !signedIn);
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
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open} className={button}>
        <Download className="size-4" aria-hidden />
        {label}
      </button>
      {open && (
        <div className="order-last basis-full">
        <div className="relative mt-1 w-full max-w-[460px] rounded-lg border border-gold/40 bg-gold-dim p-5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-3 right-3 rounded p-1 text-muted hover:bg-surface-1 hover:text-ink"
          >
            <X className="size-4" />
          </button>
          <p className="pr-6 font-serif text-lg font-black">Get it in your inbox</p>
          <p className="mt-1 mb-4 text-[13px] text-muted">
            Free. We email you the download, plus The Everyday Brief once a week. Already have an account?{" "}
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
