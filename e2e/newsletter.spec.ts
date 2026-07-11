import { test, expect } from "@playwright/test";
import { unique, waitForMail, deleteSubscriber } from "./helpers";

/**
 * Double opt-in subscription, asserted against the captured email outbox rather
 * than a real provider. Proves: the confirmation email is generated with a
 * working confirm link, and following it confirms the subscriber. No real email
 * is sent (no RESEND_API_KEY in test/dev → the send path is a mock; the outbox
 * capture runs regardless).
 */
test.describe("newsletter double opt-in", () => {
  test.skip(!process.env.EMAIL_OUTBOX, "requires EMAIL_OUTBOX to capture email");

  test("subscribe → confirmation email → confirm link works", async ({ page }) => {
    const email = `${unique("e2e-sub")}@example.test`;

    try {
      await page.goto("/newsletter");
      await page.getByLabel("Email address").first().fill(email);
      await page.getByRole("button", { name: /Subscribe/ }).first().click();

      // The action reports success without revealing list membership.
      await expect(page.getByText("Check your inbox to confirm.")).toBeVisible({ timeout: 15_000 });

      // A confirmation email was generated for exactly this address.
      const mail = await waitForMail(email);
      expect(mail.subject).toContain("Confirm your subscription");
      expect(mail.html ?? "").toContain("/api/newsletter/confirm?token=");

      // Follow the confirm link from the email; it must confirm the subscriber.
      const url = (mail.html ?? "").match(/https?:\/\/[^"']*\/api\/newsletter\/confirm\?token=[^"'&]+/);
      expect(url, "confirm link present in email").not.toBeNull();

      await page.goto(url![0]);
      await expect(page).toHaveURL(/\/newsletter\/confirmed/);
    } finally {
      await deleteSubscriber(email);
    }
  });
});
