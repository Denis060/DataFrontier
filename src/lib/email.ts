import "server-only";
import { appendFileSync } from "node:fs";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
// Include a display name so inboxes show "Everyday Data Science", not "newsletter".
const from = process.env.RESEND_FROM_EMAIL ?? "Everyday Data Science <newsletter@news.everydaydatascience.com>";

/**
 * Test/dev outbox. When EMAIL_OUTBOX names a file, every outgoing message is
 * appended there as JSONL so E2E tests (running in a separate process from the
 * server) can assert on what would be sent — subject, recipient, links — without
 * a provider. Unset in production, so this is a strict no-op there.
 */
function captureMail(rec: { to: string | string[]; subject: string; html?: string; text?: string }) {
  const outbox = process.env.EMAIL_OUTBOX;
  if (!outbox) return;
  try {
    appendFileSync(outbox, JSON.stringify({ ...rec, at: new Date().toISOString() }) + "\n");
  } catch {
    // Best-effort: a capture failure must never break a send.
  }
}

/** True once a Resend key is configured. */
export const emailConfigured = !!apiKey;

const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = { to: string | string[]; subject: string; html: string };

/**
 * Where replies go. The sending address (news.everydaydatascience.com) has no
 * inbox, so without this every "just hit reply" would vanish. Uses the contact
 * email from site settings, read once per server instance.
 */
let replyToCache: Promise<string | undefined> | null = null;
function replyTo(): Promise<string | undefined> {
  replyToCache ??= (async () => {
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const { data } = await createAdminClient().from("site_settings").select("contact_email").eq("id", true).maybeSingle();
      return data?.contact_email ?? undefined;
    } catch {
      return undefined;
    }
  })();
  return replyToCache;
}

/**
 * Sends via Resend, or degrades to a logged no-op when RESEND_API_KEY is
 * absent — so the subscription flow works in development before the key lands,
 * and the confirm URL is printed to the server console instead of emailed.
 */
export async function sendEmail({ to, subject, html }: SendArgs) {
  captureMail({ to, subject, html });
  if (!resend) {
    console.info(`[email:skipped] no RESEND_API_KEY — would send "${subject}" to ${to}`);
    // Print the email's main link (confirm, download…) so the flow can be
    // finished by hand in development.
    const action = html.match(/href="([^"]*(?:confirm|download)[^"]*)"/)?.[1];
    if (action) console.info(`[email:skipped]   link: ${action.replace(/&amp;/g, "&")}`);
    return { skipped: true as const };
  }
  const { error } = await resend.emails.send({ from, to, subject, html, replyTo: await replyTo() });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { skipped: false as const };
}

type MailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
};

/**
 * Single send with a plain-text alternative, custom headers (List-Unsubscribe),
 * and a per-recipient idempotency key — so a retry can never double-deliver.
 * Returns the provider message id. Throws on a real failure so the dispatcher
 * marks the ledger row failed; returns a synthetic id on the no-key mock path
 * so the engine is fully exercisable without sending anything real.
 */
export async function sendMail({ to, subject, html, text, headers, idempotencyKey }: MailArgs) {
  captureMail({ to, subject, html, text });
  if (!resend) {
    console.info(`[email:skipped] no RESEND_API_KEY — would send "${subject}" to ${to}`);
    return { id: `mock_${idempotencyKey ?? to}`, skipped: true as const };
  }
  const { data, error } = await resend.emails.send(
    { from, to, subject, html, text, headers, replyTo: await replyTo() },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(`Resend: ${error.message}`);
  return { id: data?.id ?? "", skipped: false as const };
}

/** Batch send (Resend caps a batch at 100). Used for issue delivery. */
export async function sendBatch(emails: SendArgs[]) {
  if (!resend) {
    console.info(`[email:skipped] no RESEND_API_KEY — would send ${emails.length} messages`);
    return { skipped: true as const, sent: 0 };
  }
  let sent = 0;
  const reply = await replyTo();
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100).map((e) => ({ from, replyTo: reply, ...e }));
    const { error } = await resend.batch.send(chunk);
    if (error) throw new Error(`Resend batch: ${error.message}`);
    sent += chunk.length;
  }
  return { skipped: false as const, sent };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Outlook-safe, centered ~520px brand shell with the wordmark and an optional
 *  unsubscribe footer. `preheader` sets the inbox preview line. */
