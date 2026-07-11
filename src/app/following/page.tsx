import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { ArticleList } from "@/components/article-list";
import { getFollowingFeed } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Your feed", robots: { index: false } };

export default async function FollowingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/following");

  const articles = await getFollowingFeed(profile.id);

  return (
    <Shell>
      <header className="border-b border-border px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Your feed</p>
          <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            Following
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            The latest from the authors and topics you follow.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
        {articles.length === 0 ? (
          <div className="rounded border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted">
              You&apos;re not following anyone yet. Open an{" "}
              <Link href="/category/agentic-ai" className="text-gold hover:underline">
                author or a topic
              </Link>{" "}
              and hit Follow.
            </p>
          </div>
        ) : (
          <ArticleList articles={articles} />
        )}
      </div>
    </Shell>
  );
}
