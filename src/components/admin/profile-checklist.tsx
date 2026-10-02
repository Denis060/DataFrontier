"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

type Item = { label: string; done: boolean; field: string };

const PROFILE = "/admin/profile";

/** Scroll to a profile field, focus it, and flash it so the eye lands there. */
function goTo(field: string) {
  const el = document.getElementById(field);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
  el.animate(
    [{ boxShadow: "0 0 0 3px color-mix(in srgb, var(--df-gold) 60%, transparent)" }, { boxShadow: "0 0 0 3px transparent" }],
    { duration: 1600, easing: "ease-out" },
  );
}

/**
 * What's missing from a writer's author page. Each open item links straight
 * to the field that fixes it on /admin/profile.
 */
export function ProfileChecklist({ items, size = "md" }: { items: Item[]; size?: "sm" | "md" }) {
  const onProfile = usePathname() === PROFILE;

  // Arriving from the workspace with #field in the URL.
  useEffect(() => {
    if (!onProfile) return;
    const field = window.location.hash.slice(1);
    if (field) requestAnimationFrame(() => goTo(field));
  }, [onProfile]);

  const dot = size === "sm" ? "size-4" : "size-5";
  return (
    <ul className="flex flex-col gap-1">
      {items.map((c) => {
        const body = (
          <>
            <span
              className={`flex ${dot} shrink-0 items-center justify-center rounded-full border ${
                c.done ? "border-teal bg-teal-dim text-teal" : "border-border text-transparent"
              }`}
              aria-hidden
            >
              <Check className="size-3" />
            </span>
            <span className={`min-w-0 flex-1 ${c.done ? "text-muted line-through" : ""}`}>{c.label}</span>
            {!c.done && <span className="text-[11px] font-semibold text-gold opacity-70 group-hover:opacity-100">Add →</span>}
          </>
        );
        const row = `group -mx-2 flex items-center gap-2.5 rounded px-2 py-1.5 ${size === "sm" ? "text-[12px]" : "text-[13px]"}`;
        return (
          <li key={c.field}>
            {c.done ? (
              <span className={row}>{body}</span>
            ) : (
              <Link
                href={`${PROFILE}#${c.field}`}
                scroll={!onProfile}
                onClick={(e) => {
                  if (!onProfile) return;
                  e.preventDefault();
                  history.replaceState(null, "", `#${c.field}`);
                  goTo(c.field);
                }}
                className={`${row} transition-colors hover:bg-surface-1`}
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
