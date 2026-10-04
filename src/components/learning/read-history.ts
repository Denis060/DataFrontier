"use client";

import { useSyncExternalStore } from "react";

/**
 * Which articles this browser has opened, for learning-path progress. Kept on
 * the device (no account needed); capped so it never grows without bound.
 */
const KEY = "df-read";
const EVENT = "df-read-change";
const MAX = 500;

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function markRead(slug: string) {
  try {
    const list: string[] = JSON.parse(read());
    if (list.includes(slug)) return;
    localStorage.setItem(KEY, JSON.stringify([...list, slug].slice(-MAX)));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/** The set of read article slugs. Empty on the server, so the first render matches. */
export function useReadSlugs(): Set<string> {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}
