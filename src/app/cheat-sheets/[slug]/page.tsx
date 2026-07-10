import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Pill } from "@/components/pill";
import { ShareBar } from "@/components/article/share-bar";
import { getCheatSheet } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://datafrontier.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sheet = await getCheatSheet(slug);
  if (!sheet) return { title: "Not found" };
  return {
    title: `${sheet.title} — Cheat Sheet`,
    description: sheet.description ?? undefined,
    openGraph: { images: sheet.image_url ? [sheet.image_url] : undefined },
  };
}

/** Supabase public URLs force a download with `?download=<name>`. */
function downloadUrl(url: string, slug: string) {
  if (!url.includes("/storage/v1/object/public/")) return url;
  const ext = url.split(".").pop()?.split("?")[0] ?? "png";
  return `${url}${url.includes("?") ? "&" : "?"}download=${slug}.${ext}`;
}

export default async function CheatSheetPage({ params }: Props) {
  const { slug } = await params;
  const sheet = await getCheatSheet(slug);
  if (!sheet) notFound();

  const fileUrl = sheet.download_url ?? sheet.image_url;
  const shareUrl = `${SITE}/cheat-sheets/${sheet.slug}`;

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8 lg:py-14">
        <Link href="/cheat-sheets" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ArrowLeft className="size-3.5" /> All cheat sheets
        </Link>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          {sheet.category && (
            <Link href={`/category/${sheet.category.slug}`}>
              <Pill color={sheet.category.color}>{sheet.category.name}</Pill>
            </Link>
          )}
        </div>

        <h1 className="font-serif text-[clamp(28px,5vw,42px)] leading-[1.1] font-black tracking-[-1px]">
          {sheet.title}
        </h1>
        {sheet.description && (
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-muted">{sheet.description}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={downloadUrl(fileUrl, sheet.slug)}
            className="inline-flex items-center gap-2 rounded bg-gold px-5 py-2.5 text-[13px] font-bold text-on-accent transition-opacity hover:opacity-85"
          >
            <Download className="size-4" aria-hidden />
            Download
          </a>
          <ShareBar url={shareUrl} title={sheet.title} />
        </div>

        {/* The infographic itself, full width. Height is intrinsic. */}
        <div className="mt-8 overflow-hidden rounded-lg border border-border bg-bg2">
          <Image
            src={sheet.image_url}
            alt={sheet.title}
            width={1600}
            height={2000}
            unoptimized
            className="h-auto w-full"
            sizes="(max-width: 900px) 100vw, 900px"
          />
        </div>

        {sheet.author && (
          <p className="mt-4 text-[12px] text-muted">
            By{" "}
            {sheet.author.slug ? (
              <Link href={`/author/${sheet.author.slug}`} className="text-gold hover:underline">
                {sheet.author.full_name}
              </Link>
            ) : (
              sheet.author.full_name
            )}
          </p>
        )}
      </div>
    </Shell>
  );
}
