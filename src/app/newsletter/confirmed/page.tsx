import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";

export const metadata: Metadata = { title: "Subscription confirmed", robots: { index: false } };

export default function ConfirmedPage() {
  return (
    <Shell>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col items-center justify-center px-5 text-center">
        <p className="mb-3 text-4xl">✅</p>
        <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">You&apos;re in</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Your subscription is confirmed. The next dispatch lands in your inbox on Tuesday.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85">
            Back to the site
          </Link>
          <Link href="/newsletter/archive" className="rounded border border-border px-5 py-2.5 text-[13px] font-medium hover:border-border-strong">
            Read past issues
          </Link>
        </div>
      </div>
    </Shell>
  );
}
