import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { AuthorAvatar } from "@/components/author-avatar";
import { getWriters } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Our writers",
  description:
    "The practitioners and researchers who write for Everyday Data Science: data scientists, ML engineers and AI researchers who build what they write about.",
  alternates: { canonical: "/authors" },
};

export const revalidate = 300;

export default async function AuthorsPage() {
  const writers = await getWriters();

  return (
    <Shell>
      <header className="border-b border-border bg-bg2 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Our writers</p>
          <h1 className="font-serif text-[clamp(30px,5vw,48px)] leading-[1.08] font-black tracking-[-0.6px]">
            The people behind the work
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-muted">
            Everyone here builds what they write about. Follow a writer to get notified when they
            publish something new.
          </p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1100px] gap-5 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-12">
        {writers.map((w) => (
          <Link
            key={w.id}
            href={`/author/${w.slug}`}
            className="group flex flex-col rounded-lg border border-border bg-bg2 p-6 transition-colors hover:border-gold/40"
          >
            <div className="flex items-center gap-4">
              <AuthorAvatar name={w.full_name} src={w.avatar_url} className="size-16 text-xl" />
              <div className="min-w-0">
                <p className="font-serif text-[19px] leading-tight font-black transition-colors group-hover:text-gold">
                  {w.full_name}
                </p>
                {w.title && <p className="mt-1 text-[12px] text-muted">{w.title}</p>}
              </div>
            </div>
            {w.bio && <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-muted">{w.bio}</p>}
            <p className="mt-auto pt-5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
              {w.articles} {w.articles === 1 ? "article" : "articles"}
              {w.followers > 0 && ` · ${w.followers} ${w.followers === 1 ? "follower" : "followers"}`}
            </p>
          </Link>
        ))}

        {/* Always last: an open seat, so a short roster reads as an invitation. */}
        <Link
          href="/write"
          className="group flex flex-col items-start justify-center rounded-lg border border-dashed border-gold/40 bg-gold-dim p-6 transition-colors hover:border-gold"
        >
          <span className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-gold/50 text-gold">
            <PenLine className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-serif text-[19px] font-black">Your name here</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Built something worth explaining? Pitch an idea or republish a post from your own blog.
          </p>
          <p className="mt-4 text-[13px] font-semibold text-gold group-hover:underline">Write for us →</p>
        </Link>
      </div>
    </Shell>
  );
}
