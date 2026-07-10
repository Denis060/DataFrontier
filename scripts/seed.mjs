/**
 * Demo content for local development.
 *
 *   npm run db:seed
 *
 * Idempotent: every insert upserts on a unique key, so re-running updates
 * rather than duplicating. Uses the service-role key, which bypasses RLS —
 * this is a trusted admin script, never shipped to the browser.
 *
 * To remove everything it created: npm run db:seed -- --undo
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const undo = process.argv.includes("--undo");

const die = (label, error) => {
  if (error) {
    console.error(`✗ ${label}:`, error.message ?? error);
    process.exit(1);
  }
};

const AUTHORS = [
  {
    email: "ibrahim@thedatafrontier.com",
    full_name: "Ibrahim Denis Fofanah",
    slug: "ibrahim-fofanah",
    role: "admin",
    title: "Data Scientist & AI Researcher",
    bio: "Data scientist, AI researcher, and author. Writing about agentic systems and AI in Africa.",
    socials: { twitter: "", linkedin: "", github: "" },
  },
  {
    email: "guest@thedatafrontier.com",
    full_name: "Guest Contributor",
    slug: "guest-contributor",
    role: "author",
    title: "Community Contributor",
    bio: "Practitioner essays from the Data Frontier community.",
    socials: {},
  },
];

/** slug -> { article fields }. `author` and `format`/`category` are slugs, resolved below. */
const ARTICLES = [
  // ── Hero ──────────────────────────────────────────────────
  {
    slug: "agent-revolution-is-here",
    title: "The Agent Revolution Is Here — and Most Organizations Are Not Ready",
    excerpt:
      "As LLM-powered agents move from research demos to production infrastructure, the gap between early adopters and the rest is widening fast. Here's what the data actually shows.",
    category: "agentic-ai",
    format: "deep-dive",
    author: "ibrahim-fofanah",
    kicker: "Cover Story",
    reading_time: 14,
    featured: true,
    published_at: "2026-02-28T09:00:00Z",
  },

  // ── "Also in This Issue" sidebar ──────────────────────────
  {
    slug: "rwanda-sovereign-ai-cloud",
    title: "How Rwanda Is Building a Sovereign AI Cloud for the Continent",
    excerpt: "A national compute strategy aimed at keeping African data on African soil.",
    category: "ai-in-africa",
    format: "news",
    author: "ibrahim-fofanah",
    kicker: "Infrastructure",
    reading_time: 4,
    published_at: "2026-02-26T09:00:00Z",
  },
  {
    slug: "multi-agent-pipelines-langgraph",
    title: "Building Multi-Agent Pipelines with LangGraph: A Practical Guide",
    excerpt: "Wire up a supervisor, three workers, and durable state in under 200 lines.",
    category: "agentic-ai",
    format: "tutorial",
    author: "ibrahim-fofanah",
    kicker: "Code-Along",
    reading_time: 12,
    published_at: "2026-02-25T09:00:00Z",
  },
  {
    slug: "skills-gap-agentic-ai",
    title: "The Skills Gap in Agentic AI: What Employers Actually Want in 2026",
    excerpt: "We read 400 job postings so you don't have to. The patterns are not what you'd guess.",
    category: "careers",
    format: "careers",
    author: "guest-contributor",
    kicker: "Hiring Trends",
    reading_time: 6,
    published_at: "2026-02-24T09:00:00Z",
  },
  {
    slug: "rag-vs-fine-tuning-2026",
    title: "RAG vs. Fine-Tuning: A 2026 Decision Framework for Practitioners",
    excerpt: "Stop arguing. Here's a decision tree grounded in cost, latency, and drift.",
    category: "research",
    format: "research",
    author: "ibrahim-fofanah",
    kicker: "Deep Dive",
    reading_time: 8,
    published_at: "2026-02-23T09:00:00Z",
  },

  // ── Grid: Agentic AI ──────────────────────────────────────
  {
    slug: "three-pillars-production-agents",
    title: "Memory, Planning & Tool Use: The Three Pillars of Production Agents",
    excerpt:
      "Beyond the hype — what actually makes an agent capable in real-world deployments.",
    category: "agentic-ai",
    format: "deep-dive",
    author: "ibrahim-fofanah",
    reading_time: 10,
    published_at: "2026-02-22T09:00:00Z",
  },
  {
    slug: "langgraph-autogen-crewai",
    title: "LangGraph vs. AutoGen vs. CrewAI: Choosing Your Agentic Framework in 2026",
    excerpt: "A hands-on comparison with real benchmarks, not vendor marketing.",
    category: "agentic-ai",
    format: "tutorial",
    author: "guest-contributor",
    reading_time: 15,
    published_at: "2026-02-21T09:00:00Z",
  },
  {
    slug: "why-agentic-pocs-fail",
    title: "Why 73% of Agentic AI POCs Never Reach Production",
    excerpt: "The failure modes nobody talks about — and how to avoid them.",
    category: "agentic-ai",
    format: "analysis",
    author: "ibrahim-fofanah",
    reading_time: 7,
    published_at: "2026-02-20T09:00:00Z",
  },

  // ── Grid: ML & Data Science ───────────────────────────────
  {
    slug: "reasoning-models-explained",
    title: "Reasoning Models Explained: What Test-Time Compute Means for Applied ML",
    excerpt: "Chain-of-thought, test-time compute, and the new frontier of model intelligence.",
    category: "ml-data",
    format: "explainer",
    author: "ibrahim-fofanah",
    reading_time: 9,
    published_at: "2026-02-19T09:00:00Z",
  },
  {
    slug: "fine-tuning-llama-domain-data",
    title: "Fine-Tuning Llama on Domain-Specific Data: Complete Walkthrough",
    excerpt:
      "From dataset curation to LoRA training on a single A100. Reproducible code included.",
    category: "ml-data",
    format: "tutorial",
    author: "ibrahim-fofanah",
    reading_time: 18,
    published_at: "2026-02-18T09:00:00Z",
  },
  {
    slug: "data-scientist-role-splitting",
    title: 'The "Data Scientist" Role Is Splitting Into Three Jobs. Here\'s What to Do.',
    excerpt: "The generalist data scientist is becoming extinct. Understand your new path.",
    category: "ml-data",
    format: "opinion",
    author: "guest-contributor",
    reading_time: 5,
    published_at: "2026-02-17T09:00:00Z",
  },

  // ── Grid: Research Digest ─────────────────────────────────
  {
    slug: "must-read-alignment-papers",
    title: "This Week's Must-Read Papers in LLM Alignment & Safety",
    excerpt: "Plain-English summaries of the 5 papers shaping the next generation of AI.",
    category: "research",
    format: "arxiv-breakdown",
    author: "ibrahim-fofanah",
    reading_time: 6,
    published_at: "2026-02-16T09:00:00Z",
  },
  {
    slug: "interpretability-feature-circuits",
    title: "Mechanistic Interpretability: What Feature Circuits Tell Us About Safety",
    excerpt: "What the new interpretability research means for safe AI development.",
    category: "research",
    format: "new-release",
    author: "ibrahim-fofanah",
    reading_time: 4,
    published_at: "2026-02-15T09:00:00Z",
  },
  {
    slug: "state-of-coding-agents",
    title: "State of Coding Agents: Who Actually Wins on Real-World Tasks?",
    excerpt: "SWE-bench, LiveCodeBench, and the benchmark nobody's talking about yet.",
    category: "research",
    format: "benchmark-watch",
    author: "guest-contributor",
    reading_time: 8,
    published_at: "2026-02-14T09:00:00Z",
  },

  // ── Africa spotlight ──────────────────────────────────────
  {
    slug: "krio-first-ai",
    title: "Building Krio-First AI: The Case for Indigenous Language Models in West Africa",
    excerpt: "Low-resource does not mean low-value. A blueprint for language sovereignty.",
    category: "ai-in-africa",
    format: "deep-dive",
    author: "ibrahim-fofanah",
    kicker: "Sierra Leone",
    reading_time: 11,
    published_at: "2026-02-13T09:00:00Z",
  },
  {
    slug: "fraud-detection-agents-fintech",
    title: "How African Fintechs Are Using Fraud Detection Agents at Scale",
    excerpt: "Real-time risk scoring on mobile-money rails, and what it takes to run it.",
    category: "ai-in-africa",
    format: "guest-analysis",
    author: "guest-contributor",
    kicker: "Nigeria · Fintech",
    reading_time: 8,
    published_at: "2026-02-12T09:00:00Z",
  },
  {
    slug: "satellite-ml-smallholder-farmers",
    title: "Satellite ML for Smallholder Farmers: Crop Yield Prediction at Scale",
    excerpt: "Sentinel-2 imagery, gradient boosting, and a 30-metre resolution problem.",
    category: "ai-in-africa",
    format: "research-brief",
    author: "guest-contributor",
    kicker: "Kenya · Agriculture",
    reading_time: 6,
    published_at: "2026-02-11T09:00:00Z",
  },
  {
    slug: "african-union-ai-governance",
    title: "The African Union's AI Governance Framework: What Practitioners Need to Know",
    excerpt: "Continental policy is arriving faster than most engineering teams realise.",
    category: "ai-in-africa",
    format: "policy-brief",
    author: "ibrahim-fofanah",
    kicker: "Pan-Africa · Policy",
    reading_time: 5,
    published_at: "2026-02-10T09:00:00Z",
  },
];

