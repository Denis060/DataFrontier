"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * A button that opens a small panel: a dropdown under the button from sm up,
 * a sheet pinned to the bottom of the screen on phones (so it can't open off
 * the edge). Closes on outside tap, Escape or the close button. The panel
 * stays mounted while closed, so form fields inside keep what was typed and
 * still submit with the form.
 */
export function Popover({
  label,
  title,
  buttonClassName,
  width = "sm:w-[360px]",
  children,
}: {
  label: React.ReactNode;
  /** Heading shown on the phone sheet, and the button's accessible name. */
  title: string;
  buttonClassName: string;
  width?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={title} className={buttonClassName}>
        {label}
      </button>
      {/* Phones: dim the page behind the sheet. */}
      {open && <div onPointerDown={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 sm:hidden" aria-hidden />}
      <div
        role="dialog"
        aria-label={title}
        className={`${open ? "" : "hidden"} fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-xl border border-border bg-bg p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:bottom-auto sm:mt-2 sm:max-h-none sm:rounded-lg sm:pb-4 ${width}`}
      >
        <div className="mb-3 flex items-center justify-between gap-3 sm:hidden">
          <p className="text-[15px] font-semibold">{title}</p>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1.5 text-muted hover:bg-surface-1 hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
