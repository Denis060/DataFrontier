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
}: {
  recipients: number;
  delivered: number;
  opened: number;
  bounced: number;
  complained: number;
}) {
  const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "—");

  const tiles = [
    { label: "Recipients", value: recipients, sub: "queued to send" },
    { label: "Delivered", value: delivered, sub: `${pct(delivered, recipients)} of recipients` },
    { label: "Opened", value: opened, sub: `${pct(opened, delivered)} of delivered`, accent: "teal" as const },
    { label: "Bounced", value: bounced, sub: `${pct(bounced, recipients)} of recipients`, accent: bounced > 0 ? ("red" as const) : undefined },
    { label: "Complained", value: complained, sub: `${pct(complained, delivered)} of delivered`, accent: complained > 0 ? ("red" as const) : undefined },
  ];

  return (
    <section className="mb-6 rounded-md border border-border bg-bg2 p-5">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">Delivery stats</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
      <p className="mt-4 text-[11px] text-muted">
        Counts come from Resend delivery webhooks; opens are unique openers. Hard bounces and
        complaints are auto-added to the suppression list.
      </p>
    </section>
  );
}
