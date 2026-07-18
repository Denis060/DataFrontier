// Known social-platform hosts. A bare root on one of these (e.g. "github.com"
// with no username) is almost always an unfilled placeholder, so it is dropped
// from sameAs. A bare personal domain (e.g. "ibrahimfofanah.com") is a real
// identity link and is kept.
const PLATFORM_HOSTS =
  /(?:^|\.)(?:github|twitter|x|linkedin|youtube|facebook|instagram|orcid|researchgate|google|threads|mastodon|tiktok|medium|substack|bsky)\.[a-z.]+$/i;

/**
 * Turn a jsonb socials map into a clean schema.org `sameAs` array: valid http(s)
 * URLs only, keeping anything with a real path or query, plus bare domains that
 * are not a known platform root (real personal sites). Placeholders and blanks
 * fall out.
 */
export function sameAsLinks(socials: unknown): string[] {
  if (!socials || typeof socials !== "object") return [];
  const out: string[] = [];
  for (const value of Object.values(socials as Record<string, unknown>)) {
    if (typeof value !== "string" || !value.trim()) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      const hasPath = url.pathname.replace(/\/+$/, "").length > 0 || url.search.length > 0;
      if (hasPath || !PLATFORM_HOSTS.test(url.hostname)) out.push(value);
    } catch {
      // not a valid URL, skip
    }
  }
  return out;
}
