import type { Metadata } from "next";
import { Shell } from "@/components/layout/shell";
import { WriteForm } from "@/components/write-form";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Write for The Data Frontier",
  description: "Contribute articles on AI, data science, and agentic systems.",
};

export default async function WritePage() {
  const profile = await getCurrentProfile();

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[680px] px-5 py-12 sm:px-8 lg:py-16">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Write for us</p>
        <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
          Publish with the Data Frontier
        </h1>
        <p className="mt-4 mb-8 text-[15px] leading-relaxed text-muted">
          We publish practitioners — people who build things and can teach what they learned. If
          that&apos;s you, tell us what you want to write about. Approved contributors get an author
          page, a byline, and editorial support.
        </p>

        <WriteForm signedIn={!!profile} isReader={profile?.role === "reader"} />
      </div>
    </Shell>
  );
}
