/**
 * Declarative admin screens for simple site tables (menus, ticker, events,
 * jobs, corrections, predictions, categories, formats). One generic editor
 * (components/admin/manager.tsx) and one pair of server actions
 * (app/admin/manage/actions.ts) serve them all; this file says which columns
 * exist, how to edit them, and who may.
 *
 * Shared by server and client, so it holds no secrets. Access is enforced by
 * the actions and, underneath, by each table's RLS write policy.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "number"
  | "checkbox"
  | "date"
  | "datetime"
  | "select"
  | "tags";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** Static choices for a select. */
  options?: { value: string; label: string }[];
  /** Choices loaded at request time (see OPTION_SOURCES). */
  optionsFrom?: "articles" | "categories";
  /** Generate from another field when left blank (slugs). */
  slugFrom?: string;
  /** Full-width on wide screens. */
  wide?: boolean;
  /** Prefilled on new items, and used when left blank (NOT NULL columns). */
  defaultValue?: string;
  /** Only show (and save) this field when another field has one of these values. */
  showWhen?: { field: string; in: string[] };
};

export type Resource = {
  key: string;
  table: string;
  title: string;
  singular: string;
  description: string;
  roles: ("admin" | "editor")[];
  fields: Field[];
  /** Columns to order by, in sequence. */
  orderBy: { column: string; ascending: boolean }[];
  /** Which fields make the collapsed row's headline and subline. */
  summary: { title: string; meta?: string[] };
  /** Set on insert only, e.g. created_by. */
  stampCreator?: string;
  /** Pages to refresh after a change ("layout" refreshes the whole site). */
  revalidate: string[];
  /** Shown above the list, e.g. a caution. */
  note?: string;
};

const ORDER = (column: string, ascending = true) => ({ column, ascending });
const sortField: Field = { name: "sort_order", label: "Order", type: "number", defaultValue: "0", help: "Lower numbers come first. Leave 0 if it doesn't matter." };
const active = (label = "Show on the site"): Field => ({ name: "is_active", label, type: "checkbox" });

