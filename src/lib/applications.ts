/** Marks a writer application as a request to republish an existing post. */
export const REPUBLISH_PREFIX = "Republish: ";

/**
 * Splits an application's writing_links into the post to republish (if the
 * applicant chose that) and any other links they shared.
 */
export function parseApplicationLinks(raw: string | null): { republish: string | null; links: string[] } {
  if (!raw) return { republish: null, links: [] };
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const republish = lines[0]?.startsWith(REPUBLISH_PREFIX) ? lines.shift()!.slice(REPUBLISH_PREFIX.length) : null;
  return { republish, links: lines.flatMap((l) => l.split(/[\s,]+/)).filter(Boolean) };
}
