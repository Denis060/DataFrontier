/**
 * Per-issue delivery stats, sourced from Resend webhooks (see
 * /api/webhooks/resend). Rendered on a sending/sent issue so you can watch a
 * send land in real time (the page revalidates on navigation).
 */
export function IssueStats({
  recipients,
  delivered,
  opened,
  bounced,
  complained,
  clicked = null,
  topLinks = [],
}: {
  recipients: number;
  delivered: number;
  opened: number;
  bounced: number;
  complained: number;
  /** null until click tracking is set up (migration + Resend setting). */
  clicked?: number | null;
  topLinks?: { link: string; clicks: number }[];
}) {
  const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "-");

  const tiles = [
    { label: "Recipients", value: recipients, sub: "queued to send" },
    { label: "Delivered", value: delivered, sub: `${pct(delivered, recipients)} of recipients` },
    { label: "Opened", value: opened, sub: `${pct(opened, delivered)} of delivered`, accent: "teal" as const },
    ...(clicked != null ? [{ label: "Clicked", value: clicked, sub: `${pct(clicked, delivered)} of delivered`, accent: "teal" as const }] : []),
    { label: "Bounced", value: bounced, sub: `${pct(bounced, recipients)} of recipients`, accent: bounced > 0 ? ("red" as const) : undefined },
    { label: "Complained", value: complained, sub: `${pct(complained, delivered)} of delivered`, accent: complained > 0 ? ("red" as const) : undefined },
  ];

  return (
    <section className="mb-6 rounded-md border border-border bg-bg2 p-5">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">Delivery stats</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label}>
            <p
              className={`font-serif text-[26px] leading-none font-black ${
                t.accent === "red" ? "text-red" : t.accent === "teal" ? "text-teal" : "text-ink"
              }`}
            >
              {t.value}
            </p>
            <p className="mt-1 text-[12px] font-semibold">{t.label}</p>
            <p className="mt-0.5 text-[11px] text-muted">{t.sub}</p>
          </div>
        ))}
      </div>
      {topLinks.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">Most clicked links</p>
          <ol className="flex flex-col gap-1.5">
            {topLinks.map((l) => (
              <li key={l.link} className="flex items-center gap-3 text-[13px]">
                <span className="w-10 shrink-0 font-mono text-[12px] text-gold">{l.clicks}×</span>
                <a href={l.link} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate hover:text-gold">
                  {l.link.replace(/^https?:\/\//, "")}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="mt-4 text-[11px] text-muted">
        Counts come from Resend delivery webhooks; opens and clicks are unique people. Opens and
        clicks need tracking switched on for the sending domain in Resend. Hard bounces and
        complaints are auto-added to the suppression list.
      </p>
    </section>
  );
}
