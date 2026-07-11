import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Terms of Use — Everyday Data Science" };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" title="Terms of Use" intro="Last updated July 2026.">
      <p>By using Everyday Data Science, you agree to these terms. If you don&apos;t, please don&apos;t use the site.</p>

      <h2>Using the site</h2>
      <p>
        You may read, share, and link to our content freely. You may not scrape the site at scale,
        republish articles in full without permission, or use the site to break the law.
      </p>

      <h2>Accounts and contributions</h2>
      <ul>
        <li>You&apos;re responsible for activity under your account.</li>
        <li>
          If you contribute an article, you confirm it&apos;s your own work and grant us the right
          to publish and promote it. You keep ownership of what you write.
        </li>
        <li>We may edit, decline, or remove submissions at our discretion.</li>
      </ul>

      <h2>Our content</h2>
      <p>
        Articles remain the property of their authors. Everyday Data Science name, design, and
        compilation are ours. Don&apos;t reproduce them without permission.
      </p>

      <h2>Disclaimer</h2>
      <p>
        Content is provided for information, not as professional advice. We work to be accurate but
        make no warranties. The site is provided &quot;as is,&quot; and we aren&apos;t liable for
        losses arising from its use.
      </p>

      <p>
        <em>
          This is a starting-point document. Have it reviewed by someone qualified before relying on
          it commercially.
        </em>
      </p>
    </InfoPage>
  );
}
