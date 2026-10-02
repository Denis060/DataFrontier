/**
 * Starting outlines for a new piece, one per kind of article, following the
 * writer's guide (opening, findings, for practitioners, what would make me
 * wrong, key takeaways, sources). Guidance is written as [Write here: ...] so the
 * house-style check flags anything left unfilled before it can be published.
 */

/** formats: preferred format names in order; the first that exists is picked. */
export type Outline = { key: string; label: string; formats: string[]; body: string };

const ENDING = `## What would make me wrong

[Write here: name the result, data or event that would overturn this piece. Be specific enough that a reader could check it later.]

## Key takeaways

- [Write here: the first thing a reader should remember]
- [Write here: the second]
- [Write here: the third]

## Sources

- [Write here: Author, "Title", where it was published, link]
`;

export const OUTLINES: Outline[] = [
  {
    key: "tutorial",
    label: "Tutorial",
    formats: ["Tutorial"],
    body: `[Write here: open with the problem in one or two lines, and what the reader will have built by the end.]

## What you'll need

- [Write here: versions, libraries, data]

## Step 1: [Write here: what this step does]

[Write here: explain, then show the code.]

\`\`\`python
# [Write here: code that runs as written]
\`\`\`

## Step 2: [Write here: what this step does]

[Write here: explain, then show the code and the real output.]

## Where it breaks

[Write here: the limits you hit, and what you'd do differently.]

${ENDING}`,
  },
  {
    key: "analysis",
    label: "Analysis",
    formats: ["Analysis", "Deep Dive", "Opinion"],
    body: `[Write here: open with the claim or number you're testing, and why it matters now.]

## What the evidence shows

[Write here: the strongest evidence, with exact figures and a link for each.]

## What it doesn't show

[Write here: the limits of the evidence, and where the common reading goes too far.]

## For practitioners

[Write here: what a reader should actually do differently on Monday.]

${ENDING}`,
  },
  {
    key: "research",
    label: "Research brief",
    formats: ["Research Brief", "arXiv Breakdown", "Research"],
    body: `[Write here: open with the paper's headline result in one sentence, with the authors and arXiv ID or DOI.]

## What they did

[Write here: the setup in plain words: data, method, comparison.]

## What they found

[Write here: the results with exact figures from the paper.]

## What it doesn't show

[Write here: limits, missing baselines, whether it's a preprint, what hasn't been replicated.]

## For practitioners

[Write here: what changes for someone building with this today.]

${ENDING}`,
  },
  {
    key: "benchmark",
    label: "Benchmark",
    formats: ["Benchmark Watch", "Benchmark"],
    body: `[Write here: open with the result in one line: what won, by how much, on what.]

## Setup

[Write here: hardware, versions, data size, and how to reproduce it.]

## Results

| [Write here: option] | [Write here: metric] |
| --- | --- |
| [Write here] | [Write here] |

## What the numbers hide

[Write here: caveats, variance, and the cases where the ranking flips.]

${ENDING}`,
  },
  {
    key: "explainer",
    label: "Explainer",
    formats: ["Explainer"],
    body: `[Write here: open with the one idea this piece explains, in a sentence a newcomer understands.]

## The idea

[Write here: explain it plainly, with one concrete example.]

## Where you've already met it

[Write here: the tools or products that use it.]

## Common misunderstandings

[Write here: what people get wrong, and the correct version.]

${ENDING}`,
  },
];
