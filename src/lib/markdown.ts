import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { h } from "hastscript";

/**
 * Safe article/body renderer. Unlike MDX, this NEVER evaluates the body as
 * JavaScript — it's a pure content transform. Raw HTML in the source is not
 * passed through (remark-rehype without allowDangerousHtml), and the final
 * tree is sanitized against an allowlist. So a body containing <script>,
 * an import, or any JSX cannot execute or inject.
 *
 * Callouts use container directives (:::note / :::warning / :::tip), which are
 * plain Markdown syntax, not components — nothing to evaluate.
 */

const TONES: Record<string, { cls: string; label: string }> = {
  note: { cls: "callout callout-note", label: "Note" },
  info: { cls: "callout callout-note", label: "Note" },
  tip: { cls: "callout callout-tip", label: "Tip" },
  warning: { cls: "callout callout-warning", label: "Warning" },
  danger: { cls: "callout callout-warning", label: "Warning" },
};

/** Turn `:::warning` container directives and `::aside` into styled elements. */
function remarkCallouts() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, (node: any) => {
      if (node.type === "containerDirective") {
        if (node.name === "aside") {
          const data = node.data || (node.data = {});
          data.hName = "aside";
          data.hProperties = { className: ["pullquote"] };
          return;
        }
        const tone = TONES[node.name];
        if (tone) {
          const data = node.data || (node.data = {});
          data.hName = "aside";
          data.hProperties = { className: tone.cls.split(" "), "data-callout": node.name };
        }
      }
    });
  };
}

// Allowlist: default safe HTML + the classes/attributes our styling needs.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
    aside: ["className", "dataCallout"],
    span: [...(defaultSchema.attributes?.span ?? []), "className", "style"],
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    pre: [...(defaultSchema.attributes?.pre ?? []), "className", "style", "tabindex"],
    div: [...(defaultSchema.attributes?.div ?? []), "className", "dataRehypePrettyCodeFragment"],
    a: [...(defaultSchema.attributes?.a ?? []), "className", "target", "rel"],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "aside"],
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkCallouts)
  // allowDangerousHtml is OFF: raw HTML in the body is dropped, not rendered.
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "wrap" })
  .use(rehypePrettyCode, {
    theme: { dark: "github-dark-dimmed", light: "github-light" },
    keepBackground: false,
  })
  // Sanitize AFTER highlighting so the highlighter's spans/classes survive the
  // allowlist but nothing dangerous does.
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

/** Markdown (with directive callouts) -> sanitized HTML string. */
export async function renderMarkdown(source: string): Promise<string> {
  if (!source?.trim()) return "";
  const file = await processor.process(source);
  return String(file);
}

// Used to build the icon+label header for callouts on the client-free side.
export { h };
