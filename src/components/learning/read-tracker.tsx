"use client";

import { useEffect } from "react";
import { markRead } from "./read-history";

/** Placed on an article page: remembers (on this device) that it was opened. */
export function ReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // A short delay so a bounce-and-back doesn't count as reading.
    const t = window.setTimeout(() => markRead(slug), 15000);
    return () => window.clearTimeout(t);
  }, [slug]);
  return null;
}
