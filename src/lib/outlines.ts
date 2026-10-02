/**
 * Starting outlines for a new piece, one per kind of article, following the
 * writer's guide (opening, findings, for practitioners, what would make me
 * wrong, key takeaways, sources). Guidance is written as [Replace: ...] so the
 * house-style check flags anything left unfilled before it can be published.
 */

/** formats: preferred format names in order; the first that exists is picked. */
export type Outline = { key: string; label: string; formats: string[]; body: string };

const ENDING = `## What would make me wrong

[Replace: name the result, data or event that would overturn this piece. Be specific enough that a reader could check it later.]

## Key takeaways

- [Replace: the first thing a reader should remember]
- [Replace: the second]
- [Replace: the third]

## Sources

- [Replace: Author, "Title", where it was published, link]
`;

export const OUTLINES: Outline[] = [
  {
    key: "tutorial",
    label: "Tutorial",
    formats: ["Tutorial"],
    body: `[Replace: open with the problem in one or two lines, and what the reader will have built by the end.]

## What you'll need

- [Replace: versions, libraries, data]

## Step 1: [Replace: what this step does]

[Replace: explain, then show the code.]

\`\`\`python
# [Replace: code that runs as written]
\`\`\`

## Step 2: [Replace: what this step does]

[Replace: explain, then show the code and the real output.]

## Where it breaks

[Replace: the limits you hit, and what you'd do differently.]

${ENDING}`,
  },
  {
    key: "analysis",
    label: "Analysis",
    formats: ["Analysis", "Deep Dive", "Opinion"],
    body: `[Replace: open with the claim or number you're testing, and why it matters now.]

## What the evidence shows

[Replace: the strongest evidence, with exact figures and a link for each.]

## What it doesn't show

[Replace: the limits of the evidence, and where the common reading goes too far.]

## For practitioners

[Replace: what a reader should actually do differently on Monday.]

${ENDING}`,
  },
  {
    key: "research",
    label: "Research brief",
    formats: ["Research Brief", "arXiv Breakdown", "Research"],
    body: `[Replace: open with the paper's headline result in one sentence, with the authors and arXiv ID or DOI.]

## What they did

[Replace: the setup in plain words: data, method, comparison.]

## What they found

[Replace: the results with exact figures from the paper.]

## What it doesn't show

[Replace: limits, missing baselines, whether it's a preprint, what hasn't been replicated.]

## For practitioners

[Replace: what changes for someone building with this today.]

${ENDING}`,
  },
  {
    key: "benchmark",
    label: "Benchmark",
    formats: ["Benchmark Watch", "Benchmark"],
    body: `[Replace: open with the result in one line: what won, by how much, on what.]

## Setup

[Replace: hardware, versions, data size, and how to reproduce it.]

## Results

| [Replace: option] | [Replace: metric] |
| --- | --- |
| [Replace] | [Replace] |

## What the numbers hide

[Replace: caveats, variance, and the cases where the ranking flips.]

${ENDING}`,
  },
  {
    key: "explainer",
    label: "Explainer",
    formats: ["Explainer"],
    body: `[Replace: open with the one idea this piece explains, in a sentence a newcomer understands.]

## The idea

[Replace: explain it plainly, with one concrete example.]

## Where you've already met it

[Replace: the tools or products that use it.]

## Common misunderstandings

[Replace: what people get wrong, and the correct version.]

${ENDING}`,
  },
];
