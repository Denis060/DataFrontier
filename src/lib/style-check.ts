/**
 * House-style check for article drafts, run live in the editor. Built for the
 * common case of a draft polished by an AI tool: it catches the marks that
 * make writing read machine-made, and the sections our pieces are expected to
 * have. Pure and client-safe. Code (fenced blocks and inline code) is never
 * flagged or changed.
 */

export type StyleIssue = {
  id: string;
  level: "fix" | "warn" | "tip";
  title: string;
  detail: string;
  count?: number;
  examples?: string[];
  /** Safe, mechanical fix. Only offered where no judgment is needed. */
  fix?: { label: string; apply: (markdown: string) => string };
};

/** Run fn over prose only, leaving fenced code blocks and `inline code` untouched. */
function mapProse(md: string, fn: (prose: string) => string): string {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((part) => (part.startsWith("```") ? part : part.split(/(`[^`\n]*`)/g).map((p) => (p.startsWith("`") ? p : fn(p))).join("")))
    .join("");
}

function proseOnly(md: string): string {
  return md.replace(/```[\s\S]*?```/g, " ").replace(/`[^`\n]*`/g, " ");
}

// Phrases that mark text as machine-polished, with what to do instead.
const AI_PHRASES: { re: RegExp; label: string }[] = [
  { re: /\bdelv(e|es|ing) into\b/gi, label: "delve into" },
  { re: /\bin today'?s (fast-paced|ever-changing|rapidly evolving|digital)\b[^.]*/gi, label: "in today's fast-paced…" },
  { re: /\bin the ever-(evolving|changing) (world|landscape) of\b/gi, label: "in the ever-evolving world of" },
  { re: /\bit(?:'s| is) (important|worth|crucial) to (note|mention|remember) that\b/gi, label: "it's important to note that" },
  { re: /\bgame[- ]chang(er|ing)\b/gi, label: "game-changer" },
  { re: /\brevolutioni[sz](e|es|ing)\b/gi, label: "revolutionize" },
  { re: /\b(unlock|harness) the (full )?(power|potential) of\b/gi, label: "unlock the power of" },
  { re: /\bnavigat(e|ing) the (complexities|intricacies|landscape)\b/gi, label: "navigate the complexities" },
  { re: /\ba testament to\b/gi, label: "a testament to" },
  { re: /\b(rich )?tapestry\b/gi, label: "tapestry" },
  { re: /\bcutting[- ]edge\b/gi, label: "cutting-edge" },
  { re: /\bseamless(ly)?\b/gi, label: "seamless" },
  { re: /\bembark(s|ed|ing)? on\b/gi, label: "embark on" },
  { re: /\blet'?s dive (in|into)\b/gi, label: "let's dive in" },
  { re: /\bin the realm of\b/gi, label: "in the realm of" },
  { re: /\belevate (your|the)\b/gi, label: "elevate your" },
  { re: /\bin conclusion\b/gi, label: "in conclusion" },
  { re: /\bplays? a (crucial|pivotal|vital) role\b/gi, label: "plays a crucial role" },
];

// Chatbot leftovers that should never reach readers.
const LEFTOVER =
  /^\s*(?:certainly|sure|absolutely|of course)[!,.].*$|^.*\b(?:I hope this helps|as an AI( language model)?|let me know if you(?:'d| would) like|here(?:'s| is) (?:a|an|the) (?:revised|polished|improved|rewritten) version)\b.*$/gim;
const PLACEHOLDER = /\[(?:write here|replace|insert|your|add|citation needed)\b[^\]]*\]/gi;

const words = (s: string) => (s.match(/\b[\w'’-]+\b/g) ?? []).length;

export function checkStyle(markdown: string): StyleIssue[] {
  const md = markdown ?? "";
  const prose = proseOnly(md);
  if (!prose.trim()) return [];
  const issues: StyleIssue[] = [];

  // 1. Dashes. The site doesn't use em-dashes (house style).
  const dashes = prose.match(/\s?[—–]\s?/g) ?? [];
  const realDashes = dashes.filter((d) => d.includes("—") || /\s–\s/.test(d));
  if (realDashes.length) {
    issues.push({
      id: "dashes",
      level: "fix",
      title: `${realDashes.length} em-dash${realDashes.length === 1 ? "" : "es"}`,
      detail: "We don't use em-dashes. A comma usually works; sometimes a full stop or a colon reads better.",
      count: realDashes.length,
      fix: {
        label: "Replace with commas",
        apply: (m) => mapProse(m, (p) => p.replace(/\s*—\s*/g, ", ").replace(/\s+–\s+/g, ", ").replace(/, ([.,;:!?])/g, "$1")),
      },
    });
  }

  // 2. Chatbot leftovers and placeholders.
  const leftovers = [...prose.matchAll(LEFTOVER)].map((m) => m[0].trim()).filter(Boolean);
  if (leftovers.length) {
    issues.push({
      id: "leftovers",
      level: "fix",
      title: "Leftover chatbot text",
      detail: "Lines like these come from the AI tool, not the article. Remove them.",
      count: leftovers.length,
      examples: leftovers.slice(0, 3).map((l) => (l.length > 80 ? `${l.slice(0, 80)}…` : l)),
      fix: {
        label: "Remove these lines",
        apply: (m) => mapProse(m, (p) => p.replace(LEFTOVER, "").replace(/\n{3,}/g, "\n\n")),
      },
    });
  }
  const placeholders = prose.match(PLACEHOLDER) ?? [];
  if (placeholders.length) {
    issues.push({
      id: "placeholders",
      level: "fix",
      title: "Unfilled placeholders",
      detail: "Replace these with the real detail or link.",
      count: placeholders.length,
      examples: [...new Set(placeholders)].slice(0, 3),
    });
  }

  // 3. Phrases that read machine-made.
  const found = AI_PHRASES.map((p) => ({ label: p.label, n: (prose.match(p.re) ?? []).length })).filter((x) => x.n > 0);
  const total = found.reduce((s, x) => s + x.n, 0);
  if (total) {
    issues.push({
      id: "phrases",
      level: "warn",
      title: `${total} phrase${total === 1 ? "" : "s"} that read like AI`,
      detail: "Say the specific thing instead: what changed, by how much, for whom. Readers notice these.",
      count: total,
      examples: found.slice(0, 5).map((x) => (x.n > 1 ? `${x.label} (×${x.n})` : x.label)),
    });
  }

  // 4. Our structure.
  const total_words = words(prose);
  const headings = md.match(/^#{2,3}\s.+$/gm) ?? [];
  if (total_words > 300 && !/^#{2,3}\s.*\b(wrong|falsif|what would change)/im.test(md)) {
    issues.push({
      id: "wrong",
      level: "warn",
      title: "No \"What would make me wrong\" section",
      detail: "Most of our pieces end by naming the result that would overturn them. Add a short section near the end.",
    });
  }
  const links = (prose.match(/\]\(https?:\/\/[^)]+\)/g) ?? []).length + (prose.match(/(^|\s)https?:\/\/\S+/g) ?? []).length;
  if (total_words > 300 && links === 0) {
    issues.push({
      id: "sources",
      level: "warn",
      title: "No sources linked",
      detail: "Link the paper, dataset, benchmark or filing behind each claim, and list them in a Sources section.",
    });
  } else if (total_words > 600 && !/^#{2,3}\s*(sources|references|further reading)\b/im.test(md)) {
    issues.push({
      id: "sources-section",
      level: "tip",
      title: "Add a Sources section",
      detail: "End with the full list of what you relied on, so readers can check it.",
    });
  }
  if (total_words > 600 && headings.length < 2) {
    issues.push({
      id: "headings",
      level: "tip",
      title: "Break it up with headings",
      detail: "Sections with clear headings (## Heading) become the article's contents list.",
    });
  }

  // 5. Walls of text.
  const long = prose.split(/\n\s*\n/).filter((p) => !/^\s*([-*]|\d+\.|#|>|\|)/.test(p) && words(p) > 140);
  if (long.length) {
    issues.push({
      id: "long",
      level: "tip",
      title: `${long.length} very long paragraph${long.length === 1 ? "" : "s"}`,
      detail: "Paragraphs over ~140 words are hard to read on a phone. Split at the turn in the argument.",
      count: long.length,
    });
  }

  return issues;
}