const TICKER = [
  "Agentic workflows now power a third of surveyed enterprise automation",
  "Africa's AI startup ecosystem posts record funding year",
  "New benchmark results reshape the coding-agent leaderboard",
  "Nigeria launches national AI strategy with major investment plan",
  "Rwanda's sovereign AI cloud enters public beta",
  "The future of AI agents: from tools to teammates",
];

const JOBS = [
  {
    title: "Research Engineer — Agent Infrastructure",
    company: "Anthropic",
    location: "San Francisco",
    is_remote: true,
    salary_range: "$220K–280K",
    tags: ["Python", "LLMs", "Distributed Systems"],
    apply_url: "https://www.anthropic.com/careers",
    brand_color: "#00B4D8",
    posted_at: "2026-02-26T09:00:00Z",
  },
  {
    title: "Senior ML Engineer — Reasoning Systems",
    company: "Google DeepMind",
    location: "London · Hybrid",
    is_remote: false,
    salary_range: "£180K–240K",
    tags: ["JAX", "Reinforcement Learning", "TPUs"],
    apply_url: "https://deepmind.google/careers",
    brand_color: "#4285F4",
    posted_at: "2026-02-27T09:00:00Z",
  },
  {
    title: "Lead Data Scientist — Risk & Fraud",
    company: "Flutterwave",
    location: "Lagos · Remote OK",
    is_remote: true,
    salary_range: "$120K–160K",
    tags: ["XGBoost", "Real-time ML", "Kafka"],
    apply_url: "https://flutterwave.com/careers",
    brand_color: "#D4A853",
    posted_at: "2026-02-25T09:00:00Z",
  },
];

