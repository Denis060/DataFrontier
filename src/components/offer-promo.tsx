import Link from "next/link";
import { Download } from "lucide-react";
import type { PromoOffer } from "@/lib/offer-match";

/**
 * A free offer, promoted where it fits: "end" closes an article (instead of
 * the plain newsletter box), "rail" sits in the article sidebar, "card" is
 * for the homepage. All lead to the offer's own page, where the email is asked.
 */
export function OfferPromo({ offer, variant = "end" }: { offer: PromoOffer; variant?: "end" | "rail" | "card" }) {
  const href = `/free/${offer.slug}`;

  if (variant === "rail") {
    return (
      <Link href={href} className="group block overflow-hidden rounded-lg border border-gold/40 bg-gold-dim transition-colors hover:border-gold">
        {offer.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.cover} alt="" className="aspect-[16/9] w-full object-cover object-top" />
        )}
        <div className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">Free download</p>
          <p className="mt-1 font-serif text-[16px] leading-snug font-black group-hover:opacity-80">{offer.title}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-gold">
            <Download className="size-3.5" aria-hidden /> Get it free →
          </p>
        </div>
      </Link>
    );
  }

  return (
    <aside className={`${variant === "end" ? "mt-10" : ""} overflow-hidden rounded-lg border border-gold/40 bg-gold-dim`}>
      <div className="grid sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="p-5 sm:p-7">
          <p className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">
            <Download className="size-3.5" aria-hidden /> Free download
          </p>
          <p className="font-serif text-[21px] leading-tight font-black tracking-[-0.3px]">{offer.title}</p>
          {offer.tagline && <p className="mt-2 text-[14px] leading-relaxed text-muted">{offer.tagline}</p>}
          <Link
            href={href}
            className="mt-4 inline-flex items-center gap-2 rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
          >
            Get it free →
          </Link>
          <p className="mt-2 text-[11px] text-muted">Comes with The Everyday Brief, our free weekly newsletter.</p>
        </div>
        {offer.cover && (
          <Link href={href} aria-hidden tabIndex={-1} className="hidden border-l border-gold/30 sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={offer.cover} alt="" className="h-full w-full object-cover object-top" />
          </Link>
        )}
      </div>
    </aside>
  );
}
