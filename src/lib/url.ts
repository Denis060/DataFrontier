/**
 * Only same-origin paths may be used as a post-login redirect.
 *
 * `//evil.com` is protocol-relative and `https://evil.com` is absolute — both
 * would send the user off-site, which is how open-redirect phishing works.
 * Anything that isn't a plain `/path` falls back to the homepage.
 */
export function safeNext(next: string | undefined | null): string {
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  // `/\evil.com` is treated as `//evil.com` by some browsers.
  if (next.startsWith("/\\")) return "/";
  return next;
}
