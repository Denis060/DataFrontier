/**
 * MDX component tags (`<Callout>`, `<Aside>`, …) are JSX, not Markdown. The
 * Tiptap round-trip strips them — verified: it keeps the inner text and drops
 * the tag. So the rich editor must refuse any body that contains one, or it
 * would silently corrupt the article on save.
 *
 * Heuristic: an opening tag whose name starts with an uppercase letter. HTML
 * elements are lowercase (`<img>`, `<a>`); MDX components are capitalized.
 */
export function hasMdxComponents(markdown: string): boolean {
  return /<[A-Z][A-Za-z0-9]*[\s/>]/.test(markdown);
}
