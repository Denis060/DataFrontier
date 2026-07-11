# Newsletter — sending setup (owner checklist)

This is the one-time setup that must land **before the first real send**. It's
your job (DNS + billing); the code is already built and waiting. Everything here
has external lead time — domain verification and DMARC propagation can take
minutes to 48 hours — so start now.

> **Guardrail:** the sending engine is inert until (a) a verified domain +
> `RESEND_API_KEY` exist, (b) an issue is scheduled, and (c) you explicitly
> approve the first send. Nothing below sends email on its own.

---

## 1. Use a dedicated sending subdomain (strongly recommended)

Send newsletters from **`news.thedatafrontier.com`**, not the root
`thedatafrontier.com`.

**Why:** email reputation is per-sending-domain. If a newsletter ever triggers
spam complaints, that damage is quarantined to `news.` and can never degrade the
root domain's ability to deliver the things you can't afford to lose —
password resets, login links, transactional mail. Google/Yahoo bulk-sender rules
also treat a clean, dedicated subdomain more favorably.

You will send **from:** `newsletter@news.thedatafrontier.com`.

---

## 2. Resend

1. **Upgrade to Resend Pro (~$20/mo).** The free tier caps at 100 emails/day,
   which makes a real issue send impossible. Do this first.
2. In the Resend dashboard → **Domains → Add Domain**, enter
   `news.thedatafrontier.com`.
3. Resend will generate a set of DNS records **specific to your account** — a
   DKIM key, an SPF include, and a bounce/return-path record. **Copy them
   verbatim** into your DNS provider. Do not hand-type the DKIM value; it's long
   and a single wrong character breaks signing.
4. Wait for Resend to show the domain as **Verified** (green). This is the gate
   for everything else.
5. Create a **Production API key** (Resend → API Keys). This becomes
   `RESEND_API_KEY` in Vercel (step 4 below). Treat it like a password.

---

## 3. DNS records

Add these at your DNS provider (wherever `thedatafrontier.com`'s nameservers
live). The exact SPF/DKIM values come from Resend in step 2 — the table shows
the **shape** so you know what you're pasting where.

| Type  | Name (host)                          | Value                                  | Notes |
|-------|--------------------------------------|----------------------------------------|-------|
| TXT   | `news.thedatafrontier.com`           | `v=spf1 include:<resend-spf> -all`     | SPF — authorizes Resend to send. Value from Resend. |
| CNAME/TXT | `resend._domainkey.news…` (Resend tells you exact host) | `<long DKIM key from Resend>` | DKIM — cryptographic signature. **Paste verbatim.** |
| MX / TXT | bounce host from Resend            | `<from Resend>`                        | Return-path / bounce handling. |
| TXT   | `_dmarc.news.thedatafrontier.com`    | `v=DMARC1; p=none; rua=mailto:dmarc@thedatafrontier.com` | DMARC — see below. |

### DMARC — start in monitor mode, then tighten

Begin with **`p=none`** (above). This asks receivers to *report* on
authentication without quarantining anything, so a misconfiguration can't silently
send your first issue to spam. Point `rua=` at a mailbox you actually read.

After the first successful send confirms SPF + DKIM pass in the DMARC reports
(usually a week of data), tighten to:

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@thedatafrontier.com; pct=100; adkim=s; aspf=s
```

Don't jump straight to `p=reject` — quarantine first, watch reports, then reject.

---

## 4. Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables**
(Production). The app reads all of them at runtime.

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | Production key from Resend step 2.5 |
| `RESEND_FROM_EMAIL` | `newsletter@news.thedatafrontier.com` |
| `CRON_SECRET` | A fresh random string — generate with `openssl rand -hex 32`. Guards the send endpoint; Vercel Cron sends it automatically (step 5). |
| `RESEND_WEBHOOK_SECRET` | The Svix signing secret (`whsec_…`) from the Resend webhook you create in step 6. Verifies delivery webhooks; without it the webhook endpoint fails closed. |
| `NEXT_PUBLIC_SITE_URL` | `https://thedatafrontier.com` (or the live Vercel URL) — used to build unsubscribe + "view in browser" links. Must NOT be `localhost` in production. |

> `RESEND_FROM_EMAIL` currently defaults to `newsletter@thedatafrontier.com` in
> `.env.example`; update it to the `news.` subdomain once verified.

---

## 5. Vercel Cron (already configured in the repo)

[`vercel.json`](../vercel.json) registers the dispatcher:

```json
{ "path": "/api/cron/send-newsletter", "schedule": "*/5 * * * *" }
```

- **This runs every 5 minutes**, which requires a **Vercel Pro** plan. On the
  Hobby plan, Vercel only permits **one cron per day** — change the schedule to
  `0 * * * *` (hourly is still Pro) or a daily time, and know that a scheduled
  issue won't go out until the next tick. Confirm your Vercel plan.
- Vercel Cron automatically attaches `Authorization: Bearer $CRON_SECRET` to each
  invocation when `CRON_SECRET` is set (step 4), so the endpoint authenticates
  itself. No public trigger is exposed.
- When no issue is due, each tick is a single cheap DB query and returns
  immediately.

> Newer projects can express crons in `vercel.ts` instead of `vercel.json`
> (Vercel's current recommendation). We use `vercel.json` here to avoid adding a
> build-time dependency; either works.

---

## 6. Resend webhook (bounce/complaint protection + stats)

Bounces and spam complaints **will** happen on issue #1, and hard bounces must
auto-remove those addresses before the next send or your sending reputation
decays. This must be live **before** the first real send.

1. In Resend → **Webhooks → Add Endpoint**, point it at
   `https://thedatafrontier.com/api/webhooks/resend`.
2. Subscribe to these events: **`email.delivered`, `email.opened`,
   `email.bounced`, `email.complained`**.
3. Copy the endpoint's **Signing Secret** (`whsec_…`) into
   `RESEND_WEBHOOK_SECRET` in Vercel (step 4).

The endpoint verifies every webhook's signature, dedupes redelivered events, adds
hard bounces + complaints to the suppression list (soft/transient bounces are
counted but the subscriber is kept), and tracks real delivered/opened/bounced/
complained counts per issue.

## 7. Owner go-live checklist

- [ ] Resend upgraded to Pro
- [ ] `news.thedatafrontier.com` shows **Verified** in Resend
- [ ] SPF, DKIM, DMARC (`p=none`) records live in DNS
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`
      set in Vercel Production
- [ ] Vercel plan confirmed (cron frequency matches `vercel.json`)
- [ ] **Test-send** to your own inbox passes: lands in inbox not spam, renders on
      a phone, readable with images blocked, one-click unsubscribe works
- [ ] Bounce/complaint **webhooks** live (populates the suppression list — see
      the build plan; this must be on before issue #1)
- [ ] First real send **explicitly approved** by you

Only when every box is checked does a real issue go out.
