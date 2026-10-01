import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { WriteForm } from "@/components/write-form";
import { Pill } from "@/components/pill";
import { getCurrentProfile } from "@/lib/auth";
import { getFormatExamples } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Write for Everyday Data Science",
  description:
    "Publish your work on AI, data science, and agentic systems, or republish a post from your own blog. Byline, author page, and real editing.",
};

const PERKS = [
  {
    title: "Your byline and author page",
    body: "Every piece carries your name and links to an author page with your ORCID, Google Scholar, GitHub, and LinkedIn, so it counts toward your public record.",
  },
  {
    title: "Real editing",
    body: "An editor reviews every piece before it goes live and works with you to make it sharper. You see the final version before it is published.",
  },
  {
    title: "Republish what you already wrote",
    body: "Have a post on your own blog or Medium? Bring it here. We link search engines back to your original, so it keeps its ranking.",
  },
  {
    title: "A place in the newsletter",
    body: "Strong pieces are featured in The Everyday Brief, our weekly email for people who build with AI and data.",
  },
];

const STEPS = [
  { title: "Tell us your idea", body: "Fill in the short form below. It takes a few minutes." },
  { title: "We read it and reply", body: "If it is a fit, you get an author account and an email with next steps." },
  { title: "Write in our editor", body: "Draft, preview, and send it for review when you are ready." },
  { title: "Edit and publish", body: "We polish it together, then it goes live under your name." },
];

export default async function WritePage() {
  const [profile, examples] = await Promise.all([getCurrentProfile(), getFormatExamples(3)]);

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[760px] px-5 py-12 sm:px-8 lg:py-16">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">Write for us</p>
        <h1 className="font-serif text-[clamp(30px,5vw,44px)] leading-[1.1] font-black tracking-[-0.5px]">
          Publish with Everyday Data Science
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted">
          We publish practitioners: people who build things, run the experiment, and can explain
          what they learned. If you have shipped a model, fought a data pipeline, or studied AI in a
          place most coverage ignores, we want to hear from you.
        </p>
        <a
          href="#apply"
          className="mt-6 inline-flex items-center gap-2 rounded bg-gold px-5 py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85"
        >
          Pitch or republish a piece →
        </a>

        <section className="mt-14">
          <h2 className="mb-5 font-serif text-2xl font-black tracking-[-0.4px]">What you get</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PERKS.map((p) => (
              <div key={p.title} className="rounded-md border border-border bg-bg2 p-5">
                <p className="mb-1.5 font-semibold">{p.title}</p>
                <p className="text-[13px] leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {examples.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-2 font-serif text-2xl font-black tracking-[-0.4px]">What we publish</h2>
            <p className="mb-5 text-[14px] leading-relaxed text-muted">
              Hands-on tutorials, honest benchmarks, clear explainers of new research, and AI in
              Africa. A few recent examples:
            </p>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
              {examples.map((a) => (
                <Link
                  key={a.id}
                  href={`/article/${a.slug}`}
                  className="block px-5 py-4 transition-colors hover:bg-bg2"
                >
                  {a.format && (
                    <Pill color={a.format.color} className="mb-1.5">
                      {a.format.name}
                    </Pill>
                  )}
                  <p className="font-serif text-[16px] leading-snug font-bold">{a.title}</p>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              We don&apos;t publish product promotions, press releases, or AI-generated filler. Show
              your work: code, data, numbers, and what went wrong.
            </p>
          </section>
        )}

        <section className="mt-14">
          <h2 className="mb-5 font-serif text-2xl font-black tracking-[-0.4px]">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/40 font-mono text-[12px] text-gold">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section id="apply" className="mt-14 scroll-mt-28 rounded-lg border border-border bg-bg2 p-5 sm:p-7">
          <h2 className="mb-1 font-serif text-2xl font-black tracking-[-0.4px]">Send your pitch</h2>
          <p className="mb-6 text-[13px] text-muted">A few lines is enough. We&apos;d rather see a clear idea than a polished essay.</p>
          <WriteForm signedIn={!!profile} isReader={profile?.role === "reader"} />
        </section>
      </div>
    </Shell>
  );
}
