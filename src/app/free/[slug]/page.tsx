import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { OfferForm } from "@/components/offer-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Download } from "lucide-react";
import { lines, OFFER_COLUMNS, offerCover, type Offer } from "@/lib/free-offers";

type Props = { params: Promise<{ slug: string }> };

async function getOffer(slug: string): Promise<Offer | null> {
  const db = await createClient();
  // RLS shows only active offers to the public.
  const { data } = await db.from("lead_magnets").select(OFFER_COLUMNS).eq("slug", slug).maybeSingle();
  return (data as Offer | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getOffer((await params).slug);
  if (!offer) return { title: "Not found" };
  const cover = offerCover(offer);
  return {
    title: `${offer.title} (free)`,
    description: offer.tagline ?? offer.description ?? undefined,
    alternates: { canonical: `/free/${offer.slug}` },
    openGraph: { title: `Free: ${offer.title}`, description: offer.tagline ?? undefined, images: cover ? [{ url: cover }] : undefined },
    twitter: { card: "summary_large_image", title: `Free: ${offer.title}`, description: offer.tagline ?? undefined },
  };
}

/**
 * A free offer's landing page: what it is, what's inside, one email field.
 * Built to be linked from a social post, so nothing competes with the form.
 */
export default async function FreeOfferPage({ params }: Props) {
  const [offer, viewer] = await Promise.all([getOffer((await params).slug), getCurrentProfile()]);
  if (!offer) notFound();
  // Signed in: no email to ask for, just the file.
  const box = viewer ? (
    <div className="flex flex-col gap-2.5">
      <a
        href={`/free/${offer.slug}/download`}
        className="inline-flex w-full items-center justify-center gap-2 rounded bg-gold px-5 py-3.5 text-[15px] font-bold text-on-accent hover:opacity-85"
      >
        <Download className="size-4" aria-hidden />
        Download {offer.title} (PDF)
      </a>
      <p className="text-[12px] text-muted">You&apos;re signed in, so it&apos;s yours straight away.</p>
    </div>
  ) : null;
  const cover = offerCover(offer);
  const inside = lines(offer.includes);

  return (
    <Shell>
      <div className="mx-auto grid w-full max-w-[1100px] items-start gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Free download</p>
          <h1 className="font-serif text-[clamp(30px,5vw,48px)] leading-[1.08] font-black tracking-[-0.6px]">{offer.title}</h1>
          {offer.tagline && <p className="mt-3 text-[17px] leading-relaxed text-muted">{offer.tagline}</p>}

          {/* On phones the form comes straight after the pitch, before the details. */}
          <div className="mt-6 rounded-lg border border-gold/40 bg-gold-dim p-5 lg:hidden">
            {box ?? <OfferForm slug={offer.slug} title={offer.title} id="offer-email-m" />}
          </div>

          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`Preview of ${offer.title}`}
              className="mt-8 w-full rounded-lg border border-border object-cover shadow-sm"
            />
          )}

          {offer.description && <p className="mt-8 text-[15px] leading-relaxed">{offer.description}</p>}

          {inside.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 font-serif text-xl font-black">What&apos;s inside</h2>
              <ul className="flex flex-col gap-2.5">
                {inside.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px]">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-dim text-teal" aria-hidden>
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="rounded-lg border border-gold/40 bg-gold-dim p-6">
            <p className="mb-4 font-serif text-xl font-black">Get it free</p>
            {box ?? <OfferForm slug={offer.slug} title={offer.title} />}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