/**
 * PostgREST unifies the column set across a bulk insert: any key missing from
 * one row is sent as an explicit NULL rather than falling back to the column
 * default. So every row here must carry the same shape.
 */
const menu = (location, entries, is_external = false) =>
  entries.map((s, i) => ({
    location,
    label: s.slice(0, s.indexOf(":")),
    url: s.slice(s.indexOf(":") + 1),
    // Social rows render an icon; `icon` keys into <BrandIcon>.
    icon: location === "social" ? s.slice(0, s.indexOf(":")).toLowerCase() : null,
    sort_order: i + 1,
    is_external,
    is_button: false,
  }));

const MENUS = [
  ...menu("header", [
    "Agentic AI:/category/agentic-ai",
    "ML & Data:/category/ml-data",
    "Africa AI:/category/ai-in-africa",
    "Events:/events",
    "Careers:/jobs",
  ]),
  { location: "header", label: "Subscribe Free →", url: "/newsletter", icon: null, sort_order: 6, is_external: false, is_button: true },
  ...menu("footer_topics", [
    "Agentic AI Systems:/category/agentic-ai",
    "Machine Learning:/category/ml-data",
    "Data Engineering:/category/ml-data",
    "AI Research:/category/research",
    "AI in Africa:/category/ai-in-africa",
  ]),
  ...menu("footer_resources", [
    "Cheat Sheets:/cheat-sheets",
    "Job Board:/jobs",
    "Newsletter Archive:/newsletter/archive",
    "Write for Us:/write",
  ]),
  ...menu("footer_company", [
    "About Ibrahim:/author/ibrahim-fofanah",
    "Write for Us:/write",
    "Advertise:/advertise",
    "Contact:/contact",
    "Privacy Policy:/privacy",
  ]),
  ...menu(
    "social",
    [
      "Twitter:https://twitter.com",
      "LinkedIn:https://linkedin.com",
      "GitHub:https://github.com",
      "YouTube:https://youtube.com",
    ],
    true,
  ),
];

