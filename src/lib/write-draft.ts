"use client";

import { useSyncExternalStore } from "react";

/** Where the /write form parks a signed-out visitor's pitch (localStorage). */
export const DRAFT_KEY = "df-write-draft";

export type DraftKind = "new" | "republish";

function readKind(): DraftKind | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { kind?: string }).kind === "republish" ? "republish" : "new";
  } catch {
    return null;
  }
}

/** The parked pitch, trimmed to a sane size for auth user metadata. */
export function parkedDraft(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(draft)
        .filter(([, v]) => typeof v === "string" && v)
        .map(([k, v]) => [k, (v as string).slice(0, 4000)]),
    );
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * Which option the visitor picked on the pitch form, or null if there's no
 * parked draft. Null on the server, so the first render matches.
 */
export function useDraftKind(): DraftKind | null {
  return useSyncExternalStore(subscribe, readKind, () => null);
}
