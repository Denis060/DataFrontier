import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { promoOffers } from "@/lib/offer-match";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Free downloads",
  description: "Free guides and packs for data scientists, analysts and AI engineers. Yours for an email address.",
  alternates: { canonical: "/free" },
};

/** Every live free offer, each linking to its own signup page. */
export default async function FreeIndexPage() {
  const offers = await promoOffers();

  return (
    <Shell>
      <header className="border-b border-border px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto w-full max-w-[1200px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Free downloads</p>
          <h1 className="font-serif text-[clamp(30px,5vw,46px)] leading-[1.08] font-black tracking-[-0.5px]">Take these with you</h1>
          <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-muted">
            Practical packs and guides you can print, pin and keep open while you work. Free: we email you the download,
            along with The Everyday Brief once a week.
          </p>
        </div>
      </header>

      <div className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[1200px]">
          {offers.length === 0 ? (
            <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
              Nothing to download yet. <Link href="/cheat-sheets" className="text-gold hover:underline">Browse the cheat sheets →</Link>
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/free/${o.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-bg2 transition-colors hover:border-gold/50"
                  >
                    {o.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.cover} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover object-top transition-opacity group-hover:opacity-90" />
                    ) : (
                      <div aria-hidden className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-gold-dim via-bg2 to-teal-dim">
                        <Download className="size-10 text-gold/50" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">Free download</p>
                      <h2 className="mt-1 font-serif text-[20px] leading-tight font-black group-hover:opacity-80">{o.title}</h2>
                      {o.tagline && <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">{o.tagline}</p>}
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-bold text-gold">
                        <Download className="size-3.5" aria-hidden /> Get it free →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-10 text-[13px] text-muted">
            Looking for single references? <Link href="/cheat-sheets" className="font-semibold text-gold hover:underline">Browse the cheat sheets →</Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
