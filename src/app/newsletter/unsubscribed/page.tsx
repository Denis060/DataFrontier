import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";

export const metadata: Metadata = { title: "Unsubscribed", robots: { index: false } };

export default function UnsubscribedPage() {
  return (
    <Shell>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col items-center justify-center px-5 text-center">
        <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">You&apos;ve unsubscribed</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          You won&apos;t receive any more newsletters. Changed your mind? You can resubscribe anytime.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/newsletter" className="rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85">
            Resubscribe
          </Link>
          <Link href="/" className="rounded border border-border px-5 py-2.5 text-[13px] font-medium hover:border-border-strong">
            Back to the site
          </Link>
        </div>
      </div>
    </Shell>
  );
}