/** MDX body for the hero article — exercises every renderer feature. */
const HERO_BODY = `
Most teams treat an agent as a chatbot with a for-loop. It isn't. An agent is a
system that decides *what to do next*, and the hard parts are the three
capabilities that decision depends on.

<Callout tone="warning">
  73% of agentic proof-of-concepts never reach production. Almost none of them
  fail because the model wasn't smart enough.
</Callout>

## The three pillars

Every production agent I've reviewed converges on the same substrate: durable
**memory**, explicit **planning**, and constrained **tool use**. Strip any one
away and the system degrades in a characteristic way.

1. Without memory, it repeats work and contradicts itself.
2. Without planning, it thrashes — long chains of plausible, aimless calls.
3. Without tool constraints, it hallucinates side effects it never performed.

<Aside>An agent without memory is a very expensive way to ask a question twice.</Aside>

### Memory is not a vector database

Retrieval is one *kind* of memory. Production systems need at least three:

| Kind | Lifetime | Typical store |
|------|----------|---------------|
| Working | one task | in-process |
| Episodic | one session | Postgres / Redis |
| Semantic | forever | vector index |

Conflating them is the single most common architectural mistake. Here's the
minimum viable separation:

\`\`\`python
class AgentMemory:
    def __init__(self, working, episodic, semantic):
        self.working = working    # cleared per task
        self.episodic = episodic  # survives the turn
        self.semantic = semantic  # survives the user

    def recall(self, query: str) -> list[str]:
        return self.semantic.search(query, k=5) + self.episodic.recent(n=3)
\`\`\`

## What actually predicts success

Not model choice. Not framework. In the deployments that reached production,
the teams had done one unglamorous thing: they built an **evaluation harness
before they built the agent**.

<Callout tone="tip">
  If you cannot measure a regression, you cannot ship a change. Write the eval
  first — even a crude one — and the architecture will tell you what it needs.
</Callout>

The gap between early adopters and everyone else isn't intelligence. It's
instrumentation.
`.trim();

const GENERIC_BODY = (title) =>
  `
This piece is part of The Data Frontier's ongoing coverage. The full text of
*${title}* is being prepared for publication.

## What this covers

- The practical constraints practitioners actually hit
- Where the published benchmarks disagree with production experience
- What we'd do differently next time

<Callout tone="note">
  Seed content. Replace this body from the admin once the editor ships.
</Callout>
`.trim();

/** Copy for rows the migration created. Keyed by title, which is stable. */
const RESOURCE_COPY = [
  {
    title: "Agentic AI: Concepts, Architectures & Applications",
    description:
      "Ibrahim Denis Fofanah's book — the definitive practitioner guide to building agent systems.",
  },
];

/** A few cheat sheets so /cheat-sheets isn't empty. Images are Unsplash. */
const CHEAT_SHEETS = [
  {
    slug: "pandas-data-cleaning",
    title: "Pandas Data Cleaning — One-Liners",
    description: "The vectorized one-liners that replace loops of manual cleaning.",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200",
    category: "ml-data",
  },
  {
    slug: "agentic-patterns",
    title: "Agentic Design Patterns",
    description: "Memory, planning, tool use — the building blocks of production agents.",
    image_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200",
    category: "agentic-ai",
  },
  {
    slug: "prompt-engineering",
    title: "Prompt Engineering Reference",
    description: "System prompts, few-shot, and structured output at a glance.",
    image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200",
    category: "ml-data",
  },
];

/** Events, dated relative to now so some are always upcoming, one is past. */
const now = new Date();
const daysOut = (n) => new Date(now.getTime() + n * 86400000).toISOString();
const EVENTS = [
  {
    slug: "agentic-ai-summit-2026",
    title: "Agentic AI Summit 2026",
    summary: "A day on building, evaluating, and shipping production agents.",
    description:
      "Practitioners from across the ecosystem share what actually works when agents leave the demo and hit production. Talks on memory architectures, evaluation harnesses, and cost control.",
    host: "The Data Frontier",
    location: "Online",
    is_online: true,
    starts_at: daysOut(21),
    timezone: "UTC",
    register_url: "https://example.com/agentic-summit",
    category: "agentic-ai",
    is_featured: true,
  },
  {
    slug: "africa-ml-meetup-lagos",
    title: "Africa ML Meetup — Lagos",
    summary: "In-person evening of talks and networking for ML practitioners.",
    description:
      "A community meetup for machine-learning engineers and data scientists across West Africa. Lightning talks, a panel on low-resource NLP, and plenty of networking.",
    host: "Africa ML Community",
    location: "Lagos, Nigeria",
    is_online: false,
    starts_at: daysOut(40),
    timezone: "Africa/Lagos",
    register_url: "https://example.com/africa-ml-lagos",
    category: "ai-in-africa",
  },
  {
    slug: "data-viz-workshop",
    title: "Hands-On Data Visualization Workshop",
    summary: "Build clear, honest charts from messy real-world data.",
    description:
      "A practical, laptop-open workshop. Bring a dataset; leave with a dashboard and the principles to make it readable.",
    host: "The Data Frontier",
    location: "Online",
    is_online: true,
    starts_at: daysOut(-14),
    timezone: "UTC",
    register_url: "https://example.com/dataviz-workshop",
    category: "ml-data",
  },
];