export function emailShell(bodyHtml: string, unsubscribeUrl?: string, preheader?: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f3f1ec;-webkit-text-size-adjust:100%">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f1ec">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;background:#fbfaf7;border:1px solid #e5e2db;border-radius:10px">
        <tr><td style="padding:26px 30px 4px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#14171c;line-height:1.6">
          <div style="padding-bottom:20px;border-bottom:1px solid #e5e2db">
            <span style="font-family:Georgia,serif;font-size:20px;font-weight:900;color:#14171c">Everyday <span style="color:#8a6212">Data Science</span></span>
          </div>
          <div style="padding-top:22px;font-size:15px">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:18px 30px;border-top:1px solid #e5e2db;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;color:#5a6270;line-height:1.6">
          Everyday Data Science · Practical AI, ML &amp; data science for people who build.
          ${unsubscribeUrl ? `<br><a href="${unsubscribeUrl}" style="color:#5a6270">Unsubscribe</a>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** A compact "here's what you get" list — gold ticks, tight rows, email-safe. */
function benefitList(items: string[]): string {
  const rows = items
    .map(
      (t) =>
        `<tr><td valign="top" style="padding:3px 8px 3px 0;color:#8a6212;font-weight:700">&#10003;</td>` +
        `<td style="padding:3px 0;font-size:14px;line-height:1.5;color:#14171c">${t}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px">${rows}</table>`;
}

/** offerTitle: the free offer they signed up for, if any (see lib/free-offers). */
export function confirmEmail(confirmUrl: string, unsubscribeUrl: string, offerTitle?: string | null) {
  const offer = offerTitle ? escHtml(offerTitle) : null;
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">${offer ? `Confirm to get ${offer}` : "Confirm your subscription"}</h1>
     <p style="margin:0 0 18px">${
       offer
         ? `One tap and <strong>${offer}</strong> is yours. Confirming also subscribes you to <strong>The Everyday Brief</strong>, our free weekly dispatch on AI, ML and data science. Unsubscribe any time.`
         : "You're one tap from <strong>The Everyday Brief:</strong> a free weekly dispatch on AI, ML, and data science for people who actually build things."
     }</p>
     <p style="margin:0 0 22px">
       <a href="${confirmUrl}" style="display:inline-block;background:#8a6212;color:#fff;text-decoration:none;padding:13px 26px;border-radius:6px;font-weight:700;font-size:15px">${offer ? "Confirm and get it" : "Confirm subscription"} &rarr;</a>
     </p>
     <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">Every Tuesday, you'll get</p>
     ${benefitList([
       "A cheat sheet worth saving",
       "One practical tip you can use that day",
       "The one thing worth reading this week",
       "An African AI story you won't find elsewhere",
       "An opportunity: a job, grant, or call",
     ])}
     <p style="font-size:13px;color:#5a6270;margin:0">If you didn't request this, you can safely ignore this email.</p>`,
    unsubscribeUrl,
    "Confirm your subscription to The Everyday Brief, practical AI, ML & data science, weekly.",
  );
}

/**
 * Sent when a subscriber gets a free offer: right after confirming, or
 * straight away if they were already subscribed. Doubles as the welcome.
 */
