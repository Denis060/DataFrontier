export type Heading = { id: string; text: string };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/**
 * The h2 sections of rendered (sanitized) article HTML, for the contents list.
 * Ids are taken as rendered, including the sanitizer's "user-content-" prefix,
 * so the links match the elements on the page.
 */
export function extractHeadings(html: string | null | undefined): Heading[] {
  if (!html) return [];
  const out: Heading[] = [];
  for (const m of html.matchAll(/<h2\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
    const text = decode(m[2].replace(/<[^>]+>/g, "")).trim();
    if (text) out.push({ id: m[1], text });
  }
  return out;
}