const ISSUES = Array.from({ length: 6 }, (_, i) => ({
  issue_number: i + 1,
  title: `Issue #${i + 1}`,
  slug: `issue-${i + 1}`,
  summary: "Weekly dispatch from the Data Frontier.",
  sent_at: new Date(Date.UTC(2026, 0, 6 + i * 7)).toISOString(),
  recipients: 100 + i * 40,
  open_rate: 51 + i,
}));

// ─────────────────────────────────────────────────────────────

async function findUserByEmail(email) {
  // listUsers is paginated; this project is small enough for one page.
  const { data, error } = await db.auth.admin.listUsers({ perPage: 200 });
  die("list users", error);
  return data.users.find((u) => u.email === email) ?? null;
}

async function ensureAuthors() {
  const ids = {};
  for (const a of AUTHORS) {
    let user = await findUserByEmail(a.email);
    if (!user) {
      const { data, error } = await db.auth.admin.createUser({
        email: a.email,
        email_confirm: true,
        user_metadata: { full_name: a.full_name },
      });
      die(`create user ${a.email}`, error);
      user = data.user;
      console.log(`  + auth user ${a.email}`);
    }
    // The on_auth_user_created trigger already made a bare profile; enrich it.
    const { error } = await db
      .from("profiles")
      .update({
        role: a.role,
        full_name: a.full_name,
        slug: a.slug,
        title: a.title,
        bio: a.bio,
        socials: a.socials,
      })
      .eq("id", user.id);
    die(`profile ${a.slug}`, error);
    ids[a.slug] = user.id;
  }
  return ids;
}

async function lookup(table) {
  const { data, error } = await db.from(table).select("id,slug");
  die(`read ${table}`, error);
  return Object.fromEntries(data.map((r) => [r.slug, r.id]));
}

