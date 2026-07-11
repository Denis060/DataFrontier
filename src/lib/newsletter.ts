import "server-only";

/**
 * The Everyday Brief's fixed six-part structure, stored as one JSONB `content`
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
type SectionDef = { key: SectionKey; label: string; hint?: string; hasImage?: boolean; hasUrl?: boolean };

export const SECTION_DEFS: SectionDef[] = [
  {
    key: "cheat_sheet",
    label: "Cheat sheet of the week",
    hint: "A visual worth saving. Add the image, a link, and one line on why it's useful.",
    hasImage: true,
    hasUrl: true,
  },
  {
    key: "practical_tip",
    label: "One practical tip",
    hint: "One thing a reader can apply today — concrete, not theory.",
  },
  {
    key: "worth_reading",
    label: "Worth reading",
    hint: "The single best paper or article this week, plus why it matters.",
    hasUrl: true,
  },
  {
    key: "africa_ai",
    label: "Africa AI",
    hint: "An AI or data story from Africa readers won't find elsewhere.",
    hasUrl: true,
  },
  {
    key: "opportunity",
    label: "One opportunity",
    hint: "A job, grant, fellowship, or call for papers — with the link.",
    hasUrl: true,
  },
  {
    key: "closing_question",
    label: "Closing question",
    hint: "A question that invites a reply and starts a conversation.",
  },
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
        `<img src="${esc(sec.image_url)}" alt="${esc(alt)}" width="552" style="max-width:100%;height:auto;border-radius:6px;border:1px solid #e5e2db;display:block;margin:0 0 12px">`,
      );
      textParts.push(`[${def.label} — image: ${sec.image_url}]\n`);
    }
    if (sec.text) para(sec.text);
    if (def.hasUrl && sec.url) link("Read more", sec.url);
  }

  const bodyHtml = htmlParts.join("\n");
  // Preheader = the inbox preview line. Prefer the summary, then intro, then a
  // safe default — never leak "View in browser…" into the preview.
  const preheader = (summary || content.intro || "The Everyday Brief").slice(0, 140);
  const html = shell(title, preheader, bodyHtml, unsubscribeUrl, webUrl);

  const text = [
    title,
    "Everyday Data Science",
    "",
    textParts.join("").trim(),
    "",
    "—",
    `View in browser: ${webUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

/**
 * Mobile-first, single column, ~600px, ≥16px body (invariant 9). Laid out with
 * a centered table rather than a max-width div so Outlook (Windows/Word engine,
 * which ignores max-width on divs) renders it at a fixed 600px too. The
 * preheader div is the hidden inbox-preview line.
 */
function shell(
  title: string,
  preheader: string,
  bodyHtml: string,
  unsubscribeUrl: string,
  webUrl: string,
): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f1ec;-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}</div>
  <div style="display:none;max-height:0;overflow:hidden">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f1ec">
    <tr><td align="center" style="padding:0 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#fbfaf7">
        <tr><td style="padding:24px 24px 0">
          <div style="padding:0 0 24px;border-bottom:1px solid #e5e2db">
            <span style="font-family:Georgia,serif;font-size:20px;font-weight:900;color:#14171c">Everyday <span style="color:#8a6212">Data Science</span></span>
          </div>
          <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.15;color:#14171c;margin:24px 0 4px">${esc(title)}</h1>
        </td></tr>
        <tr><td style="padding:8px 24px 24px">${bodyHtml}</td></tr>
        <tr><td style="padding:20px 24px;border-top:1px solid #e5e2db;font-family:Georgia,serif;font-size:12px;color:#5a6270;line-height:1.6">
          <a href="${esc(webUrl)}" style="color:#5a6270">View in browser</a> ·
          Everyday Data Science · Practical AI, ML &amp; data science for people who build.<br>
          <a href="${esc(unsubscribeUrl)}" style="color:#5a6270">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
