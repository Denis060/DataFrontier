import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Contact | Everyday Data Science" };
export const revalidate = 3600;

export default async function ContactPage() {
  const db = await createClient();
  const { data: settings } = await db
    .from("site_settings")
    .select("contact_email, socials")
    .eq("id", true)
    .maybeSingle();

  const email = settings?.contact_email ?? "hello@everydaydatascience.com";
  const socials = Object.entries((settings?.socials ?? {}) as Record<string, unknown>).filter(
    (e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0,
  );

  return (
    <InfoPage
      eyebrow="Get in touch"
      title="Contact"
      intro="Questions, corrections, pitches, or partnership ideas, we'd love to hear from you."
    >
      <p>
        Email us at{" "}
        <a href={`mailto:${email}`}>{email}</a>. We read everything and reply to most.
      </p>
      <ul>
        <li>
          <strong>Pitches &amp; contributions:</strong> see the{" "}
          <a href="/write">Write for Us</a> page.
        </li>
        <li>
          <strong>Advertising &amp; sponsorship:</strong> see <a href="/advertise">Advertise</a>.
        </li>
        <li>
          <strong>Corrections:</strong> email us with the article link and the fix.
        </li>
      </ul>
      {socials.length > 0 && (
        <p>
          You can also find us on{" "}
          {socials.map(([name, url], i) => (
            <span key={name}>
              {i > 0 && ", "}
              <a href={url} target="_blank" rel="noopener noreferrer">
                {name}
              </a>
            </span>
          ))}
          .
        </p>
      )}
    </InfoPage>
  );
}
