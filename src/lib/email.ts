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
 * Sends via Resend, or degrades to a logged no-op when RESEND_API_KEY is
 * absent — so the subscription flow works in development before the key lands,
 * and the confirm URL is printed to the server console instead of emailed.
 */
export async function sendEmail({ to, subject, html }: SendArgs) {
  captureMail({ to, subject, html });
  if (!resend) {
    console.info(`[email:skipped] no RESEND_API_KEY — would send "${subject}" to ${to}`);
    return { skipped: true as const };
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
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
    { from, to, subject, html, text, headers },
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
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100).map((e) => ({ from, ...e }));
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

export function confirmEmail(confirmUrl: string, unsubscribeUrl: string) {
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Confirm your subscription</h1>
     <p style="margin:0 0 18px">You're one tap from <strong>The Everyday Brief</strong> — a free weekly dispatch on AI, ML, and data science for people who actually build things.</p>
     <p style="margin:0 0 22px">
       <a href="${confirmUrl}" style="display:inline-block;background:#8a6212;color:#fff;text-decoration:none;padding:13px 26px;border-radius:6px;font-weight:700;font-size:15px">Confirm subscription &rarr;</a>
     </p>
     <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">Every Tuesday, you'll get</p>
     ${benefitList([
       "A cheat sheet worth saving",
       "One practical tip you can use that day",
       "The one thing worth reading this week",
       "An African AI story you won't find elsewhere",
       "An opportunity — a job, grant, or call",
     ])}
     <p style="font-size:13px;color:#5a6270;margin:0">If you didn't request this, you can safely ignore this email.</p>`,
    unsubscribeUrl,
    "Confirm your subscription to The Everyday Brief — practical AI, ML & data science, weekly.",
  );
}

/**
 * Sent once, right after someone confirms — the warm "you're in, here's what to
 * expect" note. Personal, signed, and invites a reply.
 */
export function welcomeEmail(unsubscribeUrl: string) {
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 14px">You're in — welcome 👋</h1>
     <p style="margin:0 0 14px">Thanks for subscribing to <strong>The Everyday Brief</strong>. It's for people who want to get better at AI, ML, and data science — without the hype, the fake gurus, or unrealistic promises.</p>
     <p style="margin:0 0 14px">I'm Ibrahim, a data scientist and AI researcher. I got tired of AI news written by people who don't build things, so each week I send one short issue of things actually worth your time.</p>
     <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#5a6270;font-weight:700">What to expect every Tuesday</p>
     ${benefitList([
       "A cheat sheet worth saving",
       "One practical tip you can use that day",
       "The one thing worth reading this week",
       "An African AI story you won't find elsewhere",
       "An opportunity — a job, grant, or call",
     ])}
     <p style="margin:0 0 14px">Got a question or a topic you want covered? Just hit reply — I read every email.</p>
     <p style="margin:0 0 4px">Glad you're here,</p>
     <p style="margin:0;font-weight:700">Ibrahim · Everyday Data Science</p>`,
    unsubscribeUrl,
    "You're in — here's what to expect from The Everyday Brief.",
  );
}

export const links = {
  confirm: (token: string) => `${SITE}/api/newsletter/confirm?token=${token}`,
  unsubscribe: (token: string) => `${SITE}/api/newsletter/unsubscribe?token=${token}`,
};
