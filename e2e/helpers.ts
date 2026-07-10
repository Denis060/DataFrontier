import { type Page, expect } from "@playwright/test";

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