export const RESOURCES: Resource[] = [
  {
    key: "menus",
    table: "menu_links",
    title: "Menus",
    singular: "link",
    description: "The links in the site header, the three footer columns, and the social icons.",
    roles: ["admin"],
    fields: [
      {
        name: "location",
        label: "Where it appears",
        type: "select",
        required: true,
        options: [
          { value: "header", label: "Header" },
          { value: "footer_topics", label: "Footer: Topics" },
          { value: "footer_resources", label: "Footer: Resources" },
          { value: "footer_company", label: "Footer: Company" },
          { value: "social", label: "Social icons" },
        ],
      },
      { name: "label", label: "Label", type: "text", required: true },
      {
        name: "url",
        label: "Link",
        type: "text",
        required: true,
        placeholder: "/events or https://…",
        help: "A page on this site (starts with /, e.g. /events) or a full https:// link to another site.",
      },
      sortField,
      {
        name: "is_button",
        label: "Show as a gold button",
        type: "checkbox",
        showWhen: { field: "location", in: ["header"] },
      },
      { name: "is_external", label: "Opens in a new tab (another site)", type: "checkbox" },
      {
        name: "icon",
        label: "Which icon",
        type: "select",
        showWhen: { field: "location", in: ["social"] },
        options: [
          { value: "x", label: "X" },
          { value: "twitter", label: "Twitter" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "github", label: "GitHub" },
          { value: "youtube", label: "YouTube" },
          { value: "facebook", label: "Facebook" },
          { value: "instagram", label: "Instagram" },
          { value: "orcid", label: "ORCID" },
          { value: "scholar", label: "Google Scholar" },
        ],
      },
      active(),
    ],
    orderBy: [ORDER("location"), ORDER("sort_order")],
    summary: { title: "label", meta: ["location", "url"] },
    revalidate: ["layout"],
  },
  {
    key: "ticker",
    table: "ticker_items",
    title: "Ticker",
    singular: "headline",
    description: "The scrolling LATEST line under the header. It hides when nothing is shown.",
    roles: ["admin"],
    fields: [
      { name: "text", label: "Headline", type: "text", required: true, wide: true },
      { name: "url", label: "Link (optional)", type: "text", placeholder: "/article/… or https://…" },
      sortField,
      active(),
    ],
    orderBy: [ORDER("sort_order")],
    summary: { title: "text", meta: ["url"] },
    revalidate: ["layout"],
    note: "Only link to things you can stand behind: an article of ours, or the original source.",
  },
  {
    key: "events",
    table: "events",
    title: "Events",
    singular: "event",
    description: "Talks, workshops and meetups on the Events page.",
    roles: ["admin", "editor"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, wide: true },
      { name: "slug", label: "Slug", type: "text", slugFrom: "title", help: "Leave blank to make one from the title." },
      { name: "starts_at", label: "Starts", type: "datetime", required: true },
      { name: "ends_at", label: "Ends", type: "datetime" },
      { name: "timezone", label: "Time zone", type: "text", placeholder: "Africa/Freetown" },
      { name: "host", label: "Host", type: "text" },
      { name: "location", label: "Location", type: "text", placeholder: "City, venue" },
      { name: "is_online", label: "Online event", type: "checkbox" },
      { name: "register_url", label: "Registration link", type: "url" },
      { name: "cover_image", label: "Cover image URL", type: "url" },
      { name: "category_id", label: "Category", type: "select", optionsFrom: "categories" },
      { name: "summary", label: "Summary", type: "textarea", wide: true },
      { name: "description", label: "Description (Markdown)", type: "textarea", wide: true },
      { name: "is_featured", label: "Featured", type: "checkbox" },
      { name: "published", label: "Published", type: "checkbox" },
    ],
    orderBy: [ORDER("starts_at", false)],
    summary: { title: "title", meta: ["starts_at", "location"] },
    stampCreator: "created_by",
    revalidate: ["/events", "/"],
  },
  {
    key: "jobs",
    table: "jobs",
    title: "Jobs",
    singular: "job",
    description: "Roles on the Careers page and the homepage careers band.",
    roles: ["admin", "editor"],
    fields: [
      { name: "title", label: "Role", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "location", label: "Location", type: "text" },
      { name: "is_remote", label: "Remote", type: "checkbox" },
      { name: "apply_url", label: "Apply link", type: "url", required: true },
      { name: "salary_range", label: "Salary range", type: "text" },
      { name: "tags", label: "Tags", type: "tags", help: "Comma-separated, e.g. Python, SQL, Remote." },
      { name: "brand_color", label: "Brand colour", type: "text", placeholder: "#1a73e8" },
      { name: "company_logo", label: "Logo URL", type: "url" },
      { name: "posted_at", label: "Posted", type: "date" },
      active("Listed"),
    ],
    orderBy: [ORDER("posted_at", false)],
    summary: { title: "title", meta: ["company", "location"] },
    revalidate: ["/jobs", "/"],
  },
  {
    key: "corrections",
    table: "corrections",
    title: "Corrections",
    singular: "correction",
    description: "Dated notes shown on a corrected article and listed on /corrections.",
    roles: ["admin", "editor"],
    fields: [
      { name: "article_id", label: "Article", type: "select", optionsFrom: "articles", required: true, wide: true },
      { name: "corrected_on", label: "Date", type: "date", required: true },
      { name: "note", label: "What changed", type: "textarea", required: true, wide: true, help: "Say what was wrong and what it says now." },
    ],
    orderBy: [ORDER("corrected_on", false)],
    summary: { title: "note", meta: ["article_id", "corrected_on"] },
    revalidate: ["/corrections", "layout"],
  },
  {
    key: "predictions",
    table: "predictions",
    title: "Scoreboard",
    singular: "prediction",
    description: "The \"what would make me wrong\" claims tracked on /scoreboard. Only published ones are public.",
    roles: ["admin", "editor"],
    fields: [
      { name: "article_id", label: "Article", type: "select", optionsFrom: "articles", required: true, wide: true },
      { name: "claim", label: "Claim", type: "textarea", required: true, wide: true, help: "Trim to the testable sentence." },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "open", label: "Still open" },
          { value: "held", label: "Held up" },
          { value: "wrong", label: "Proved wrong" },
        ],
      },
      { name: "checked_on", label: "Checked on", type: "date" },
      { name: "verdict_note", label: "What happened", type: "textarea", wide: true, help: "For held up or proved wrong: the evidence, with a link." },
      sortField,
      { name: "published", label: "Show on the scoreboard", type: "checkbox" },
    ],
    orderBy: [ORDER("published", true), ORDER("created_at", true)],
    summary: { title: "claim", meta: ["status", "published", "article_id"] },
    revalidate: ["/scoreboard"],
  },
  {
    key: "categories",
    table: "categories",
    title: "Categories",
    singular: "category",
    description: "The topics articles are filed under (header, category pages, homepage).",
    roles: ["admin", "editor"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", slugFrom: "name", help: "Changing it changes the category's web address." },
      { name: "icon", label: "Icon (emoji)", type: "text" },
      { name: "color", label: "Colour", type: "text", placeholder: "gold, teal, red or #hex" },
      sortField,
      { name: "description", label: "Description", type: "textarea", wide: true },
    ],
    orderBy: [ORDER("sort_order")],
    summary: { title: "name", meta: ["slug"] },
    revalidate: ["layout"],
    note: "Deleting a category takes it off every article filed under it.",
  },
  {
    key: "formats",
    table: "formats",
    title: "Formats",
    singular: "format",
    description: "Article types like Tutorial, Analysis and Research Brief.",
    roles: ["admin", "editor"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", slugFrom: "name" },
      {
        name: "color",
        label: "Colour",
        type: "select",
        required: true,
        options: [
          { value: "gold", label: "Gold" },
          { value: "teal", label: "Teal" },
          { value: "red", label: "Red" },
        ],
      },
      sortField,
    ],
    orderBy: [ORDER("sort_order")],
    summary: { title: "name", meta: ["color"] },
    revalidate: ["layout"],
  },
  {
    key: "free-offers",
    table: "lead_magnets",
    title: "Free offers",
    singular: "free offer",
    description: "Downloads readers get for subscribing, each with its own page at /free/<slug> to share in posts.",
    roles: ["admin", "editor"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "The Everyday SQL Pack" },
      { name: "slug", label: "Page link", type: "text", slugFrom: "title", help: "The page is everydaydatascience.com/free/<this>. Share that link in your post." },
      { name: "tagline", label: "One-line pitch", type: "text", wide: true, help: "Shown under the title and in link previews." },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "includes", label: "What's inside", type: "textarea", wide: true, help: "One item per line. Shown as a checklist." },
      {
        name: "files",
        label: "Files in the download",
        type: "textarea",
        required: true,
        wide: true,
        help: "One link per line (images or PDFs, e.g. a cheat sheet's image link). They're merged in this order into one PDF. Only confirmed subscribers can download it.",
      },
      { name: "cover_image", label: "Cover image", type: "url", wide: true, help: "Optional. Leave blank to use the first image in the files." },
      active("Live (the page accepts signups)"),
      sortField,
    ],
    orderBy: [ORDER("sort_order"), ORDER("created_at", false)],
    summary: { title: "title", meta: ["slug", "is_active"] },
    revalidate: [],
    note: "To see who signed up and their survey answers, open Newsletter → Subscribers → Audience.",
  },
];

export const resourceFor = (key: string) => RESOURCES.find((r) => r.key === key) ?? null;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
