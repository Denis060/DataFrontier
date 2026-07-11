import { test, expect } from "@playwright/test";

/**
 * Opening the search bar must not push the layout sideways. This regressed
 * once: on mobile the inline input had no room next to the toggle/hamburger,
 * so it forced 122px of horizontal overflow.
 */
test("opening search does not cause horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder(/Search articles/).fill("africa");
  // Let the debounced dropdown open.
  await page.waitForTimeout(700);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `search-open overflow ${overflow}px`).toBeLessThanOrEqual(1);

  // A result is reachable and navigable.
  const first = page.locator('form a[href^="/"]').first();
  await expect(first).toBeVisible();
});
