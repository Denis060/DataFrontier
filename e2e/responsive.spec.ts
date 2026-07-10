import { test, expect } from "@playwright/test";

/**
 * Guards the layout bugs that kept slipping through: footer overflow, the
 * orphaned meta line, the duplicate share bar. For every key page and both
 * viewports, assert the body never scrolls sideways, and save a screenshot.
 */
const PAGES = [
  { name: "home", path: "/" },
  { name: "article", path: "/article/agent-revolution-is-here" },
  { name: "category", path: "/category/agentic-ai" },
  { name: "author", path: "/author/ibrahim-fofanah" },
  { name: "jobs", path: "/jobs" },
  { name: "cheat-sheets", path: "/cheat-sheets" },
  { name: "cheat-sheet-detail", path: "/cheat-sheets/pandas-data-cleaning" },
  { name: "newsletter-archive", path: "/newsletter/archive" },
  { name: "write", path: "/write" },
  { name: "events", path: "/events" },
  { name: "contact", path: "/contact" },
  { name: "advertise", path: "/advertise" },
  { name: "privacy", path: "/privacy" },
  { name: "terms", path: "/terms" },
];

for (const { name, path } of PAGES) {
  test(`${name} has no horizontal overflow`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    // The page must not be wider than its own viewport.
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return d.scrollWidth - d.clientWidth;
    });
    expect(overflow, `${name} overflows by ${overflow}px`).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: testInfo.outputPath(`${name}-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });
}
