/**
 * The rich (Tiptap) editor understands standard Markdown plus plain
 * `:::tip` / `:::note` / `:::warning` callouts (see callout-node). Anything
 * else (other directives, attributes like `:::note{title=…}`, MDX/JSX tags)
 * would be mangled on the round-trip, so the editor stays in Markdown mode.
 */
export function hasRichIncompatibleSyntax(markdown: string): boolean {
  // Container directives other than a bare tip/note/warning open or a close.
  for (const line of markdown.match(/^:::.*$/gm) ?? []) {
    if (!/^:::(tip|note|warning)?\s*$/.test(line)) return true;
  }
  // Legacy/hand-written JSX component tags (capitalized), just in case.
  if (/<[A-Z][A-Za-z0-9]*[\s/>]/.test(markdown)) return true;
  return false;
}

/** @deprecated kept for import compatibility; use hasRichIncompatibleSyntax. */
export const hasMdxComponents = hasRichIncompatibleSyntax;
