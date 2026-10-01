import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Writer's guide",
  description:
    "How to write for Everyday Data Science: what a strong piece looks like, the formats we publish, how we handle sources, and a sample pitch.",
  alternates: { canonical: "/write/guide" },
};

// Draft for the editor's review. Figures describe the published archive as of
// October 2026 (57 pieces): typical length 6 to 12 minutes; about two thirds
// end with a "what would make me wrong" section and key takeaways.
export default function WriterGuidePage() {
  return (
    <InfoPage
      eyebrow="Write for us"
      title="Writer's guide"
      intro="Everything you need to write a piece we'd be glad to publish. Read it before you pitch; it will save you a round of edits."
    >
      <h2>What we&apos;re looking for</h2>
      <p>
        Pieces written by someone who did the work. You built the pipeline, ran the benchmark, read
        the paper closely, or watched the project fail in production. Readers come here for that
        first-hand view, not a summary of what everyone else already said.
      </p>
      <p>A strong piece does three things:</p>
      <ul>
        <li>
          <strong>Makes one clear claim.</strong>{" "}
          &ldquo;DuckDB won every query, and the timings were
          the least interesting part&rdquo; beats &ldquo;A comparison of dataframe libraries.&rdquo;
        </li>
        <li>
          <strong>Shows the evidence.</strong> Numbers, code, outputs and links a reader can check.
        </li>
        <li>
          <strong>Says what would change its mind.</strong> Name the result that would prove you
          wrong.
        </li>
      </ul>

      <h2>Formats we publish</h2>
      <ul>
        <li>
          <strong>Tutorial:</strong> build something step by step, with code that runs as written.
        </li>
        <li>
          <strong>Analysis:</strong> take a claim, a trend or a number and test it.
        </li>
        <li>
          <strong>Research brief / arXiv breakdown:</strong> explain a new paper: what it found,
          what it didn&apos;t, and what practitioners should do about it.
        </li>
        <li>
          <strong>Benchmark watch:</strong> your own measurements, with the setup to reproduce them.
        </li>
        <li>
          <strong>Explainer:</strong> one idea, explained so a smart newcomer gets it.
        </li>
        <li>
          <strong>Deep dive, policy brief, careers:</strong> longer or more specialised pieces;
          pitch these first so we can shape them together.
        </li>
      </ul>

      <h2>How a piece is put together</h2>
      <p>Most of our pieces follow a shape like this. Treat it as a starting point, not a form:</p>
      <ol>
        <li>
          <strong>The opening:</strong> a concrete situation or number, and why it matters, in the
          first few lines.
        </li>
        <li>
          <strong>The findings:</strong> the substance, in sections with clear headings. Headings
          become the contents list readers use to jump around.
        </li>
        <li>
          <strong>For practitioners:</strong> what to actually do differently on Monday.
        </li>
        <li>
          <strong>What would make me wrong:</strong> the results or conditions that would overturn
          your conclusion.
        </li>
        <li>
          <strong>Key takeaways and sources:</strong> a short summary, then every source you relied
          on.
        </li>
      </ol>
      <p>
        Length follows the material. Most published pieces take 6 to 12 minutes to read. Cut
        anything a reader could skip without losing the argument.
      </p>

      <h2>Sources and numbers</h2>
      <ul>
        <li>
          Link every claim that isn&apos;t yours to the paper, dataset, benchmark or filing behind
          it. For papers, give the authors, title and arXiv ID or DOI.
        </li>
        <li>
          Use exact figures from the source and say where they come from. Don&apos;t round a
          62.7% into &ldquo;nearly two thirds&rdquo; without the original nearby.
        </li>
        <li>If a number is your own measurement, say how you measured it.</li>
      </ul>

      <h2>Code and images</h2>
      <ul>
        <li>
          Code should run as written. Readers can copy any code block with one click, so test it
          before you send it.
        </li>
        <li>
          Add a cover image (16:9 works best) and describe charts in the text, so the point lands
          even without the picture.
        </li>
      </ul>

      <h2>House style</h2>
      <ul>
        <li>Plain words over jargon. Explain a term the first time you use it.</li>
        <li>No hype: avoid &ldquo;revolutionary&rdquo;, &ldquo;game-changing&rdquo; and their cousins.</li>
        <li>
          We don&apos;t use em-dashes. Use a full stop, a comma, a colon or brackets instead.
        </li>
        <li>
          AI tools are fine for research and checking, but the thinking and the writing must be
          yours. We don&apos;t publish AI-generated filler.
        </li>
      </ul>

      <h2>Republishing your own post</h2>
      <p>
        Already published it on your blog or Medium? Pick &ldquo;Republish my post&rdquo; when you
        pitch. We add a link that tells search engines your original came first, so it keeps its
        ranking, and readers see where it first appeared.
      </p>

      <h2>A sample pitch</h2>
      <blockquote>
        <p>
          <strong>Idea:</strong> I re-ran our support-ticket RAG evaluation with three retrievers
          after a model upgrade. Retrieval quality, not the model, explained most of the difference
          in answers.
        </p>
        <p>
          <strong>About me:</strong> ML engineer at a fintech in Lagos; I own our support assistant
          and its evaluation suite.
        </p>
        <p>
          <strong>Why it matters:</strong> teams blame the model when the retriever is the
          bottleneck. I can share the harness and anonymised results.
        </p>
      </blockquote>
      <p>Three short paragraphs like that are plenty.</p>

      <h2>What happens after you pitch</h2>
      <p>
        You get a confirmation email straight away. If it&apos;s a fit, you get an author account
        and an email with next steps. You write in our editor, send it for review when it&apos;s
        ready, and an editor reads and checks it before it goes live under your name.
      </p>
      <p>
        <Link href="/write#apply">Pitch an idea or republish a post →</Link>
      </p>
    </InfoPage>
  );
}
