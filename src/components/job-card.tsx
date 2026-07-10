import type { HomeData } from "@/lib/queries";

type Job = HomeData["jobs"][number];

export function JobCard({ job }: { job: Job }) {
  return (
    <a
      href={job.apply_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2.5 rounded-md border border-border bg-bg2 p-5 transition-all hover:-translate-y-0.5 hover:border-gold/30"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md font-mono text-sm font-extrabold"
          style={{
            backgroundColor: `${job.brand_color ?? "#6B7280"}1F`,
            color: job.brand_color ?? "#6B7280",
          }}
        >
          {job.company[0]}
        </span>
        <div>
          <p className="text-[13px] font-semibold">{job.company}</p>
          <p className="text-[11px] text-muted">
            {job.location}
            {job.is_remote && " · Remote"}
          </p>
        </div>
      </div>
      <p className="font-serif text-base leading-[1.3] font-bold">{job.title}</p>
      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((t) => (
            <span
              key={t}
              className="rounded-[3px] border border-border bg-surface-1 px-2 py-0.5 font-mono text-[10px] text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {job.salary_range && (
        <p className="mt-auto text-xs text-muted">{job.salary_range}</p>
      )}
    </a>
  );
}
