import type { Metadata } from "next";
import { Shell } from "@/components/layout/shell";
import { JobCard } from "@/components/job-card";
import { getJobs } from "@/lib/queries";

export const metadata: Metadata = {
  title: "AI & Data Science Jobs — Everyday Data Science",
  description: "Curated roles in AI and data science, screened for quality.",
};

export const revalidate = 300;

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <Shell>
      <header className="border-b border-border px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-1px]">
            Data &amp; AI Careers
          </h1>
          <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-muted">
            Curated roles in AI and data science — screened for quality, not volume.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[2px] text-muted">
            {jobs.length} open {jobs.length === 1 ? "role" : "roles"}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-8 lg:px-12">
        {jobs.length === 0 ? (
          <p className="rounded border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            No open roles right now. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
