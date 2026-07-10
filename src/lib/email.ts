import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL ?? "newsletter@thedatafrontier.com";

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
  if (!resend) {
    console.info(`[email:skipped] no RESEND_API_KEY — would send "${subject}" to ${to}`);
    return { skipped: true as const };
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { skipped: false as const };
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

/** Wraps content in the brand shell, with a required unsubscribe footer. */
export function emailShell(bodyHtml: string, unsubscribeUrl?: string) {
  return `
  <div style="max-width:560px;margin:0 auto;font-family:-apple-system,Segoe UI,sans-serif;color:#14171c;line-height:1.6">
    <div style="padding:24px 0;border-bottom:1px solid #e5e2db">
      <span style="font-family:Georgia,serif;font-size:20px;font-weight:900">The Data<span style="color:#8a6212">Frontier</span></span>
    </div>
    <div style="padding:24px 0;font-size:15px">${bodyHtml}</div>
    <div style="padding:20px 0;border-top:1px solid #e5e2db;font-size:12px;color:#5a6270">
      The Data Frontier · Agentic AI, Data Science, and the future of intelligent systems.
      ${unsubscribeUrl ? `<br><a href="${unsubscribeUrl}" style="color:#5a6270">Unsubscribe</a>` : ""}
    </div>
  </div>`;
}

export function confirmEmail(confirmUrl: string, unsubscribeUrl: string) {
  return emailShell(
    `<h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Confirm your subscription</h1>
     <p>Tap the button to start receiving the weekly dispatch.</p>
     <p style="margin:20px 0">
       <a href="${confirmUrl}" style="background:#8a6212;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:700">Confirm subscription →</a>
     </p>
     <p style="font-size:13px;color:#5a6270">If you didn't request this, ignore this email.</p>`,
    unsubscribeUrl,
  );
}

export const links = {
  confirm: (token: string) => `${SITE}/api/newsletter/confirm?token=${token}`,
  unsubscribe: (token: string) => `${SITE}/api/newsletter/unsubscribe?token=${token}`,
};
