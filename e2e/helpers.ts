import { readFileSync } from "node:fs";
import { type Page, expect } from "@playwright/test";

export type CapturedMail = { to: string | string[]; subject: string; html?: string; text?: string; at: string };

/**
 * Read the test email outbox the server writes to (EMAIL_OUTBOX). Returns all
 * captured messages; tests filter by recipient. Empty if the file doesn't exist
 * yet (no mail sent). Requires EMAIL_OUTBOX to be set for both the server and
 * the test process — it is, via .env.local.
 */
export function readOutbox(): CapturedMail[] {
  const path = process.env.EMAIL_OUTBOX;
  if (!path) return [];
  try {
    return readFileSync(path, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as CapturedMail);
  } catch {
    return [];
  }
}

/** Poll the outbox until a message to `email` appears, or time out. */
export async function waitForMail(email: string, timeoutMs = 10_000): Promise<CapturedMail> {
  const deadline = Date.now() + timeoutMs;
  const match = (m: CapturedMail) => (Array.isArray(m.to) ? m.to.includes(email) : m.to === email);
  while (Date.now() < deadline) {
    const found = readOutbox().filter(match);
    if (found.length) return found[found.length - 1];
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No email captured for ${email} within ${timeoutMs}ms`);
}

/** Delete a test subscriber straight through the Supabase REST API. */
export async function deleteSubscriber(email: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
}

/** Sign in through the real login form as the test admin. */
export async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in .env.local");
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Land somewhere authenticated; the header avatar replaces "Sign in".
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0, { timeout: 15_000 });
}

/** A unique-ish suffix without Date.now/Math.random flakiness in one run. */
export function unique(prefix: string) {
  return `${prefix}-${process.pid}-${Math.floor(process.hrtime()[1] / 1000)}`;
}
