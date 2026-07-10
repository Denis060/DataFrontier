import { test, expect } from "@playwright/test";
import { loginAsAdmin, unique } from "./helpers";

/**
 * The WYSIWYG editor must produce clean Markdown, and must refuse to open a
 * body that contains MDX components (it would strip them). Both are verified
 * here against the real editor.
 */
test.describe("rich editor", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "one browser is enough");

  test("rich toolbar writes Markdown that survives save", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");

    const title = `Rich ${unique("t")}`;
    await loginAsAdmin(page);
    await page.goto("/admin/articles/new");
    await page.getByPlaceholder("Article title").fill(title);

    // New blank article defaults to Rich mode.
    const rich = page.locator(".ProseMirror");
    await expect(rich).toBeVisible();

    // Type a heading via the toolbar, then body text with bold.
    await rich.click();
    // Heading via the toolbar (proves the buttons work + refocus the editor).
    await page.getByRole("button", { name: "Heading 2" }).click();
    await page.keyboard.type("My Heading");
    await page.keyboard.press("Enter");
    // Bold via the keyboard shortcut, which keeps editor focus deterministically.
    await page.keyboard.type("A line with ");
    await page.keyboard.press("Control+b");
    await page.keyboard.type("bold");
    await page.keyboard.press("Control+b");
    await page.keyboard.type(" text.");

    // Save, then reopen and switch to Markdown mode to inspect the source.
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\?saved=1/, { timeout: 15_000 });
    const editUrl = page.url().replace("?saved=1", "");

    await page.goto(editUrl);
    await page.getByRole("button", { name: "Markdown" }).click();
    const source = page.getByPlaceholder(/Write in Markdown/);
    await expect(source).toHaveValue(/## My Heading/);
    await expect(source).toHaveValue(/\*\*bold\*\*/);

    // Cleanup.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete article" }).click();
    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 15_000 });
  });

  test("Rich mode is locked for a body with MDX components", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");

    await loginAsAdmin(page);
    // The seeded hero article uses <Callout> and <Aside>.
    await page.goto("/admin/articles");
    await page.getByText("The Agent Revolution Is Here").click();
    await expect(page).toHaveURL(/\/admin\/articles\/[0-9a-f-]{36}/);

    // The Rich button must be disabled; Markdown is the active surface.
    const richBtn = page.getByRole("button", { name: "Rich", exact: true });
    await expect(richBtn).toBeDisabled();
    await expect(page.getByPlaceholder(/Write in Markdown/)).toBeVisible();
  });
});
