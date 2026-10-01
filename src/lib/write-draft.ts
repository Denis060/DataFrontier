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
