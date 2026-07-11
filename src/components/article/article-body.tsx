import { renderMarkdown } from "@/lib/markdown";

/**
 * Renders an article/event/newsletter body. Prefers pre-rendered `html`
 * (cached at save time); falls back to rendering the Markdown source on the
 * fly for content saved before the cache existed. Both paths go through the
 * same sanitized pipeline, so the output is always safe HTML — no JS, no
 * unsanitized markup.
 */
export async function ArticleBody({ html, source }: { html?: string | null; source?: string | null }) {
  const rendered = html && html.length > 0 ? html : await renderMarkdown(source ?? "");
  if (!rendered) return null;
  return <div className="article-prose" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
