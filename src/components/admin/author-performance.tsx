import Link from "next/link";
import { Eye, Heart, MessageSquare, FileText } from "lucide-react";
import type { AuthorInsights } from "@/lib/queries";

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n));

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg2 p-5">
      <div className="mb-2 flex items-center gap-2 text-muted">
        <Icon className="size-4" aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-[1px]">{label}</span>
      </div>
      <p className="font-serif text-3xl font-black text-ink">{value}</p>
    </div>
  );
}

export function AuthorPerformance({ data }: { data: AuthorInsights }) {
  return (
    <div className="mt-10">
      <h2 className="mb-1 font-serif text-xl font-black tracking-[-0.5px]">Your articles</h2>
      <p className="mb-4 text-[13px] text-muted">How your published work is doing.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Eye} label="Total views" value={compact(data.totalViews)} />
        <Stat icon={Heart} label="Reactions" value={compact(data.totalReactions)} />
        <Stat icon={MessageSquare} label="Comments" value={compact(data.totalComments)} />
        <Stat icon={FileText} label="Published" value={compact(data.publishedCount)} />
      </div>

      <section className="mt-4 rounded-md border border-border bg-bg2 p-5">
        <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[2px] text-gold">Your top articles</h3>
        {data.topArticles.length === 0 ? (
          <p className="text-[13px] text-muted">Nothing published yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {data.topArticles.map((a, i) => (
              <li key={a.slug} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-right font-mono text-[11px] text-muted">{i + 1}</span>
                <Link href={`/article/${a.slug}`} className="min-w-0 flex-1 truncate text-[13px] hover:text-gold">
                  {a.title}
                </Link>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[12px] text-muted">
                  <Eye className="size-3" aria-hidden /> {compact(a.views)}
                </span>
                {a.reactions > 0 && (
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[12px] text-gold">
                    <Heart className="size-3 fill-current" aria-hidden /> {a.reactions}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
