import { OUTLINES } from "@/lib/outlines";

/**
 * A brief a writer pastes into ChatGPT, Claude or similar along with their
 * own notes, so the draft that comes back already follows house style (the
 * same rules the editor's style check enforces, see lib/style-check). The
 * thinking stays the writer's: the brief asks the tool to shape their
 * material, not to invent any.
 */
export function aiBrief(formatName?: string | null): string {
  const outline =
    OUTLINES.find((o) => formatName && o.formats.some((f) => f.toLowerCase() === formatName.toLowerCase())) ?? null;

  const shape = outline
    ? `Follow this outline (a ${outline.label.toLowerCase()}). Replace every [Write here: ...] note with real content from my notes:\n\n${outline.body.trim()}`
    : `Use this shape:
1. Opening: a concrete situation or number and why it matters, in the first few lines.
2. The findings, in sections with clear ## headings.
3. ## For practitioners: what to do differently.
4. ## What would make me wrong: the result or data that would overturn the piece.
5. ## Key takeaways: three short bullets.
6. ## Sources: every source relied on, with links.`;

  return `You are helping me turn my own notes into an article for Everyday Data Science, a publication for working data scientists. Use only the facts, numbers, code and experience in my notes below. Do not invent results, figures, quotes or sources. Where a claim needs a source I haven't given, write [citation needed] so I can add it.

${shape}

House style:
- Plain words over jargon. Explain a term the first time it appears.
- Make one clear claim and back it with evidence a reader can check.
- Use exact figures from my notes and say where each comes from.
- Never use em-dashes or en-dashes. Use a full stop, a comma, a colon or brackets.
- No hype. Avoid words like revolutionary, game-changing, cutting-edge, seamless, delve, tapestry, "in today's fast-paced world", "it's important to note that", "unlock the power of" and "in conclusion".
- Short paragraphs (under about 120 words). Code must run as written, in fenced blocks with the language named.
- Write in the first person where it's my experience.

Return only the article in Markdown: start with the opening paragraph (no title line), no preamble, no closing remarks, no offer to revise.

My notes:
`;
}
