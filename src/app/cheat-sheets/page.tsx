import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { Pill } from "@/components/pill";
import { getCheatSheets } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Cheat Sheets",
  description: "Visual references for AI, ML, and data science, free to browse and download.",
};

export const revalidate = 300;

export default async function CheatSheetsPage() {
  const sheets = await getCheatSheets();

  return (
    <Shell>
      <header className="border-b border-border px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            Cheat Sheets
          </h1>
          <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-muted">
            Visual references you can actually use, the concepts that matter, distilled to a page.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
        {sheets.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No cheat sheets published yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map((s) => (
              <Link
                key={s.id}
                href={`/cheat-sheets/${s.slug}`}
                className="group overflow-hidden rounded-md border border-border bg-bg2 transition-colors hover:border-border-strong"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-bg3">
                  <Image
                    src={s.thumb_url ?? s.image_url}
                    alt={s.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  {s.category && (
                    <Pill color={s.category.color} className="mb-2">
                      {s.category.name}
                    </Pill>
                  )}
                  <p className="font-serif text-base leading-[1.3] font-bold group-hover:opacity-80">
                    {s.title}
                  </p>
                  {s.description && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
