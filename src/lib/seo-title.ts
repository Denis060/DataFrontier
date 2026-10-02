/** Appended to article titles in the browser tab and search results when it fits. */
export const TITLE_SUFFIX = " | Everyday Data Science";

/** Where search engines start cutting a <title>. */
export const TITLE_LIMIT = 60;

/** Where search engines start cutting a meta description. */
export const DESCRIPTION_LIMIT = 155;

/**
 * Search engines truncate the <title> near 60 characters, so keywords at the
 * end vanish from the SERP. Keep it tight: append the site suffix only if the
 * result still fits, otherwise drop it (and trim a long headline at a word
 * boundary). Editors front-load keywords via the `meta_title` override.
 * Shared by the article page and the editor's live preview of it.
 */
export function clampTitle(base: string): string {
  const withSuffix = base + TITLE_SUFFIX;
  if (withSuffix.length <= TITLE_LIMIT) return withSuffix;
  if (base.length <= TITLE_LIMIT) return base;
  const cut = base.slice(0, TITLE_LIMIT);
  const sp = cut.lastIndexOf(" ");
  return (sp > 30 ? cut.slice(0, sp) : cut).trimEnd();
}
