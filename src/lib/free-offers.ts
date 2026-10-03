/**
 * Free offers (lead magnets) and the post-confirmation survey. Shared by the
 * landing page, the signup action, the confirm route and admin, so it holds
 * no secrets and no server-only imports.
 */

export type Offer = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  includes: string | null;
  cover_image: string | null;
  files: string | null;
};

export const OFFER_COLUMNS = "id, slug, title, tagline, description, includes, cover_image, files";

/** Non-empty trimmed lines of a multi-line admin field. */
export const lines = (s: string | null | undefined) =>
  (s ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/** The links merged into the download, in order. Only http(s) links count. */
export const offerFiles = (o: Pick<Offer, "files">) => lines(o.files).filter((l) => /^https?:\/\//i.test(l));

/** A cover to show: the set image, else the first image file in the pack. */
export function offerCover(o: Pick<Offer, "cover_image" | "files">): string | null {
  return o.cover_image || offerFiles(o).find((u) => /\.(png|jpe?g|webp)(\?|$)/i.test(u)) || null;
}

/** subscribers.source for signups that came through an offer. */
export const offerSource = (slug: string) => `free:${slug}`;

/** The download link, unlocked by the subscriber's confirm token. */
export const offerDownloadPath = (slug: string, token: string) => `/free/${slug}/download?t=${encodeURIComponent(token)}`;

// ── Survey ──────────────────────────────────────────────────────────────────
// Three optional taps after confirming. Answers are stored as { key: value }
// on the subscriber; the labels here are what admin reports show.

export type SurveyQuestion = { key: string; question: string; options: { value: string; label: string }[] };

export const SURVEY: SurveyQuestion[] = [
  {
    key: "role",
    question: "What best describes you?",
    options: [
      { value: "student", label: "Student" },
      { value: "analyst", label: "Data analyst" },
      { value: "scientist", label: "Data scientist" },
      { value: "ml_engineer", label: "ML / AI engineer" },
      { value: "data_engineer", label: "Data engineer" },
      { value: "researcher", label: "Researcher" },
      { value: "manager", label: "Manager or lead" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    key: "field",
    question: "Which field do you work in?",
    options: [
      { value: "tech", label: "Tech" },
      { value: "finance", label: "Finance" },
      { value: "health", label: "Health" },
      { value: "government", label: "Government & policy" },
      { value: "education", label: "Education & research" },
      { value: "retail", label: "Retail & e-commerce" },
      { value: "ngo", label: "NGO / development" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "experience",
    question: "How long have you worked with data?",
    options: [
      { value: "learning", label: "Still learning" },
      { value: "0-2", label: "Under 2 years" },
      { value: "3-5", label: "3 to 5 years" },
      { value: "6+", label: "6+ years" },
    ],
  },
];

/** Keep only known keys and values, so the stored JSON stays clean. */
export function cleanSurvey(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of SURVEY) {
    const v = input[q.key];
    if (typeof v === "string" && q.options.some((o) => o.value === v)) out[q.key] = v;
  }
  return out;
}
