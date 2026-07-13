import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Privacy Policy | Everyday Data Science" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy Policy" intro="Last updated July 2026.">
      <p>
        This policy explains what data Everyday Data Science collects, why, and what you can do about it.
        We keep it short and plain.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Newsletter email:</strong> if you subscribe, we store your email address and
          whether you&apos;ve confirmed. Nothing else.
        </li>
        <li>
          <strong>Account details:</strong> if you sign in, we store your name, email, and (for
          contributors) a public profile, via our authentication provider.
        </li>
        <li>
          <strong>Usage:</strong> we count article views in aggregate. We do not build advertising
          profiles.
        </li>
      </ul>

      <h2>Who processes it</h2>
      <p>
        We use <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a>{" "}
        (database and authentication),{" "}
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a> (hosting),
        and <a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a> (email
        delivery). Your data is processed by these services solely to run the site.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Every newsletter includes a one-click unsubscribe link.</li>
        <li>
          You can request deletion of your account and associated data by emailing us at{" "}
          <a href="/contact">our contact address</a>.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use a session cookie to keep you signed in, and remember your light/dark theme preference
        locally. We do not use third-party advertising cookies.
      </p>

      <p>
        <em>
          This is a starting-point policy. Before relying on it commercially, have it reviewed
          against the jurisdictions you operate in.
        </em>
      </p>
    </InfoPage>
  );
}
