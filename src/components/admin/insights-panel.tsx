import Link from "next/link";
import { Eye, Heart, Mail, MessageSquare, TrendingUp, Users } from "lucide-react";

export type Insights = {
  totalViews: number;
  publishedCount: number;
  confirmedSubs: number;
  newSubs30: number;
  avgOpenRate: number | null;
  topArticles: { slug: string; title: string; views: number; reactions: number; comments: number }[];
  sources: { source: string; count: number }[];
  recentIssues: { title: string; sentAt: string | null; recipients: number; openRate: number | null }[];
  growth: { label: string; count: number }[];
};

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-";

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Eye; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-bg2 p-5">
      <div className="mb-2 flex items-center gap-2 text-muted">
        <Icon className="size-4" aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-[1px]">{label}</span>
      </div>
      <p className="font-serif text-3xl font-black text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-bg2 p-5">
      <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[2px] text-gold">{title}</h3>
      {children}
    </section>
  );
}

function GrowthChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <Card title={`New subscribers · last ${data.length} weeks`}>
      {total === 0 ? (
        <p className="text-[13px] text-muted">No new confirmed subscribers yet, this fills in as your list grows.</p>
      ) : (
        <div className="flex h-28 items-end gap-1.5">
          {data.map((d, i) => (
            <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-mono text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {d.count}
              </span>
              <div
                className="w-full rounded-t bg-gold/70 transition-colors group-hover:bg-gold"
                style={{ height: `${Math.max(d.count > 0 ? 6 : 2, (d.count / max) * 100)}%` }}
                title={`${d.label}: ${d.count}`}
              />
              <span className="text-[9px] font-mono text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function InsightsPanel({ data }: { data: Insights }) {
  const maxSource = Math.max(1, ...data.sources.map((s) => s.count));

  return (
    <div className="mt-10">
      <h2 className="mb-4 font-serif text-xl font-black tracking-[-0.5px]">Insights</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Eye} label="Total views" value={compact(data.totalViews)} sub={`${data.publishedCount} published`} />
        <Stat icon={Users} label="Subscribers" value={compact(data.confirmedSubs)} sub="confirmed" />
        <Stat icon={TrendingUp} label="New (30 days)" value={compact(data.newSubs30)} sub="subscribers" />
        <Stat
          icon={Mail}
          label="Avg open rate"
          value={data.avgOpenRate != null ? `${data.avgOpenRate}%` : "-"}
          sub={data.avgOpenRate != null ? "across sent issues" : "no sends yet"}
        />
      </div>

      <div className="mt-4">
        <GrowthChart data={data.growth} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Top articles">
          {data.topArticles.length === 0 ? (
            <p className="text-[13px] text-muted">No published articles yet.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {data.topArticles.map((a, i) => (
                <li key={a.slug} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-right font-mono text-[11px] text-muted">{i + 1}</span>
                  <Link href={`/article/${a.slug}`} className="min-w-0 flex-1 truncate text-[13px] hover:text-gold">
                    {a.title}
                  </Link>
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted" title="views">
                    <Eye className="size-3" aria-hidden /> {compact(a.views)}
                  </span>
                  {a.reactions > 0 && (
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-gold" title="reactions">
                      <Heart className="size-3 fill-current" aria-hidden /> {a.reactions}
                    </span>
                  )}
                  {a.comments > 0 && (
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted" title="comments">
                      <MessageSquare className="size-3" aria-hidden /> {a.comments}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Where subscribers come from">
          {data.sources.length === 0 ? (
            <p className="text-[13px] text-muted">No confirmed subscribers yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.sources.map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="truncate text-muted">{s.source}</span>
                    <span className="font-mono">{s.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${(s.count / maxSource) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {data.recentIssues.length > 0 && (
        <div className="mt-4">
          <Card title="Recent issues">
            <ul className="flex flex-col gap-3">
              {data.recentIssues.map((it, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-[13px]">{it.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">{fmtDate(it.sentAt)}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">{compact(it.recipients)} sent</span>
                  <span className="w-14 shrink-0 text-right font-mono text-[12px] text-teal">
                    {it.openRate != null ? `${it.openRate}%` : "-"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
