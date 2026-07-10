const STYLES: Record<string, string> = {
  draft: "bg-surface-2 text-muted",
  in_review: "bg-gold-dim text-gold",
  changes_requested: "bg-red-dim text-red",
  published: "bg-teal-dim text-teal",
  archived: "bg-surface-1 text-muted line-through",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-[3px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] ${STYLES[status] ?? STYLES.draft}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