async function undoAll() {
  console.log("Removing seeded data…");
  await db.from("articles").delete().in("slug", ARTICLES.map((a) => a.slug));
  await db.from("cheat_sheets").delete().in("slug", CHEAT_SHEETS.map((c) => c.slug));
  await db.from("events").delete().in("slug", EVENTS.map((e) => e.slug));
  await db.from("newsletter_issues").delete().in("slug", ISSUES.map((i) => i.slug));
  await db.from("jobs").delete().in("company", JOBS.map((j) => j.company));
  await db.from("ticker_items").delete().in("text", TICKER);
  await db.from("menu_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("site_settings").update({ hero_article_id: null, editor_profile_id: null }).eq("id", true);
  for (const a of AUTHORS) {
    const u = await findUserByEmail(a.email);
    if (u) await db.auth.admin.deleteUser(u.id); // cascades to profiles
  }
  console.log("✓ Seed data removed.");
}

async function seed() {
  console.log("Seeding…");

  const authors = await ensureAuthors();
  const categories = await lookup("categories");
  const formats = await lookup("formats");

  const rows = ARTICLES.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    kicker: a.kicker ?? null,
    author_id: authors[a.author],
    category_id: categories[a.category],
    format_id: formats[a.format],
    status: "published",
    featured: a.featured ?? false,
    reading_time: a.reading_time,
    published_at: a.published_at,
    body: a.featured ? HERO_BODY : GENERIC_BODY(a.title),
  }));
  const missing = rows.filter((r) => !r.author_id || !r.category_id || !r.format_id);
  if (missing.length) die("unresolved slug reference", new Error(missing.map((m) => m.slug).join(", ")));

  const { error: aErr } = await db.from("articles").upsert(rows, { onConflict: "slug" });
  die("articles", aErr);
  console.log(`  ✓ ${rows.length} articles`);

  // Ticker and footer menus are seed-owned: replace wholesale.
  await db.from("ticker_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: tErr } = await db
    .from("ticker_items")
    .insert(TICKER.map((text, i) => ({ text, sort_order: i + 1 })));
  die("ticker", tErr);
  console.log(`  ✓ ${TICKER.length} ticker items`);

  await db.from("menu_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: mErr } = await db.from("menu_links").insert(MENUS);
  die("menus", mErr);
  console.log(`  ✓ ${MENUS.length} footer/social links`);

  const { error: jErr } = await db.from("jobs").upsert(JOBS, { onConflict: "title" });
  if (jErr) {
    // `jobs.title` has no unique constraint — fall back to replace-by-company.
    await db.from("jobs").delete().in("company", JOBS.map((j) => j.company));
    const { error } = await db.from("jobs").insert(JOBS);
    die("jobs", error);
  }
  console.log(`  ✓ ${JOBS.length} jobs`);

  const { error: iErr } = await db
    .from("newsletter_issues")
    .upsert(ISSUES, { onConflict: "slug" });
  die("newsletter issues", iErr);
  console.log(`  ✓ ${ISSUES.length} newsletter issues`);

  for (const r of RESOURCE_COPY) {
    const { error } = await db
      .from("resources")
      .update({ description: r.description })
      .eq("title", r.title);
    die("resource copy", error);
  }
  console.log(`  ✓ ${RESOURCE_COPY.length} resource description`);

  const cheatRows = CHEAT_SHEETS.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    image_url: c.image_url,
    category_id: categories[c.category],
    author_id: authors["ibrahim-fofanah"],
    published: true,
  }));
  const { error: csErr } = await db.from("cheat_sheets").upsert(cheatRows, { onConflict: "slug" });
  die("cheat sheets", csErr);
  console.log(`  ✓ ${cheatRows.length} cheat sheets`);

  const eventRows = EVENTS.map((e) => ({
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    description: e.description,
    host: e.host,
    location: e.location,
    is_online: e.is_online,
    starts_at: e.starts_at,
    timezone: e.timezone,
    register_url: e.register_url,
    category_id: categories[e.category],
    is_featured: e.is_featured ?? false,
    published: true,
    created_by: authors["ibrahim-fofanah"],
  }));
  const { error: evErr } = await db.from("events").upsert(eventRows, { onConflict: "slug" });
  die("events", evErr);
  console.log(`  ✓ ${eventRows.length} events`);

  const { data: hero, error: hErr } = await db
    .from("articles")
    .select("id")
    .eq("slug", "agent-revolution-is-here")
    .single();
  die("hero lookup", hErr);

  const { error: sErr } = await db
    .from("site_settings")
    .update({
      hero_article_id: hero.id,
      editor_profile_id: authors["ibrahim-fofanah"],
      established_year: 2026,
      contact_email: "hello@thedatafrontier.com",
      socials: {
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        github: "https://github.com",
        youtube: "https://youtube.com",
      },
      newsletter_headline: "Stay Ahead of the Data Frontier",
      newsletter_subtext:
        "Every week: curated AI research, agentic system breakdowns, Africa tech spotlights, and career intelligence — written by practitioners, for practitioners.",
      newsletter_show_stats: true,
      spotlight_headline:
        "Building Intelligent Systems for the World's Fastest-Growing Markets",
      spotlight_body:
        "Africa is not just adopting AI — it's inventing new architectures for low-resource languages, unreliable infrastructure, and mobile-first contexts. The Data Frontier brings you the stories nobody else is covering.",
      spotlight_cta_url: "/category/ai-in-africa",
      editor_headline: "Why I Built This — and Who It's For",
      editor_bio:
        "I'm a data scientist and AI researcher who got tired of reading AI news written by people who don't build things. The Data Frontier exists to bridge that gap — combining the rigor of academic research with the practical instincts of a practitioner.",
      editor_badges: [
        { label: "Agentic AI", color: "gold" },
        { label: "Africa Tech", color: "teal" },
        { label: "Book Author", color: "gold" },
        { label: "MS Data Science", color: "teal" },
      ],
    })
    .eq("id", true);
  die("site settings", sErr);
  console.log("  ✓ site settings (hero, editor, spotlight, newsletter)");

  console.log("\n✓ Seed complete.");
}

await (undo ? undoAll() : seed());
