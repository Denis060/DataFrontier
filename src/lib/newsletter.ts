import "server-only";

/**
 * The Everyday Brief's six-part structure, stored as one JSONB `content`
 * object and rendered to BOTH the email and the web archive from this single
 * source. Every field is optional so a draft can be partial, and issues saved
 * before headlines and per-section images existed still render unchanged.
 */
export type IssueSection = { title?: string; text?: string; url?: string; image_url?: string };

export type IssueContent = {
  intro?: string;
  cheat_sheet?: IssueSection;
  practical_tip?: IssueSection;
  worth_reading?: IssueSection;
  africa_ai?: IssueSection;
  opportunity?: IssueSection;
  closing_question?: IssueSection;
};

/** Filled in at render time from the site: what readers should see next, and who wrote what. */
export type IssueExtras = {
  more?: { title: string; url: string }[];
  writers?: string[];
  siteUrl?: string;
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
    hint: "One thing a reader can apply today, concrete, not theory.",
    hasImage: true,
  },
  {
    key: "worth_reading",
    label: "Worth reading",
    hint: "The single best paper or article this week, plus why it matters.",
    hasImage: true,
    hasUrl: true,
  },
  {
    key: "africa_ai",
    label: "Africa AI",
    hint: "An AI or data story from Africa readers won't find elsewhere.",
    hasImage: true,
    hasUrl: true,
  },
  {
    key: "opportunity",
    label: "One opportunity",
    hint: "A job, grant, fellowship, or call for papers, with the link.",
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

const GOLD = "#8a6212";
const INK = "#14171c";
const MUTED = "#5a6270";
const LINE = "#e5e2db";
const SERIF = "Georgia,serif";

/** Only links a reader can safely follow. */
const safeHref = (url: string) => (/^(https?:\/\/|mailto:)/i.test(url.trim()) ? url.trim() : null);

/**
 * Inline formatting on ESCAPED text: **bold**, *italic*, [label](https://…).
 * Everything the writer typed is escaped first, so the only tags that can
 * appear are the ones produced here.
 */
function inline(text: string, linkStyle: string): string {
  return esc(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, url: string) => {
      const href = safeHref(url.replace(/&amp;/g, "&"));
      return href ? `<a href="${esc(href)}" style="${linkStyle}">${label}</a>` : m;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
}

export type RichStyle = { p: string; list: string; li: string; link: string };

const EMAIL_STYLE: RichStyle = {
  p: `margin:0 0 12px;font-size:16px;line-height:1.6;color:${INK}`,
  list: `margin:0 0 12px;padding-left:22px;font-size:16px;line-height:1.6;color:${INK}`,
  li: "margin:0 0 4px",
  link: `color:${GOLD};font-weight:700`,
};

/**
 * Section text to HTML: paragraphs (blank line between), bullet lists
 * ("- " lines), numbered lists ("1. " lines), and the inline formats above.
 * Shared by the email and the web archive so both read the same.
 */
export function richText(text: string, style: RichStyle = EMAIL_STYLE): string {
  const out: string[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) out.push(`<p style="${style.p}">${para.map((l) => inline(l, style.link)).join("<br>")}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const tag = list.ordered ? "ol" : "ul";
    out.push(
      `<${tag} style="${style.list}">${list.items.map((i) => `<li style="${style.li}">${inline(i, style.link)}</li>`).join("")}</${tag}>`,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join("\n");
}

/** Plain-text twin of richText for the text/plain part. */
const plain = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)");

const filled = (s?: IssueSection) => !!s && !!(s.title || s.text || s.url || s.image_url);

type Rendered = { html: string; text: string };

/**
 * Render one issue to email-ready HTML + a plain-text alternative from the same
 * content. Layout: an "In this issue" list, then each story in its own box
 * (label, linked headline, image, text, read-more), the closing question as
 * "Over to you", then more from the site and who wrote this issue.
 * Every image has its headline above and its takeaway below, so the issue
 * reads with images blocked (the default in many clients).
 */
export function renderIssue(
  title: string,
  summary: string | null,
  content: IssueContent,
  unsubscribeUrl: string,
  webUrl: string,
  extras: IssueExtras = {},
): Rendered {
  const html: string[] = [];
  const text: string[] = [];
  const stories = SECTION_DEFS.filter((d) => d.key !== "closing_question" && filled(content[d.key]));

  if (summary) {
    html.push(`<p style="margin:0 0 20px;font-size:17px;line-height:1.55;color:${MUTED}">${inline(summary, EMAIL_STYLE.link)}</p>`);
    text.push(`${plain(summary)}\n`);
  }

  // "In this issue": a quick map of what's inside, once there's more than one story.
  if (stories.length >= 2) {
    const items = stories.map((d) => esc(content[d.key]!.title || d.label));
    html.push(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid ${LINE};border-radius:8px;background:#ffffff"><tr><td style="padding:16px 18px">
        <p style="margin:0 0 8px;font-family:${SERIF};font-size:15px;font-weight:700;color:${INK}">In this issue</p>
        <ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.6;color:${INK}">${items.map((i) => `<li style="margin:0 0 2px">${i}</li>`).join("")}</ul>
      </td></tr></table>`,
    );
    text.push(`IN THIS ISSUE\n${stories.map((d) => `- ${content[d.key]!.title || d.label}`).join("\n")}\n`);
  }

  if (content.intro) {
    html.push(richText(content.intro));
    text.push(`\n${plain(content.intro)}\n`);
  }

  for (const def of stories) {
    const sec = content[def.key]!;
    const href = sec.url ? safeHref(sec.url) : null;
    const parts: string[] = [];
    parts.push(
      `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED}">${esc(def.label)}</p>`,
    );
    if (sec.title) {
      const h = esc(sec.title);
      parts.push(
        `<h2 style="margin:0 0 12px;font-family:${SERIF};font-size:21px;line-height:1.25;color:${INK}">${
          href ? `<a href="${esc(href)}" style="color:${INK};text-decoration:underline;text-decoration-color:${GOLD}">${h}</a>` : h
        }</h2>`,
      );
    }
    if (def.hasImage && sec.image_url && safeHref(sec.image_url)) {
      const alt = sec.title || (sec.text ? sec.text.slice(0, 90) : def.label);
      const img = `<img src="${esc(sec.image_url)}" alt="${esc(alt)}" width="520" style="max-width:100%;height:auto;border-radius:6px;border:1px solid ${LINE};display:block;margin:0 0 14px">`;
      parts.push(href ? `<a href="${esc(href)}">${img}</a>` : img);
    }
    if (sec.text) parts.push(richText(sec.text));
    if (href) parts.push(`<p style="margin:4px 0 0"><a href="${esc(href)}" style="${EMAIL_STYLE.link}">Read the full piece →</a></p>`);

    html.push(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border:1px solid ${LINE};border-radius:8px;background:#ffffff"><tr><td style="padding:18px 20px">${parts.join("\n")}</td></tr></table>`,
    );
    text.push(
      `\n## ${def.label.toUpperCase()}${sec.title ? `\n${sec.title}` : ""}\n${sec.text ? `${plain(sec.text)}\n` : ""}${href ? `Read: ${href}\n` : ""}`,
    );
  }

  const q = content.closing_question;
  if (q?.text || q?.title) {
    html.push(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px;border-left:3px solid ${GOLD};background:#f3efe6"><tr><td style="padding:14px 18px">
        <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${GOLD}">Over to you</p>
        ${q.title ? `<p style="margin:0 0 6px;font-family:${SERIF};font-size:18px;font-weight:700;color:${INK}">${esc(q.title)}</p>` : ""}
        ${q.text ? richText(q.text) : ""}
        <p style="margin:0;font-size:14px;color:${MUTED}">Just hit reply. We read every answer.</p>
      </td></tr></table>`,
    );
    text.push(`\nOVER TO YOU\n${q.title ? `${q.title}\n` : ""}${q.text ? plain(q.text) : ""}\nJust hit reply.\n`);
  }

  if (extras.more?.length) {
    const site = extras.siteUrl ?? "";
    html.push(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border:1px solid ${LINE};border-radius:8px;background:#ffffff"><tr><td style="padding:18px 20px">
        <p style="margin:0 0 8px;font-family:${SERIF};font-size:17px;font-weight:700;color:${INK}">More from Everyday Data Science</p>
        <ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.6">${extras.more
          .map((m) => `<li style="margin:0 0 4px"><a href="${esc(m.url)}" style="${EMAIL_STYLE.link}">${esc(m.title)} →</a></li>`)
          .join("")}</ul>
        ${site ? `<a href="${esc(site)}" style="display:inline-block;background:${GOLD};color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:6px;font-weight:700;font-size:14px">Read more on the site</a>` : ""}
      </td></tr></table>`,
    );
    text.push(`\nMORE FROM EVERYDAY DATA SCIENCE\n${extras.more.map((m) => `- ${m.title}: ${m.url}`).join("\n")}\n`);
  }

  // Partner slot. No audience figures: the site never states numbers it can't stand behind.
  if (extras.siteUrl) {
    html.push(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border:1px solid ${LINE};border-radius:8px;background:#ffffff"><tr><td style="padding:16px 20px">
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED}">Partner with us</p>
        <p style="margin:0 0 6px;font-family:${SERIF};font-size:17px;font-weight:700;color:${INK}">Reach people who build with AI and data</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:${INK}">Sponsor an issue or a learning path. <a href="${esc(extras.siteUrl)}/advertise" style="${EMAIL_STYLE.link}">See how it works →</a> or just reply to this email.</p>
      </td></tr></table>`,
    );
  }

  // Credited in the footer ("brought to you by"), like a masthead.
  const names = extras.writers ?? [];
  const writersLine = names.length
    ? names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : null;
  if (writersLine) text.push(`\nThis issue was brought to you by ${writersLine}.\n`);

  // Preheader = the inbox preview line. Prefer the summary, then intro, then a
  // safe default; never leak "View in browser…" into the preview.
  const preheader = (summary || content.intro || "The Everyday Brief").slice(0, 140);
  const body = shell(title, preheader, html.join("\n"), unsubscribeUrl, webUrl, extras.siteUrl, writersLine);

  const plainText = [
    title,
    "Everyday Data Science",
    "",
    text.join("").trim(),
    "",
    "---",
    `View in browser: ${webUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { html: body, text: plainText };
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
  siteUrl?: string,
  writers?: string | null,
): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f1ec;-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}</div>
  <div style="display:none;max-height:0;overflow:hidden">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f1ec">
    <tr><td align="center" style="padding:0 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#fbfaf7">
        <tr><td style="padding:24px 24px 0">
          <div style="padding:0 0 18px;border-bottom:1px solid ${LINE}">
            <span style="font-family:${SERIF};font-size:20px;font-weight:900;color:${INK}">Everyday <span style="color:${GOLD}">Data Science</span></span>
            <span style="display:block;margin-top:4px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED}">The Everyday Brief</span>
          </div>
          <h1 style="font-family:${SERIF};font-size:26px;line-height:1.15;color:${INK};margin:24px 0 8px">${esc(title)}</h1>
        </td></tr>
        <tr><td style="padding:8px 24px 24px">${bodyHtml}</td></tr>
        <tr><td style="padding:0 24px 24px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${INK};border-radius:8px"><tr><td align="center" style="padding:26px 22px;font-family:${SERIF};color:#f3f1ec;line-height:1.7">
            ${writers ? `<p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#f3f1ec">This issue was brought to you by ${esc(writers)}.</p>` : ""}
            <p style="margin:0 0 14px;font-size:14px">
              <a href="${esc(webUrl)}" style="color:#d4a64a">View in browser</a>
              ${siteUrl ? ` · <a href="${esc(siteUrl)}/write" style="color:#d4a64a">Write for us</a>` : ""}
              · <a href="${esc(unsubscribeUrl)}" style="color:#d4a64a">Unsubscribe</a>
            </p>
            ${
              siteUrl
                ? `<p style="margin:0 0 14px;font-size:14px;color:#f3f1ec">Looking for more? <a href="${esc(siteUrl)}/series" style="color:#d4a64a">Learning paths</a> and <a href="${esc(siteUrl)}/cheat-sheets" style="color:#d4a64a">cheat sheets</a> on the site.</p>
            <p style="margin:0 0 14px;font-size:13px;color:#c9c4b8">Enjoyed this? Forward it to someone who builds. They can subscribe free at <a href="${esc(siteUrl)}/newsletter" style="color:#d4a64a">${esc(siteUrl.replace(/^https?:\/\//, ""))}/newsletter</a>.</p>`
                : ""
            }
            <p style="margin:0;font-size:12px;color:#9a9486">© ${new Date().getFullYear()} Everyday Data Science · Practical AI, ML &amp; data science for people who build.</p>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
