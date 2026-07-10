import { test, expect } from "@playwright/test";
import { loginAsAdmin, unique } from "./helpers";

/**
 * The regression this exists to prevent: writing a body, inserting an image,
 * and publishing must persist BOTH. Two data-loss bugs shipped here because
 * this loop was only ever checked by curl and by eye, never driven end-to-end.
 *
 * Desktop only — the write flow doesn't depend on viewport, and running it
 * once keeps the shared article state deterministic.
 */
test.describe("article editor", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "one browser is enough");

  test("write, insert image, publish — body and image survive a reload", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "write flow runs on desktop only");

    const marker = unique("e2e-body");
    const title = `E2E ${unique("article")}`;

    await loginAsAdmin(page);

    // ── Write ────────────────────────────────────────────────
    await page.goto("/admin/articles/new");
    await page.getByPlaceholder("Article title").fill(title);
    await page.getByPlaceholder(/Write in Markdown/).fill(`# Heading\n\n${marker}\n`);

    // ── Insert an image via the toolbar file input ───────────
    await page
      .locator('label:has-text("Insert image") input[type="file"]')
      .setInputFiles("e2e/fixtures/sample.png");
    // The uploaded Markdown lands in the body; wait for its URL to appear.
    await expect(page.getByPlaceholder(/Write in Markdown/)).toHaveValue(
      /!\[.*\]\(https:\/\/.*supabase\.co\/storage.*\.png\)/,
      { timeout: 20_000 },
    );

    // ── Save first: a new article has no id yet, so Publish appears only
    //    after the initial save creates the row. ──
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/articles\/[0-9a-f-]{36}\?saved=1/, {
      timeout: 15_000,
    });
    const editUrl = page.url().replace("?saved=1", "");

    // The body (with the image markdown) must survive that first save.
    await expect(page.getByPlaceholder(/Write in Markdown/)).toHaveValue(
      new RegExp(marker),
    );

    // ── Publish (must save the whole form, not just flip status) ──
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page).toHaveURL(/\?saved=1/, { timeout: 15_000 });

    // ── Reopen: the body must still be there (the bug that lost it) ──
    await page.goto(editUrl);
    await expect(page.getByPlaceholder(/Write in Markdown/)).toHaveValue(
      new RegExp(marker),
    );

    // ── Public page: body text AND the image render ──────────
    const slug = await page.locator('input[name="slug"]').inputValue();
    await page.goto(`/article/${slug}`);
    await expect(page.getByText(marker)).toBeVisible();
    const img = page.locator('.article-prose img').first();
    await expect(img).toBeVisible();
    // The image actually loads (naturalWidth > 0), not just present in the DOM.
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    // ── Cleanup: delete the article we made ──────────────────
    await page.goto(editUrl);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete article" }).click();
    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 15_000 });
  });
});
