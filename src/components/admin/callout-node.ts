import { Node } from "@tiptap/core";
import type MarkdownIt from "markdown-it";

/** The callout tones the rich editor can round-trip (see lib/markdown TONES). */
export const CALLOUT_TONES = ["tip", "note", "warning"] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

const OPEN = /^:::(tip|note|warning)\s*$/;

/**
 * markdown-it rule for `:::tip` … `:::` blocks, so tiptap-markdown can load
 * them into the editor. The site itself renders them with remark-directive.
 */
function calloutPlugin(md: MarkdownIt) {
  md.block.ruler.before("fence", "callout", (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const first = state.src.slice(start, state.eMarks[startLine]);
    const m = OPEN.exec(first);
    if (!m) return false;
    if (silent) return true;

    let line = startLine + 1;
    for (; line < endLine; line++) {
      const s = state.bMarks[line] + state.tShift[line];
      if (state.src.slice(s, state.eMarks[line]).trim() === ":::") break;
    }

    const open = state.push("callout_open", "div", 1);
    open.attrSet("data-callout-tone", m[1]);
    open.block = true;
    open.map = [startLine, line];
    const oldMax = state.lineMax;
    state.lineMax = line;
    state.md.block.tokenize(state, startLine + 1, line);
    state.lineMax = oldMax;
    state.push("callout_close", "div", -1).block = true;
    state.line = Math.min(line + 1, endLine);
    return true;
  });
}

/**
 * A Tip / Note / Warning box inside the rich editor. Styled with the same
 * .callout classes as the live article, and saved as `:::tone` Markdown.
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      tone: {
        default: "note",
        parseHTML: (el) => el.getAttribute("data-callout-tone") ?? "note",
        renderHTML: (a) => ({ "data-callout-tone": a.tone, "data-callout": a.tone, class: `callout callout-${a.tone}` }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout-tone]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },

  addStorage() {
    return {
      markdown: {
        // prosemirror-markdown serializer state; untyped in tiptap-markdown.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serialize(state: any, node: any) {
          state.write(`:::${node.attrs.tone}\n`);
          state.renderContent(node);
          state.flushClose(1);
          state.write(":::");
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            markdownit.use(calloutPlugin);
          },
        },
      },
    };
  },
});