export function offerEmail(a: { title: string; downloadUrl: string; unsubscribeUrl: string; isNew: boolean }) {
  const title = escHtml(a.title);
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">Here's your ${title}</h1>
     <p style="margin:0 0 18px">Thanks for ${a.isNew ? "joining us" : "reading"}. Your download is ready:</p>
     <p style="margin:0 0 22px">
       <a href="${a.downloadUrl}" style="display:inline-block;background:#8a6212;color:#fff;text-decoration:none;padding:13px 26px;border-radius:6px;font-weight:700;font-size:15px">Download ${title} &rarr;</a>
     </p>
     <p style="margin:0 0 14px;font-size:13px;color:#5a6270">The link is yours to keep; open this email again any time you need it.</p>
     ${
       a.isNew
         ? `<p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">What comes next, every Tuesday</p>
     ${benefitList([
       "A cheat sheet worth saving",
       "One practical tip you can use that day",
       "The one thing worth reading this week",
       "An African AI story you won't find elsewhere",
       "An opportunity: a job, grant, or call",
     ])}`
         : ""
     }
     <p style="margin:0 0 14px">Got a question or a topic you want covered? Just hit reply, I read every email.</p>
     <p style="margin:0 0 4px">Glad you're here,</p>
     <p style="margin:0;font-weight:700">Ibrahim · Everyday Data Science</p>`,
    a.unsubscribeUrl,
    `Your ${a.title} is ready to download.`,
  );
}

/**
 * Sent once, right after someone confirms — the warm "you're in, here's what to
 * expect" note. Personal, signed, and invites a reply.
 */
export function welcomeEmail(unsubscribeUrl: string) {
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">You're in, welcome 👋</h1>
     <p style="margin:0 0 14px">Thanks for subscribing to <strong>The Everyday Brief</strong>. It's for people who want to get better at AI, ML, and data science, without the hype, the fake gurus, or unrealistic promises.</p>
     <p style="margin:0 0 14px">I'm Ibrahim, a data scientist and AI researcher. I got tired of AI news written by people who don't build things, so each week I send one short issue of things actually worth your time.</p>
     <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">What to expect every Tuesday</p>
     ${benefitList([
       "A cheat sheet worth saving",
       "One practical tip you can use that day",
       "The one thing worth reading this week",
       "An African AI story you won't find elsewhere",
       "An opportunity: a job, grant, or call",
     ])}
     <p style="margin:0 0 14px">Got a question or a topic you want covered? Just hit reply, I read every email.</p>
     <p style="margin:0 0 14px">And if you build things yourself, write for us. We publish practitioners, and you can even republish a post from your own blog: <a href="${SITE}/write" style="color:#8a6212;font-weight:700">everydaydatascience.com/write</a>.</p>
     <p style="margin:0 0 4px">Glad you're here,</p>
     <p style="margin:0;font-weight:700">Ibrahim · Everyday Data Science</p>`,
    unsubscribeUrl,
    "You're in, here's what to expect from The Everyday Brief.",
  );
}

/**
 * The second (and last) welcome-series touch — a light check-in a couple of days
 * after confirming. Its whole job is to earn a reply, not to sell.
 */
export function welcomeFollowupEmail(unsubscribeUrl: string) {
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">Quick check-in 👋</h1>
     <p style="margin:0 0 14px">You joined <strong>The Everyday Brief</strong> a couple of days ago, thanks again. Your issues land every Tuesday.</p>
     <p style="margin:0 0 14px">One thing makes this newsletter genuinely better: <strong>your reply</strong>. What are you building right now, and what do you want more of, deep dives, quick tips, or opportunities? Just hit reply. I read every one.</p>
     <p style="margin:0 0 14px">Until Tuesday, the full archive lives at <a href="${SITE}" style="color:#8a6212;font-weight:700">everydaydatascience.com</a>.</p>
     <p style="margin:0 0 4px">Talk soon,</p>
     <p style="margin:0;font-weight:700">Ibrahim · Everyday Data Science</p>`,
    unsubscribeUrl,
    "A quick hello, and one question for you.",
  );
}

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Sent to the applicant right after they send a pitch, so it never feels lost. */
export function applicationReceivedEmail(name: string, republish: boolean) {
  const first = escHtml(name.split(" ")[0] || "there");
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">Got it, ${first}. Thank you.</h1>
     <p style="margin:0 0 14px">Your ${republish ? "request to republish your post" : "pitch"} for <strong>Everyday Data Science</strong> has arrived, and a real person will read it.</p>
     <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">What happens next</p>
     ${benefitList([
       "We read every pitch ourselves",
       "If it's a fit, you get an author account and a link to start your draft",
       "You can check where it stands any time on the Write for us page",
     ])}
     <p style="margin:0 0 14px">Want to add anything, a link or a second idea? Just reply to this email.</p>
     <p style="margin:0 0 4px">Talk soon,</p>
     <p style="margin:0;font-weight:700">Ibrahim · Everyday Data Science</p>`,
    undefined,
    "Your pitch arrived. Here's what happens next.",
  );
}

