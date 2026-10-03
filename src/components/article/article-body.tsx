import { renderMarkdown } from "@/lib/markdown";
import { Prose } from "./prose";

/**
 * Renders an article/event/newsletter body. Prefers pre-rendered `html`
 * (cached at save time); falls back to rendering the Markdown source on the
 * fly for content saved before the cache existed. Both paths go through the
 * same sanitized pipeline, so the output is always safe HTML — no JS, no
 * unsanitized markup.
 */
const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com").hostname.replace(/^www\./, "");
  } catch {
    return "everydaydatascience.com";
  }
})();

/**
 * Sources and other outside links open in a new tab, so a reader checking a
 * citation doesn't lose their place. Done on the HTML (not in the browser)
 * so it holds without JavaScript and for bodies cached before this existed.
 */
function externalLinksInNewTab(html: string): string {
  return html.replace(/<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/gi, (tag, before: string, href: string, after: string) => {
    let host = "";
    try {
      host = new URL(href.replace(/&amp;/g, "&")).hostname.replace(/^www\./, "");
    } catch {
      return tag;
    }
    if (host === SITE_HOST || /target=/.test(before + after)) return tag;
    return `<a ${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
  });
}

export async function ArticleBody({ html, source }: { html?: string | null; source?: string | null }) {
  const rendered = html && html.length > 0 ? html : await renderMarkdown(source ?? "");
  if (!rendered) return null;
  return <Prose html={externalLinksInNewTab(rendered)} />;
}
