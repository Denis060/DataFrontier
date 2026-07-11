// Branded Supabase Auth email templates for Everyday Data Science.
//
// Supabase's built-in auth emails (signup confirm, password reset, magic link,
// email change, invite) ship with a generic "powered by Supabase" template.
// This script rebrands all of them from one shared shell and applies them via
// the Management API. Re-run any time the brand changes.
//
//   node --env-file=.env.local scripts/apply-auth-emails.mjs
//
// Needs SUPABASE_ACCESS_TOKEN (a personal access token, sbp_...) in the env.
// Writes a copy of each template to supabase/templates/ for reference.
//
// NOTE: while auth still uses Supabase's shared email service (no custom SMTP),
// Supabase appends its own "powered by Supabase / opt out" footer regardless of
// this template. Configure custom SMTP (Resend) to send from your own domain
// and drop that footer entirely.

import { writeFileSync, mkdirSync } from "node:fs";

const REF = "tpfislnwpzxkisyqgedc";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SITE = "https://everydaydatascience.com";
if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN. Run with: node --env-file=.env.local scripts/apply-auth-emails.mjs");
  process.exit(1);
}

const TAGLINE = "Practical AI, ML &amp; data science for people who build.";

/** Outlook-safe, centered, ~520px shell with the Everyday Data Science wordmark. */
function shell({ preheader, heading, body, buttonLabel, note }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f3f1ec;-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f1ec">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;background:#fbfaf7;border:1px solid #e5e2db;border-radius:10px">
        <tr><td style="padding:28px 32px 0">
          <div style="padding:0 0 22px;border-bottom:1px solid #e5e2db">
            <span style="font-family:Georgia,serif;font-size:20px;font-weight:900;color:#14171c">Everyday <span style="color:#8a6212">Data Science</span></span>
          </div>
          <h1 style="font-family:Georgia,serif;font-size:23px;line-height:1.2;color:#14171c;margin:26px 0 12px">${heading}</h1>
          <p style="margin:0 0 22px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#14171c">${body}</p>
          <p style="margin:0 0 22px">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#8a6212;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:6px;font-family:-apple-system,Segoe UI,Roboto,sans-serif">${buttonLabel} &rarr;</a>
          </p>
          <p style="margin:0 0 6px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;line-height:1.6;color:#5a6270">
            If the button doesn't work, copy and paste this link:
          </p>
          <p style="margin:0 0 22px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;line-height:1.6;word-break:break-all">
            <a href="{{ .ConfirmationURL }}" style="color:#8a6212">{{ .ConfirmationURL }}</a>
          </p>
          <p style="margin:0 0 4px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;line-height:1.6;color:#5a6270">${note}</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e2db;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;color:#5a6270;line-height:1.6">
          <a href="${SITE}" style="color:#5a6270;font-weight:700;text-decoration:none">Everyday Data Science</a> &middot; ${TAGLINE}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const templates = {
  confirmation: {
    subject: "Confirm your email — Everyday Data Science",
    file: "confirm-signup.html",
    html: shell({
      preheader: "Confirm your email to activate your Everyday Data Science account.",
      heading: "Confirm your email",
      body: "Thanks for joining Everyday Data Science. Confirm your email address to activate your account and start reading.",
      buttonLabel: "Confirm your email",
      note: "If you didn't create this account, you can safely ignore this email.",
    }),
  },
  recovery: {
    subject: "Reset your password — Everyday Data Science",
    file: "reset-password.html",
    html: shell({
      preheader: "Reset your Everyday Data Science password.",
      heading: "Reset your password",
      body: "We received a request to reset the password for your Everyday Data Science account. Choose a new one below.",
      buttonLabel: "Reset password",
      note: "If you didn't request this, ignore this email — your password won't change.",
    }),
  },
  magic_link: {
    subject: "Your sign-in link — Everyday Data Science",
    file: "magic-link.html",
    html: shell({
      preheader: "Your one-time sign-in link for Everyday Data Science.",
      heading: "Your sign-in link",
      body: "Tap below to sign in to Everyday Data Science. This link works once and expires shortly.",
      buttonLabel: "Sign in",
      note: "If you didn't try to sign in, you can safely ignore this email.",
    }),
  },
  email_change: {
    subject: "Confirm your new email — Everyday Data Science",
    file: "email-change.html",
    html: shell({
      preheader: "Confirm the new email for your Everyday Data Science account.",
      heading: "Confirm your new email",
      body: "Confirm this address to finish updating the email on your Everyday Data Science account.",
      buttonLabel: "Confirm email change",
      note: "If you didn't request this change, contact us right away.",
    }),
  },
  invite: {
    subject: "You're invited to Everyday Data Science",
    file: "invite.html",
    html: shell({
      preheader: "You've been invited to Everyday Data Science.",
      heading: "You're invited",
      body: "You've been invited to join Everyday Data Science. Tap below to set up your account.",
      buttonLabel: "Accept invite",
      note: "If you weren't expecting this, you can ignore this email.",
    }),
  },
};

// Persist copies for version control / future config.toml use.
mkdirSync("supabase/templates", { recursive: true });
for (const t of Object.values(templates)) {
  writeFileSync(`supabase/templates/${t.file}`, t.html);
}

const payload = {
  site_url: SITE,
  uri_allow_list: `${SITE}/**,https://datafrontier.vercel.app/**`,
  mailer_subjects_confirmation: templates.confirmation.subject,
  mailer_templates_confirmation_content: templates.confirmation.html,
  mailer_subjects_recovery: templates.recovery.subject,
  mailer_templates_recovery_content: templates.recovery.html,
  mailer_subjects_magic_link: templates.magic_link.subject,
  mailer_templates_magic_link_content: templates.magic_link.html,
  mailer_subjects_email_change: templates.email_change.subject,
  mailer_templates_email_change_content: templates.email_change.html,
  mailer_subjects_invite: templates.invite.subject,
  mailer_templates_invite_content: templates.invite.html,
};

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  console.error("PATCH failed:", res.status, (await res.text()).slice(0, 400));
  process.exit(1);
}
console.log("✓ Applied branded auth email templates + site_url/allow-list.");
console.log("  site_url:", SITE);
console.log("  templates:", Object.keys(templates).join(", "));