/** Tells the site owner a new pitch is waiting. All applicant text is escaped. */
export function newApplicationAdminEmail(a: {
  name: string;
  email: string | null;
  bio: string;
  topics: string;
  republish: string | null;
  links: string;
}) {
  const row = (label: string, value: string) =>
    `<p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">${label}</p>
     <p style="margin:0 0 14px;white-space:pre-wrap">${escHtml(value)}</p>`;
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">New ${a.republish ? "republish request" : "pitch"} from ${escHtml(a.name)}</h1>
     ${a.email ? row("Email", a.email) : ""}
     ${a.republish ? row("Post to republish", a.republish) : ""}
     ${row("Idea or topic", a.topics)}
     ${row("About them", a.bio)}
     ${a.links ? row("Other links", a.links) : ""}
     <p style="margin:0">
       <a href="${SITE}/admin/applications" style="display:inline-block;background:#8a6212;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:700">Review it in the newsroom &rarr;</a>
     </p>`,
    undefined,
    `New writer application from ${a.name}`,
  );
}

const button = (href: string, label: string) =>
  `<p style="margin:0 0 18px"><a href="${href}" style="display:inline-block;background:#8a6212;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:700">${label} &rarr;</a></p>`;
const quote = (text: string) =>
  `<p style="margin:0 0 18px;padding:12px 16px;border-left:3px solid #8a6212;background:#f3efe6;white-space:pre-wrap">${escHtml(text)}</p>`;

/** To the newsroom: a writer sent a piece for review. */
export function reviewSubmittedEmail(a: {
  title: string;
  writer: string;
  editUrl: string;
  resubmitted?: boolean;
  note?: string | null;
}) {
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">${a.resubmitted ? "Revised" : "Ready for review"}: ${escHtml(a.title)}</h1>
     <p style="margin:0 0 ${a.note ? 14 : 18}px">${
       a.resubmitted
         ? `${escHtml(a.writer)} made the changes you asked for and sent it back${a.note ? " with this note:" : "."} The editor shows exactly what changed.`
         : `${escHtml(a.writer)} sent this piece for review. Read it, then publish it or request changes with a note.`
     }</p>
     ${a.note ? quote(a.note) : ""}
     ${button(a.editUrl, "Open it in the newsroom")}`,
    undefined,
    `${a.writer} sent a piece for review.`,
  );
}

/** To the writer: the editor asked for changes, with their note. */
export function changesRequestedEmail(a: { name: string; title: string; note: string | null; editUrl: string }) {
  const first = escHtml(a.name.split(" ")[0] || "there");
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">A few changes before it goes live</h1>
     <p style="margin:0 0 14px">Hi ${first}, thanks for <strong>${escHtml(a.title)}</strong>. Before we publish it, the editor has asked for some changes${a.note ? ":" : "."}</p>
     ${a.note ? quote(a.note) : ""}
     <p style="margin:0 0 18px">Make the edits in your draft, then press <strong>Submit for review</strong> again. Questions? Just reply to this email.</p>
     ${button(a.editUrl, "Open your draft")}`,
    undefined,
    `Changes requested on ${a.title}.`,
  );
}

/** To the writer: a receipt for a piece they sent for review. */
export function reviewReceivedEmail(a: { name: string; title: string; resubmitted: boolean; workspaceUrl: string }) {
  const first = escHtml(a.name.split(" ")[0] || "there");
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">${a.resubmitted ? "Got your changes" : "It's with the editor"}, ${first}</h1>
     <p style="margin:0 0 14px">Thanks for sending <strong>${escHtml(a.title)}</strong>${a.resubmitted ? " back with your changes" : ""}. An editor will read it and either publish it or send it back with a note.</p>
     <p style="margin:0 0 18px">You'll get an email either way. Nothing else to do for now. You can still make small edits while it waits.</p>
     ${button(a.workspaceUrl, "Go to your workspace")}`,
    undefined,
    `${a.title} is with the editor.`,
  );
}

