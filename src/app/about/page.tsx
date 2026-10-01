import type { Metadata } from "next";
import Link from "next/link";
import { CodeXml, Earth, FileSearch, PencilLine, Scale } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { AuthorAvatar } from "@/components/author-avatar";
import { createClient } from "@/lib/supabase/server";
import { getWriters } from "@/lib/queries";

export const metadata: Metadata = {
  title: "About",
  description:
    "Everyday Data Science publishes practical AI, ML and data science from people who build it, with sources you can check and a habit of saying what would prove us wrong.",
  alternates: { canonical: "/about" },
};

export const revalidate = 300;

// Phrased to hold across the archive (most pieces link sources and say what
// would prove them wrong; tutorials ship runnable code), matching the
// homepage promise strip.
const STANDARDS = [
  {
    icon: FileSearch,
    title: "Sources you can check",
    body: "Claims link to the paper, dataset, benchmark or filing behind them, so you can read the evidence yourself.",
  },
  {
    icon: Scale,
    title: "We say what would prove us wrong",
    body: "Most pieces end by naming the result that would overturn them. A conclusion you cannot test is an opinion.",
  },
  {
    icon: CodeXml,
    title: "Code you can run",
    body: "Tutorials ship working code and real outputs, not pseudo-code that only works in the screenshot.",
  },
  {
    icon: Earth,
    title: "AI in Africa, taken seriously",
    body: "We cover what is being built across the continent with the same rigour as everything else, not as a side note.",
  },
  {
    icon: PencilLine,
    title: "When we're wrong, we say so",
    body: "If a piece gets something wrong, we fix it in the article and note what changed, rather than quietly editing it away.",
  },
];

export default async function AboutPage() {
  const db = await createClient();
  const [writers, { data: settings }] = await Promise.all([
    getWriters(),
    db.from("site_settings").select("tagline, editor_profile_id, contact_email").eq("id", true).maybeSingle(),
  ]);
  const editor = writers.find((w) => w.id === settings?.editor_profile_id) ?? null;
  // A sample, not the roster: the 8 most recently published writers, so the
  // section stays short and current as the list grows. /authors has everyone.
  const recent = [...writers].sort((a, b) => (b.latest ?? "").localeCompare(a.latest ?? "")).slice(0, 8);

  return (
    <Shell>
      <header className="border-b border-border bg-bg2 px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto w-full max-w-[860px]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-gold">About</p>
          <h1 className="font-serif text-[clamp(32px,5.5vw,56px)] leading-[1.05] font-black tracking-[-0.8px]">
            {settings?.tagline ?? "Practical AI, ML & data science for people who build."}
          </h1>
          <p className="mt-5 max-w-[680px] text-[17px] leading-relaxed text-muted">
            Everyday Data Science is an independent publication written by practitioners: people who
            ship models, maintain pipelines and run the experiment before they write about it. We
            cover applied AI, agentic systems, machine learning and data work, with a steady focus
            on what is being built in Africa.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-8 lg:px-12">
        <section>
          <h2 className="mb-2 font-serif text-[28px] font-black tracking-[-0.4px]">What we stand for</h2>
          <p className="mb-7 max-w-[640px] text-[15px] leading-relaxed text-muted">
            The standards every piece is edited against, whoever writes it.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STANDARDS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-border bg-bg2 p-5">
                <Icon className="mb-3 size-5 text-gold" aria-hidden />
                <p className="font-semibold">{title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {writers.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-[28px] font-black tracking-[-0.4px]">Who writes here</h2>
                <p className="mt-1 text-[15px] text-muted">
                  Data scientists, engineers and researchers writing about what they build.
                </p>
              </div>
              <Link href="/authors" className="text-[13px] font-semibold text-gold hover:underline">
                Meet all our writers →
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {recent.map((w) => (
                <Link
                  key={w.id}
                  href={`/author/${w.slug}`}
                  className="flex items-center gap-3 rounded-full border border-border bg-bg2 py-1.5 pr-5 pl-1.5 transition-colors hover:border-gold/40"
                >
                  <AuthorAvatar name={w.full_name} src={w.avatar_url} className="size-10 text-sm" />
                  <span>
                    <span className="block text-[14px] font-semibold">{w.full_name}</span>
                    <span className="block text-[11px] text-muted">
                      {w.articles} {w.articles === 1 ? "article" : "articles"}
                    </span>
                  </span>
                </Link>
              ))}
              <Link
                href="/write"
                className="flex items-center gap-2 rounded-full border border-dashed border-gold/50 px-5 py-3 text-[14px] font-semibold text-gold transition-colors hover:bg-gold-dim"
              >
                + Your name here
              </Link>
            </div>
          </section>
        )}

        {editor && (
          <section className="mt-16 grid gap-6 rounded-lg border border-gold/20 bg-linear-160 from-editor-from to-editor-to p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
            <AuthorAvatar name={editor.full_name} src={editor.avatar_url} className="size-20 text-2xl" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">Founding editor</p>
              <p className="mt-1 font-serif text-[22px] font-black">{editor.full_name}</p>
              {editor.title && <p className="text-[13px] text-muted">{editor.title}</p>}
              {editor.bio && <p className="mt-3 text-[14px] leading-relaxed text-muted">{editor.bio}</p>}
              <Link href={`/author/${editor.slug}`} className="mt-3 inline-block text-[13px] font-semibold text-gold hover:underline">
                Read {editor.full_name.split(" ")[0]}&apos;s work →
              </Link>
            </div>
          </section>
        )}

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          <Link href="/write" className="rounded-lg border border-border bg-bg2 p-5 transition-colors hover:border-gold/40">
            <p className="font-semibold">Write for us</p>
            <p className="mt-1 text-[13px] text-muted">Pitch an idea or republish a post from your own blog.</p>
          </Link>
          <Link href="/newsletter" className="rounded-lg border border-border bg-bg2 p-5 transition-colors hover:border-gold/40">
            <p className="font-semibold">Get the newsletter</p>
            <p className="mt-1 text-[13px] text-muted">One email a week with the pieces worth your time.</p>
          </Link>
          <Link href="/contact" className="rounded-lg border border-border bg-bg2 p-5 transition-colors hover:border-gold/40">
            <p className="font-semibold">Get in touch</p>
            <p className="mt-1 text-[13px] text-muted">
              {settings?.contact_email ? settings.contact_email : "Questions, corrections or partnerships."}
            </p>
          </Link>
        </section>
      </div>
    </Shell>
  );
}
