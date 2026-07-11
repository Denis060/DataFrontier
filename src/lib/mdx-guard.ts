/**
 * The rich (Tiptap) editor only understands standard Markdown. Content with
 * directive callouts (`:::note`, `:::warning`, `:::aside`) or leftover MDX/JSX
 * tags would be mangled on the round-trip, so the editor stays in Markdown mode
 * for any body that contains them.
 */
export function hasRichIncompatibleSyntax(markdown: string): boolean {
  // Container directives: a line starting with ::: .
  if (/^:::/m.test(markdown)) return true;
  // Legacy/hand-written JSX component tags (capitalized), just in case.
  if (/<[A-Z][A-Za-z0-9]*[\s/>]/.test(markdown)) return true;
  return false;
}

/** @deprecated kept for import compatibility; use hasRichIncompatibleSyntax. */
export const hasMdxComponents = hasRichIncompatibleSyntax;
