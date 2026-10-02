import Link from "next/link";
import { ArrowRight, Check, Eye, Heart, MessageSquare, PenLine, Users } from "lucide-react";
import type { Workspace, WorkspacePiece } from "@/lib/workspace";

// Fixed locale and zone so server and browser render the same text.
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";

/**
 * A writer's home in the newsroom: what needs their attention, their numbers,
 * their pieces by stage, and what's missing from their public author page.
 * Single column on phones; a side column from lg up.
 */
export function WriterHome({ name, data }: { name: string; data: Workspace }) {
  const first = name.split(" ")[0] || name;
  const sentBack = data.pieces.filter((p) => p.status === "changes_requested");
  const drafts = data.pieces.filter((p) => p.status === "draft");
  const review = data.pieces.filter((p) => p.status === "in_review");
  const live = data.pieces.filter((p) => p.status === "published");
  const todo = data.profile.checklist.filter((c) => !c.done).length;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[2px] text-gold">Your workspace</p>
          <h1 className="font-serif text-[28px] leading-tight font-black tracking-[-0.5px] sm:text-3xl">
            Welcome back, {first}
          </h1>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center justify-center gap-2 rounded bg-gold px-5 py-3 text-[14px] font-bold text-on-accent transition-opacity hover:opacity-85"
        >
          <PenLine className="size-4" aria-hidden />
          Start a new piece
        </Link>
      </header>

      {sentBack.length > 0 && (
        <section className="mb-6 rounded-lg border border-red/30 bg-red-dim p-4 sm:p-5" aria-label="Needs your attention">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-red">Needs your attention</p>
          <ul className="flex flex-col gap-3">
            {sentBack.map((p) => (
              <li key={p.id} className="rounded-md border border-border bg-bg p-4">
                <p className="font-serif text-[17px] leading-snug font-bold">{p.title}</p>
                {p.review_note ? (
                  <p className="mt-2 line-clamp-3 border-l-2 border-red/40 pl-3 text-[13px] whitespace-pre-wrap text-muted">
                    {p.review_note}
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-muted">The editor asked for changes.</p>
                )}
                <Link
                  href={`/admin/articles/${p.id}`}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded bg-ink px-4 py-2.5 text-[13px] font-bold text-bg sm:w-auto"
                >
                  Open and fix <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Eye className="size-4" />} label="Views" value={data.totals.views} />
            <Stat icon={<Heart className="size-4" />} label="Reactions" value={data.totals.reactions} />
            <Stat icon={<MessageSquare className="size-4" />} label="Comments" value={data.totals.comments} href="/admin/responses" />
            <Stat icon={<Users className="size-4" />} label="Followers" value={data.followers} href="/admin/followers" />
          </section>

          {data.pieces.length === 0 ? (
            <section className="mt-6 rounded-lg border border-dashed border-gold/40 bg-gold-dim p-5 sm:p-6">
              <p className="font-serif text-xl font-black">Your first piece starts here</p>
              <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-[14px] text-muted">
                <li>Skim the writer&apos;s guide for what makes a strong piece.</li>
                <li>Press &ldquo;Start a new piece&rdquo; and write a first draft.</li>
                <li>Submit it for review. The editor reads it and replies.</li>
              </ol>
              <Link href="/write/guide" className="mt-4 inline-block text-[13px] font-semibold text-gold hover:underline">
                Read the writer&apos;s guide →
              </Link>
            </section>
          ) : (
            <div className="mt-6 flex flex-col gap-6">
              <Group title="Drafts" hint="Only you can see these." pieces={drafts} kind="draft" />
              <Group title="In review" hint="Waiting for the editor. You'll get an email." pieces={review} kind="review" />
              <Group title="Published" hint="Live on the site." pieces={live} kind="live" />
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-bg2 p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <p className="font-serif text-lg font-black">Your author page</p>
              {todo > 0 && <span className="font-mono text-[11px] text-gold">{todo} to do</span>}
            </div>
            <ul className="flex flex-col gap-2">
              {data.profile.checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      c.done ? "border-teal bg-teal-dim text-teal" : "border-border text-transparent"
                    }`}
                    aria-hidden
                  >
                    <Check className="size-3" />
                  </span>
                  <span className={c.done ? "text-muted line-through" : ""}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/admin/profile"
                className="rounded border border-border px-4 py-2.5 text-center text-[13px] font-semibold hover:border-border-strong hover:bg-surface-1"
              >
                {todo > 0 ? "Complete your profile" : "Edit your profile"}
              </Link>
              {data.profile.slug && (
                <Link href={`/author/${data.profile.slug}`} className="text-center text-[13px] text-gold hover:underline">
                  See your author page →
                </Link>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-bg2 p-5">
            <p className="mb-3 font-serif text-lg font-black">How publishing works</p>
            <ol className="flex flex-col gap-2.5 text-[13px]">
              {[
                ["Write", "Draft in the editor. Save as often as you like."],
                ["Submit", "Press Submit for review when it's ready."],
                ["Review", "The editor reads it, then publishes it or sends it back with a note."],
                ["Live", "It goes out under your name. You get an email."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-gold/40 font-mono text-[10px] text-gold">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-semibold">{t}.</span> <span className="text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link href="/write/guide" className="mt-3 inline-block text-[13px] text-gold hover:underline">
              The writer&apos;s guide →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href?: string }) {
  const Box = href ? Link : "div";
  return (
    <Box href={href as string} className={`rounded-lg border border-border bg-bg2 p-4 ${href ? "transition-colors hover:border-gold/40" : ""}`}>
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
        <span aria-hidden>{icon}</span>
        {label}
      </p>
      <p className="mt-2 font-serif text-[28px] leading-none font-black text-gold">{value.toLocaleString("en-US")}</p>
    </Box>
  );
}

function Group({
  title,
  hint,
  pieces,
  kind,
}: {
  title: string;
  hint: string;
  pieces: WorkspacePiece[];
  kind: "draft" | "review" | "live";
}) {
  if (pieces.length === 0) return null;
  // Keep the home short (it's mostly read on phones); the full list is one tap away.
  const LIMIT = 5;
  const shown = pieces.slice(0, LIMIT);
  const status = kind === "live" ? "published" : kind === "review" ? "in_review" : "draft";
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 className="font-serif text-xl font-black">
          {title} <span className="font-mono text-[12px] font-normal text-muted">{pieces.length}</span>
        </h2>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-bg2">
        {shown.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
            <Link href={`/admin/articles/${p.id}`} className="min-w-0 flex-1">
              <span className="block font-serif text-[16px] leading-snug font-bold hover:text-gold">{p.title}</span>
              <span className="mt-1 block text-[12px] text-muted">
                {kind === "live"
                  ? `Published ${day(p.published_at)}`
                  : kind === "review"
                    ? `Submitted · last edited ${day(p.updated_at)}`
                    : `Last edited ${day(p.updated_at)}`}
              </span>
            </Link>
            {kind === "live" ? (
              <div className="flex items-center gap-4 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1" title="Views">
                  <Eye className="size-3.5" aria-hidden /> {p.views}
                </span>
                <span className="inline-flex items-center gap-1" title="Reactions">
                  <Heart className="size-3.5" aria-hidden /> {p.reactions}
                </span>
                <span className="inline-flex items-center gap-1" title="Comments">
                  <MessageSquare className="size-3.5" aria-hidden /> {p.comments}
                </span>
                <Link href={`/article/${p.slug}`} target="_blank" className="font-semibold text-gold hover:underline">
                  View
                </Link>
              </div>
            ) : (
              <Link
                href={`/admin/articles/${p.id}`}
                className="self-start rounded border border-border px-3 py-1.5 text-[12px] font-semibold hover:border-border-strong hover:bg-surface-1 sm:self-auto"
              >
                {kind === "draft" ? "Continue" : "Open"}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {pieces.length > LIMIT && (
        <Link href={`/admin/articles?status=${status}`} className="mt-2 inline-block text-[13px] font-semibold text-gold hover:underline">
          See all {pieces.length} →
        </Link>
      )}
    </section>
  );
}
