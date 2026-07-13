import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { AccountForm, type AccountProfile } from "@/components/account/account-form";
import { PushToggle } from "@/components/push-toggle";

export const metadata: Metadata = { title: "Your account — Everyday Data Science", robots: { index: false } };

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/account");

  const db = await createClient();
  const [{ data: row }, { data: auth }] = await Promise.all([
    db.from("profiles").select("full_name, title, bio, avatar_url, socials, slug").eq("id", profile.id).single(),
    db.auth.getUser(),
  ]);

  const data: AccountProfile = {
    full_name: row?.full_name ?? "",
    title: row?.title ?? "",
    bio: row?.bio ?? "",
    avatar_url: row?.avatar_url ?? "",
    socials: (row?.socials ?? {}) as AccountProfile["socials"],
  };

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[640px] px-5 py-12 sm:px-8">
        <h1 className="mb-1 font-serif text-3xl font-black tracking-[-0.5px]">Your account</h1>
        <p className="mb-8 text-[13px] text-muted">
          Your name and bio appear on your public author page.
          {row?.slug && (
            <>
              {" "}
              <Link href={`/author/${row.slug}`} className="text-gold hover:underline">View it →</Link>
            </>
          )}
        </p>
        <AccountForm email={auth.user?.email ?? ""} profile={data} />

        <section className="mt-5 rounded-md border border-border bg-bg2 p-5">
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-[2px] text-gold">Notifications</h2>
          <p className="mb-4 text-[13px] text-muted">
            Get a browser notification the moment a new article is published — no inbox needed.
          </p>
          <PushToggle />
        </section>
      </div>
    </Shell>
  );
}
