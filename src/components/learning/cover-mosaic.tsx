// Tints for paths without covers, picked from the slug so each path keeps its own.
const TINTS = [
  { bg: "from-teal-dim via-bg2 to-teal-dim", dot: "border-teal text-teal", line: "bg-teal/40" },
  { bg: "from-gold-dim via-bg2 to-gold-dim", dot: "border-gold text-gold", line: "bg-gold/40" },
  { bg: "from-red-dim via-bg2 to-gold-dim", dot: "border-red text-red", line: "bg-red/40" },
];
const tintFor = (seed: string) => TINTS[[...seed].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % TINTS.length];

/**
 * A learning path's picture, made from its parts' cover images: one large and
 * two small when there are three or more, side by side for two, full for one.
 * With no covers yet, a tinted tile drawing the path as numbered steps.
 */
export function CoverMosaic({
  covers,
  title,
  seed = title,
  steps = 3,
  className = "",
}: {
  covers: string[];
  title: string;
  /** Picks the tint for the no-cover tile (use the path slug). */
  seed?: string;
  /** How many steps the no-cover tile draws (the path's lesson count); 0 draws none (tiny tiles). */
  steps?: number;
  className?: string;
}) {
  const c = covers.slice(0, 3);
  const img = (src: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={src} src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
  );

  if (c.length === 0) {
    const t = tintFor(seed || "path");
    const n = Math.min(steps, 5);
    if (n === 0) return <div className={`bg-gradient-to-br ${t.bg} ${className}`} aria-hidden />;
    return (
      <div className={`flex flex-col justify-center gap-3 bg-gradient-to-br ${t.bg} px-[8%] ${className}`} aria-hidden>
        <div className="flex items-center">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-bg font-mono text-[13px] leading-none font-bold ${t.dot}`}>
                {i + 1}
              </span>
              {i < n - 1 && <span className={`mx-1 h-0.5 flex-1 ${t.line}`} />}
            </div>
          ))}
        </div>
        {title && <span className="line-clamp-1 font-mono text-[10px] uppercase tracking-[2px] text-muted">{title}</span>}
      </div>
    );
  }
  if (c.length === 1) return <div className={`overflow-hidden ${className}`} aria-hidden>{img(c[0])}</div>;
  if (c.length === 2) {
    return (
      <div className={`grid grid-cols-2 gap-0.5 overflow-hidden ${className}`} aria-hidden>
        {img(c[0])}
        {img(c[1])}
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 overflow-hidden ${className}`} aria-hidden>
      <div className="row-span-2">{img(c[0])}</div>
      {img(c[1])}
      {img(c[2])}
    </div>
  );
}
