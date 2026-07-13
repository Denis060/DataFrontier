import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Advertise" };
export const revalidate = 3600;

export default async function AdvertisePage() {
  const db = await createClient();
  const { data } = await db.from("site_settings").select("contact_email").eq("id", true).maybeSingle();
  const email = data?.contact_email ?? "hello@everydaydatascience.com";

  return (
    <InfoPage
      eyebrow="Partner with us"
      title="Advertise"
      intro="Reach a focused audience of data scientists, ML engineers, and AI practitioners."
    >
      <p>
        Everyday Data Science reaches practitioners who build with AI and data, the people who evaluate
        tools, choose platforms, and influence what their teams adopt. If that&apos;s who you want
        in front of, let&apos;s talk.
      </p>
      <h2>Ways to partner</h2>
      <ul>
        <li>
          <strong>Newsletter sponsorship:</strong> a clearly-labelled placement in the weekly
          dispatch.
        </li>
        <li>
          <strong>Sponsored deep-dives:</strong> practitioner-quality articles, marked as
          sponsored, held to the same editorial bar as everything else.
        </li>
        <li>
          <strong>Job listings:</strong> feature a role on the careers board.
        </li>
      </ul>
      <p>
        We only run partnerships that are genuinely useful to the audience. To start a conversation,
        email <a href={`mailto:${email}`}>{email}</a> with what you have in mind.
      </p>
    </InfoPage>
  );
}
