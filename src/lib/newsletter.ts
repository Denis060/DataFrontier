import "server-only";

/**
 * The Frontier Brief's fixed six-part structure, stored as one JSONB `content`
 * object and rendered to BOTH the email and the web archive from this single
 * source. Every field is optional so a draft can be partial.
 */
export type IssueSection = { text?: string; url?: string; image_url?: string };

export type IssueContent = {
  intro?: string;
  cheat_sheet?: IssueSection;
  practical_tip?: IssueSection;
  worth_reading?: IssueSection;
  africa_ai?: IssueSection;
  opportunity?: IssueSection;
  closing_question?: IssueSection;
};

type SectionKey = Exclude<keyof IssueContent, "intro">;
type SectionDef = { key: SectionKey; label: string; hasImage?: boolean; hasUrl?: boolean };

export const SECTION_DEFS: SectionDef[] = [
  { key: "cheat_sheet", label: "Cheat sheet of the week", hasImage: true, hasUrl: true },
  { key: "practical_tip", label: "One practical tip" },
  { key: "worth_reading", label: "Worth reading", hasUrl: true },
  { key: "africa_ai", label: "Africa AI", hasUrl: true },
  { key: "opportunity", label: "One opportunity", hasUrl: true },
  { key: "closing_question", label: "Closing question" },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Very small inline formatter: **bold**, *italic*, and bare URLs → links. */
function inline(text: string): string {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

type Rendered = { html: string; text: string };

/**
 * Render one issue to email-ready HTML + a plain-text alternative from the same
 * content. Design rule (invariant 8): every visual has a headline ABOVE it and
 * the takeaway BELOW, with real alt text — so the issue reads with images
 * blocked, which is the default in most clients.
 */
export function renderIssue(
  title: string,
  summary: string | null,
  content: IssueContent,
  unsubscribeUrl: string,
  webUrl: string,
): Rendered {
  const htmlParts: string[] = [];
  const textParts: string[] = [];

  const heading = (label: string) => {
    htmlParts.push(
      `<h2 style="font-family:Georgia,serif;font-size:15px;letter-spacing:1px;text-transform:uppercase;color:#8a6212;margin:28px 0 8px">${esc(label)}</h2>`,
    );
    textParts.push(`\n## ${label.toUpperCase()}\n`);
  };
  const para = (t: string) => {
    htmlParts.push(`<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#14171c">${inline(t)}</p>`);
    textParts.push(`${t}\n`);
  };
  const link = (label: string, url: string) => {
    htmlParts.push(
      `<p style="margin:0 0 12px"><a href="${esc(url)}" style="color:#8a6212;font-weight:700">${esc(label)} →</a></p>`,
    );
    textParts.push(`${label}: ${url}\n`);
  };

  if (summary) {
    htmlParts.push(`<p style="margin:0 0 20px;font-size:17px;line-height:1.55;color:#5a6270">${inline(summary)}</p>`);
    textParts.push(`${summary}\n`);
  }
  if (content.intro) para(content.intro);

  for (const def of SECTION_DEFS) {
    const sec = content[def.key];
    if (!sec || (!sec.text && !sec.url && !sec.image_url)) continue;
    heading(def.label);

    // Headline is the section label (already above the image); image comes with
    // alt text; the takeaway text sits below so blocked images lose nothing.
    if (def.hasImage && sec.image_url) {
      const alt = sec.text ? sec.text.slice(0, 90) : def.label;
      htmlParts.push(
        `<img src="${esc(sec.image_url)}" alt="${esc(alt)}" width="536" style="max-width:100%;border-radius:6px;border:1px solid #e5e2db;display:block;margin:0 0 12px">`,
      );
      textParts.push(`[${def.label} — image: ${sec.image_url}]\n`);
    }
    if (sec.text) para(sec.text);
    if (def.hasUrl && sec.url) link("Read more", sec.url);
  }

  const bodyHtml = htmlParts.join("\n");
  const html = shell(title, bodyHtml, unsubscribeUrl, webUrl);

  const text = [
    title,
    "The Data Frontier",
    "",
    textParts.join("").trim(),
    "",
    "—",
    `View in browser: ${webUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

/** Mobile-first, single column, ~600px, ≥16px body (invariant 9). */
function shell(title: string, bodyHtml: string, unsubscribeUrl: string, webUrl: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f3f1ec;padding:0">
  <div style="max-width:600px;margin:0 auto;background:#fbfaf7;padding:0 20px">
    <div style="padding:24px 0;border-bottom:1px solid #e5e2db">
      <span style="font-family:Georgia,serif;font-size:20px;font-weight:900;color:#14171c">The Data<span style="color:#8a6212">Frontier</span></span>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.15;color:#14171c;margin:24px 0 4px">${esc(title)}</h1>
    <div style="padding:8px 0 24px">${bodyHtml}</div>
    <div style="padding:20px 0;border-top:1px solid #e5e2db;font-size:12px;color:#5a6270;line-height:1.6">
      <a href="${esc(webUrl)}" style="color:#5a6270">View in browser</a> ·
      The Data Frontier · Agentic AI, Data Science, and the future of intelligent systems.<br>
      <a href="${esc(unsubscribeUrl)}" style="color:#5a6270">Unsubscribe</a>
    </div>
  </div>
</body></html>`;
}
