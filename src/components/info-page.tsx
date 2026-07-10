import { Shell } from "@/components/layout/shell";

/** Shared shell for simple prose pages (legal, contact, advertise). */
export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <Shell>
      <div className="mx-auto w-full max-w-[720px] px-5 py-12 sm:px-8 lg:py-16">
        {eyebrow && (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">{eyebrow}</p>
        )}
        <h1 className="font-serif text-[clamp(28px,5vw,42px)] leading-[1.1] font-black tracking-[-1px]">
          {title}
        </h1>
        {intro && <p className="mt-4 text-[15px] leading-relaxed text-muted">{intro}</p>}
        <div className="article-prose mt-8">{children}</div>
      </div>
    </Shell>
  );
}