/** To a writer just added as a co-author. */
export function coauthorAddedEmail(a: { name: string; by: string; title: string; live: boolean; url: string }) {
  const first = escHtml(a.name.split(" ")[0] || "there");
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">You're a co-author, ${first}</h1>
     <p style="margin:0 0 14px">${escHtml(a.by)} added you as a co-author on <strong>${escHtml(a.title)}</strong>. Your name will appear in the byline, and the piece will be listed on your author page.</p>
     <p style="margin:0 0 18px">${
       a.live
         ? "It's already live."
         : "It isn't published yet. We'll email you when it goes live. If you shouldn't be on it, just reply to this email."
     }</p>
     ${a.live ? button(a.url, "See it live") : button(a.url, "Go to your workspace")}`,
    undefined,
    `${a.by} added you as a co-author.`,
  );
}

/** To the writer: their piece is live. */
export function articlePublishedEmail(a: { name: string; title: string; url: string; coauthor?: boolean }) {
  const first = escHtml(a.name.split(" ")[0] || "there");
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">You're published, ${first}</h1>
     <p style="margin:0 0 14px"><strong>${escHtml(a.title)}</strong> is now live on Everyday Data Science, ${a.coauthor ? "with you as a co-author" : "under your name"}.</p>
     <p style="margin:0 0 18px">Sharing it with your network is the best way to get it read. Readers can follow you from the article, so they hear about your next piece.</p>
     ${button(a.url, "See it live")}
     <p style="margin:0">Thank you for writing with us.</p>`,
    undefined,
    `${a.title} is live.`,
  );
}

/** To an applicant who wasn't accepted. Kind, short, and leaves the door open. */
export function applicationDeclinedEmail(a: { name: string; note: string | null }) {
  const first = escHtml(a.name.split(" ")[0] || "there");
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">Thank you for your pitch, ${first}</h1>
     <p style="margin:0 0 14px">We read it carefully, and it isn't the right fit for Everyday Data Science this time.</p>
     ${a.note ? quote(a.note) : ""}
     <p style="margin:0 0 18px">This isn't a no to you. A different angle, or a piece built on something you've worked on directly, is always welcome, and you can send a new pitch any time.</p>
     ${button(`${SITE}/write`, "Send a new pitch")}
     <p style="margin:0">Ibrahim · Everyday Data Science</p>`,
    undefined,
    "About your pitch to Everyday Data Science.",
  );
}

/** To the newsroom: a reader comment is waiting for approval. */
export function newCommentEmail(a: { who: string; article: string; body: string }) {
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">New comment to approve</h1>
     <p style="margin:0 0 10px">${escHtml(a.who)} commented on <strong>${escHtml(a.article)}</strong>:</p>
     ${quote(a.body.length > 600 ? `${a.body.slice(0, 600)}…` : a.body)}
     ${button(`${SITE}/admin/comments`, "Review comments")}`,
    undefined,
    `${a.who} commented on ${a.article}.`,
  );
}

/**
 * Sent when an admin approves a writer application. Before this, approval
 * changed the role silently and the new author never found out.
 */
export function authorApprovedEmail(name: string) {
  const first = escHtml(name.split(" ")[0] || "there");
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">You're in, ${first}. Welcome aboard.</h1>
     <p style="margin:0 0 14px">Your application to write for <strong>Everyday Data Science</strong> is approved. You now have an author account.</p>
     <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">How it works from here</p>
     ${benefitList([
       "Sign in and open the editor to start a draft",
       "Republishing a post? Paste its original link under Originally published at",
       "Send it for review when it's ready, and we'll edit it with you",
       "Once it's live, your byline links to your author page",
     ])}
     <p style="margin:0 0 22px">
       <a href="${SITE}/admin/articles/new" style="display:inline-block;background:#8a6212;color:#fff;text-decoration:none;padding:13px 26px;border-radius:6px;font-weight:700;font-size:15px">Start your first draft &rarr;</a>
     </p>
     <p style="margin:0 0 14px">Before your first piece goes live, add your photo, bio and links (ORCID, Google Scholar, GitHub, LinkedIn) in <a href="${SITE}/account" style="color:#8a6212;font-weight:700">your account</a>. They appear on your author page and under every article you write.</p>
     <p style="margin:0 0 14px">Stuck on an angle or a title? Just reply to this email.</p>
     <p style="margin:0 0 4px">Looking forward to reading it,</p>
     <p style="margin:0;font-weight:700">Ibrahim · Everyday Data Science</p>`,
    undefined,
    "Your application is approved. Here's how to publish your first piece.",
  );
}

export const links = {
  confirm: (token: string) => `${SITE}/api/newsletter/confirm?token=${token}`,
  unsubscribe: (token: string) => `${SITE}/api/newsletter/unsubscribe?token=${token}`,
};
