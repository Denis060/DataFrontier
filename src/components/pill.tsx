import type { Accent } from "@/lib/queries";

/**
 * Written out in full rather than interpolated (`text-${color}`) because
 * Tailwind scans source statically and would purge generated class names.
 */
const ACCENT: Record<Accent, string> = {
  gold: "bg-gold-dim text-gold",
  teal: "bg-teal-dim text-teal",
  red: "bg-red-dim text-red",
};

export function Pill({
  children,
  color = "gold",
  className = "",
}: {
  children: React.ReactNode;
  color?: Accent | string | null;
  className?: string;
}) {
  const accent = ACCENT[(color ?? "gold") as Accent] ?? ACCENT.gold;
  return (
    <span
      className={`inline-block rounded-[3px] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[2px] ${accent} ${className}`}
    >
      {children}
    </span>
  );
}
