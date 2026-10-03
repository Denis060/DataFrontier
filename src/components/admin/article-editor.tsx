"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Eye, ImagePlus, Loader2, Save } from "lucide-react";
import { renderPreview } from "@/app/admin/articles/preview-action";
import { saveArticle, deleteArticle } from "@/app/admin/articles/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { CoverUpload } from "@/components/admin/cover-upload";
import { RichEditor } from "@/components/admin/rich-editor";
import { StyleCheck } from "@/components/admin/style-check";
import { WritingHelp } from "@/components/admin/writing-help";
import { Popover } from "@/components/admin/popover";
import { ReviewDiff } from "@/components/admin/review-diff";
import { SeoDescriptionHint, SeoTitleHint } from "@/components/admin/seo-hints";
import { SubmitCheck } from "@/components/admin/submit-check";
import { OUTLINES } from "@/lib/outlines";
import { useUpload } from "@/components/admin/use-upload";
import { hasRichIncompatibleSyntax } from "@/lib/mdx-guard";

type Option = { id: string; name: string };

export type EditorArticle = {
  id: string | null;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  kicker: string;
  body: string;
  category_id: string;
  format_id: string;
  cover_image: string;
  status: string;
  series_id: string;
  series_position: string;
  featured: boolean;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  review_note: string;
  /** The writer's "what I changed" note on resubmit. */
  author_note: string;
  /** The body as it was when sent back, for the editor's "what changed" view. */
  review_snapshot: string;
  /** Comma-separated tag names. */
  tags: string;
  coauthor_ids: string[];
  /** Credited people without a writer account. */
  guest_authors: { name: string; url: string }[];
  /** The primary author (null for a new article: it's the current user). */
  author_id: string | null;
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

export function ArticleEditor({
  article,
  categories,
  formats,
  series,
  writers = [],
  canPublish,
  justSaved,
  justSent = false,
}: {
  article: EditorArticle;
  categories: Option[];
  formats: Option[];
  series: Option[];
  writers?: { id: string; full_name: string }[];
  canPublish: boolean;
  justSaved: boolean;
  /** Just sent for review: confirm the hand-off. */
  justSent?: boolean;
}) {
  const [body, setBody] = useState(article.body);
  const [tab, setTab] = useState<"write" | "preview">("write");
  // Rich editing is only safe for bodies without MDX components (it strips
  // them). Start in Markdown for component-using or existing content; a blank
  // new article defaults to Rich, which is what a non-technical writer wants.
  const hasComponents = hasRichIncompatibleSyntax(body);
  const [writeMode, setWriteMode] = useState<"rich" | "markdown">(
    article.body.trim() === "" ? "rich" : "markdown",
  );
  // Remounts the rich editor when we re-enter it, so it re-reads `body`.
  const [richKey, setRichKey] = useState(0);
  const [preview, setPreview] = useState<React.ReactNode>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  // The sticky toolbar sits right under the sticky header, whatever its height.
  useEffect(() => {
    const header = headerRef.current;
    const form = formRef.current;
    if (!header || !form) return;
    const set = () => form.style.setProperty("--editor-header", `${header.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const intentRef = useRef<HTMLInputElement>(null);
  const { upload, uploading: imgUploading, error: imgError } = useUpload();

  /** Upload an image and splice its Markdown in at the caret. */
  async function insertImage(file: File | undefined) {
    if (!file) return;
    const url = await upload(file);
    if (!url) return;
    const el = bodyRef.current;
    const snippet = `\n![${file.name.replace(/\.[^.]+$/, "")}](${url})\n`;
    const at = el?.selectionStart ?? body.length;
    const next = body.slice(0, at) + snippet + body.slice(at);
    setBody(next);
    // Restore focus just past the inserted snippet.
    requestAnimationFrame(() => {
      el?.focus();
      const pos = at + snippet.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  // Recompute the preview when its tab is open and typing settles.
  useEffect(() => {
    if (tab !== "preview") return;
    const t = setTimeout(() => {
      startPreview(async () => {
        const { node, error } = await renderPreview(body);
        setPreview(node);
        setPreviewErr(error);
      });
    }, 400);
    return () => clearTimeout(t);
  }, [body, tab]);

  // Unsaved-changes guard: warn before leaving with edits that aren't saved.
  // Any input in the form (including the rich editor's contenteditable)
  // marks it dirty; a save clears it, and the save redirects on success.
  const dirty = useRef(false);
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // A writer can't change a live piece (enforced in saveArticle and by the
  // enforce_publish_rights trigger); the editor says so instead of failing.
  const locked = !canPublish && ["published", "archived"].includes(article.status);
  // Outline notes still to be written over (see lib/outlines).
  const outlineNotesLeft = (body.match(/\[Write here\b/gi) ?? []).length;

  function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    dirty.current = false;
    const data = new FormData(formRef.current!);
    startSave(async () => {
      const res = await saveArticle(data); // redirects on success
      if (res?.error) setError(res.error);
    });
  }

  /** Set the intent, then submit the whole form — so the body is always saved,
   *  whatever button was clicked. */
  // Sending to the editor goes through the pre-submit sheet first.
  const [checking, setChecking] = useState<HTMLFormElement | null>(null);

  function submitWith(intent: string, checked = false) {
    if (intent === "in_review" && !checked) {
      setChecking(formRef.current);
      return;
    }
    setError(null);
    if (intentRef.current) intentRef.current.value = intent;
    formRef.current?.requestSubmit();
  }


  return (
    <form
      ref={formRef}
      onSubmit={onSubmitForm}
      onInput={() => (dirty.current = true)}
      onChange={() => (dirty.current = true)}
      className="flex min-h-screen flex-col"
    >
      {article.id && <input type="hidden" name="id" value={article.id} />}
      {checking && (
        <SubmitCheck
          form={checking}
          body={body}
          onCancel={() => setChecking(null)}
          onConfirm={() => {
            setChecking(null);
            submitWith("in_review", true);
          }}
        />
      )}
      {/* Which button was pressed: "save" or a target status. */}
      <input ref={intentRef} type="hidden" name="intent" defaultValue="save" />

      {/* One row on every screen: on phones labels shrink to icons or short
          words so nothing wraps. Its height feeds --editor-header, which keeps
          the formatting toolbar pinned just below it. */}
      <header
        ref={headerRef}
        className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-bg px-3 py-2.5 sm:gap-3 sm:px-8 sm:py-3"
      >
        {/* Writers came from their workspace; take them back there. */}
        <Link
          href={canPublish ? "/admin/articles" : "/admin"}
          aria-label={canPublish ? "Back to articles" : "Back to your workspace"}
          className="inline-flex shrink-0 items-center gap-1 rounded p-1.5 text-[13px] text-muted hover:text-ink sm:p-0"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">{canPublish ? "Articles" : "Your workspace"}</span>
        </Link>
        {article.id && (
          <span className="hidden sm:inline-flex">
            <StatusBadge status={article.status} />
          </span>
        )}
        {justSaved && <span className="hidden text-[12px] text-teal sm:inline">Saved</span>}

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          {!locked && (
            <WritingHelp
              getFormat={() => {
                const sel = formRef.current?.elements.namedItem("format_id") as HTMLSelectElement | null;
                return formats.find((f) => f.id === sel?.value)?.name ?? null;
              }}
            />
          )}
          {/* Drafts open as a noindexed preview on the real page; the author
              and staff can read them there (RLS), nobody else can. */}
          {article.id && (
            <Link
              href={`/article/${article.slug}`}
              target="_blank"
              aria-label={article.status === "published" ? "View on site" : "Preview on site"}
              className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-2 text-[12px] text-muted hover:text-ink sm:px-3"
            >
              <ExternalLink className="size-4 sm:size-3.5" aria-hidden />
              <span className="hidden sm:inline">{article.status === "published" ? "View" : "Preview on site"}</span>
            </Link>
          )}

          {!locked && (
          <button
            type="button"
            onClick={() => submitWith("save")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-2 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-1 disabled:opacity-60 sm:px-3.5"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </button>
          )}

          {/* Every transition saves the whole form first — see submitWith. */}
          {/* Resubmitting after changes: let the writer say what they changed. */}
          {article.status === "changes_requested" && (
            <Popover
              title="Resubmit for review"
              buttonClassName="rounded border border-gold/40 px-2.5 py-2 text-[13px] font-medium whitespace-nowrap text-gold hover:bg-gold-dim sm:px-3.5"
              label={
                <>
                  <span className="sm:hidden">Resubmit</span>
                  <span className="hidden sm:inline">Resubmit for review</span>
                </>
              }
            >
              <label htmlFor="author_note" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
                What did you change? (optional)
              </label>
              <textarea
                id="author_note"
                name="author_note"
                rows={4}
                placeholder="e.g. Expanded the excerpt, added the benchmark source, cut the intro."
                className="w-full resize-y rounded border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none focus:border-gold/40"
              />
              <p className="mt-1 text-[11px] text-muted">The editor sees this, plus exactly which lines you edited.</p>
              <button
                type="button"
                onClick={() => submitWith("in_review")}
                disabled={saving}
                className="mt-2 w-full rounded bg-gold px-3.5 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60"
              >
                Send it back to the editor
              </button>
            </Popover>
          )}
          {article.status === "draft" && (
            <button
              type="button"
              onClick={() => submitWith("in_review")}
              disabled={saving}
              className="rounded border border-gold/40 px-2.5 py-2 text-[13px] font-medium whitespace-nowrap text-gold hover:bg-gold-dim disabled:opacity-60 sm:px-3.5"
            >
              <span className="sm:hidden">Submit</span>
              <span className="hidden sm:inline">{article.id ? "Submit for review" : "Save & submit"}</span>
            </button>
          )}
          {article.id && canPublish && article.status !== "published" && (
            <button
              type="button"
              onClick={() => submitWith("published")}
              disabled={saving}
              className="rounded bg-gold px-2.5 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60 sm:px-3.5"
            >
              Publish
            </button>
          )}
          {article.id && canPublish && article.status === "in_review" && (
            <Popover
              title="Request changes"
              buttonClassName="rounded border border-red/40 px-2.5 py-2 text-[13px] font-medium whitespace-nowrap text-red hover:bg-red-dim sm:px-3.5"
              label={
                <>
                  <span className="sm:hidden">Send back</span>
                  <span className="hidden sm:inline">Request changes</span>
                </>
              }
            >
              <label htmlFor="review_note" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
                Note to the writer (emailed to them)
              </label>
              <textarea
                id="review_note"
                name="review_note"
                rows={5}
                defaultValue={article.review_note}
                placeholder="What needs to change, and why."
                className="w-full resize-y rounded border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none focus:border-gold/40"
              />
              <button
                type="button"
                onClick={() => submitWith("changes_requested")}
                disabled={saving}
                className="mt-2 w-full rounded bg-red px-3.5 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                Send back with this note
              </button>
            </Popover>
          )}
        </div>
      </header>

      {/* Sending for review gets a clear "it's with the editor", not just "Saved". */}
      {justSent && article.status === "in_review" && (
        <div className="border-b border-teal/30 bg-teal-dim px-5 py-3 text-[13px] sm:px-8" role="status">
          <p className="font-semibold text-teal">Sent. It&apos;s with the editor now.</p>
          <p className="mt-0.5 text-ink">
            {canPublish
              ? "It's in the review queue."
              : "We've emailed you a receipt. You'll hear back by email when the editor publishes it or asks for changes. You can still make small edits while it waits."}
          </p>
          {!canPublish && (
            <Link href="/admin" className="mt-1 inline-block font-semibold text-teal hover:underline">
              Back to your workspace →
            </Link>
          )}
        </div>
      )}

      {/* The writer sees why their piece came back. */}
      {article.status === "changes_requested" && (
        <div className="border-b border-red/30 bg-red-dim px-5 py-3 text-[13px] sm:px-8">
          <p className="font-semibold text-red">The editor asked for changes</p>
          {article.review_note ? (
            <p className="mt-1 whitespace-pre-wrap text-ink">{article.review_note}</p>
          ) : (
            <p className="mt-1 text-muted">No note was left. Reply to the email you received if anything is unclear.</p>
          )}
          <p className="mt-1 text-muted">Make your edits, then press Submit for review again.</p>
        </div>
      )}

      {/* The editor sees what came back: the writer's note and the edits. */}
      {canPublish && article.status === "in_review" && (article.author_note || article.review_snapshot) && (
        <div className="border-b border-gold/30 bg-gold-dim px-5 py-3 text-[13px] sm:px-8">
          <p className="font-semibold">Revised after your request</p>
          {article.review_note && (
            <p className="mt-1 text-muted">
              You asked: <span className="whitespace-pre-wrap text-ink">{article.review_note}</span>
            </p>
          )}
          {article.author_note ? (
            <p className="mt-1 text-muted">
              The writer says: <span className="whitespace-pre-wrap text-ink">{article.author_note}</span>
            </p>
          ) : (
            <p className="mt-1 text-muted">The writer didn&apos;t leave a note.</p>
          )}
          {article.review_snapshot && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[13px] font-semibold text-gold hover:underline">
                Show what changed in the text
              </summary>
              <div className="mt-3 max-h-[50vh] overflow-y-auto rounded-md border border-border bg-bg p-3">
                <ReviewDiff before={article.review_snapshot} after={article.body} />
              </div>
            </details>
          )}
        </div>
      )}

      {locked && (
        <p className="border-b border-gold/30 bg-gold-dim px-5 py-2.5 text-[13px] sm:px-8">
          <strong className="font-semibold">This piece is live.</strong> Published articles are
          changed by an editor, so every edit gets the same review. To fix something, email the
          editor with the change you need.
        </p>
      )}

      {error && (
        <p className="border-b border-red/30 bg-red-dim px-5 py-2.5 text-[13px] text-red sm:px-8">
          {error}
        </p>
      )}

      <fieldset disabled={locked} className="contents">

      <div className="grid flex-1 lg:grid-cols-[1fr_320px]">
        {/* Main column: title + body */}
        <div className="flex min-w-0 flex-col border-border lg:border-r">
          <div className="border-b border-border px-5 py-5 sm:px-8">
            <input
              id="title"
              name="title"
              defaultValue={article.title}
              required
              placeholder="Article title"
              className="w-full bg-transparent font-serif text-[28px] font-black tracking-[-0.8px] outline-none placeholder:text-muted"
            />
            <input
              name="subtitle"
              defaultValue={article.subtitle}
              placeholder="Subtitle (optional)"
              className="mt-2 w-full bg-transparent text-base text-muted outline-none placeholder:text-muted/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 border-b border-border px-5 sm:px-8">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors ${
                  tab === t ? "border-gold text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t === "preview" && <Eye className="size-3.5" />}
                {t === "write" ? "Write" : "Preview"}
              </button>
            ))}

            {tab === "write" && (
              <div className="ml-auto flex items-center gap-1 py-1.5">
                {/* Rich is disabled for MDX-component bodies — it would strip them. */}
                <button
                  type="button"
                  disabled={hasComponents}
                  title={hasComponents ? "This article uses Markdown the rich editor can't keep (custom ::: blocks). Edit it in Markdown." : undefined}
                  onClick={() => {
                    setWriteMode("rich");
                    setRichKey((k) => k + 1);
                  }}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    writeMode === "rich" ? "bg-gold-dim text-gold" : "text-muted hover:text-ink"
                  }`}
                >
                  Rich
                </button>
                <button
                  type="button"
                  onClick={() => setWriteMode("markdown")}
                  className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
                    writeMode === "markdown" ? "bg-gold-dim text-gold" : "text-muted hover:text-ink"
                  }`}
                >
                  Markdown
                </button>
              </div>
            )}
            {tab === "preview" && <span className="ml-auto font-mono text-[10px] text-muted">MDX</span>}
          </div>

          {imgError && (
            <p className="border-b border-red/30 bg-red-dim px-5 py-2 text-[12px] text-red sm:px-8">
              {imgError}
            </p>
          )}

          {/* Always-present hidden field: `body` is the single source of truth
              the form submits, whichever editing surface produced it. */}
          <textarea name="body" value={body} readOnly hidden />

          {/* A new, empty piece can start from the house outline for its kind. */}
          {tab === "write" && !article.id && !body.trim() && (
            <div className="border-b border-border bg-gold-dim px-5 py-3 sm:px-8">
              <p className="mb-2 text-[12px] font-semibold">Start from an outline</p>
              <div className="flex flex-wrap gap-2">
                {OUTLINES.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => {
                      setBody(o.body);
                      setRichKey((k) => k + 1);
                      dirty.current = true;
                      // Pick the matching format if it's still unset.
                      const sel = formRef.current?.elements.namedItem("format_id") as HTMLSelectElement | null;
                      const match = o.formats
                        .map((n) => formats.find((fm) => fm.name.toLowerCase() === n.toLowerCase()))
                        .find(Boolean);
                      if (sel && !sel.value && match) sel.value = match.id;
                    }}
                    className="rounded-full border border-gold/40 bg-bg px-3 py-1.5 text-[12px] font-semibold text-gold hover:bg-gold-dim"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Or just start typing below for a blank page. An outline gives you the sections every
                piece needs, with a short note in each telling you what to write.
              </p>
            </div>
          )}

          {/* While an outline's notes remain, say plainly what they are and how many are left. */}
          {tab === "write" && outlineNotesLeft > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-gold-dim px-5 py-2.5 text-[12px] sm:px-8">
              <p className="min-w-0 flex-1">
                <strong className="font-semibold">You&apos;re using an outline.</strong> Click each{" "}
                <span className="font-mono">[Write here: …]</span> note, delete it, and write that part in your own
                words.{" "}
                <span className="font-semibold text-gold">
                  {outlineNotesLeft} {outlineNotesLeft === 1 ? "note" : "notes"} left
                </span>
              </p>
              {!article.id && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("Remove the outline and start with a blank page?")) return;
                    setBody("");
                    setRichKey((k) => k + 1);
                  }}
                  className="shrink-0 font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  Start blank instead
                </button>
              )}
            </div>
          )}

          {tab === "write" && writeMode === "rich" && (
            <RichEditor key={richKey} initialMarkdown={body} onChange={setBody} />
          )}

          {tab === "write" && writeMode === "markdown" && (
            <div className="flex flex-1 flex-col">
              <label className="flex cursor-pointer items-center gap-1.5 self-end px-5 py-1.5 text-[12px] text-muted hover:text-ink sm:px-8">
                {imgUploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                Insert image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    insertImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onDrop={(e) => {
                  const f = e.dataTransfer.files?.[0];
                  if (f?.type.startsWith("image/")) {
                    e.preventDefault();
                    insertImage(f);
                  }
                }}
                placeholder={"Write in Markdown. Add callouts with :::tip … :::, plus tables, ```code``` blocks, or drag an image in."}
                className="min-h-[45vh] flex-1 resize-none bg-transparent px-5 pb-5 font-mono text-[13.5px] leading-relaxed outline-none placeholder:text-muted sm:px-8"
              />
            </div>
          )}

          {tab === "preview" && (
            <div className="min-h-[50vh] flex-1 px-5 py-6 sm:px-8">
              {previewing && (
                <p className="mb-3 flex items-center gap-2 text-[12px] text-muted">
                  <Loader2 className="size-3.5 animate-spin" /> Rendering…
                </p>
              )}
              {previewErr ? (
                <p className="rounded border border-red/30 bg-red-dim px-4 py-3 text-[13px] text-red">
                  {previewErr}
                </p>
              ) : body.trim() ? (
                preview
              ) : (
                <p className="text-sm text-muted">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: metadata */}
        {/* On wide screens the settings column stays put and scrolls on its
            own, so the writing area scrolls without dragging it along. */}
        <aside className="flex flex-col gap-5 bg-bg2 px-5 py-6 sm:px-8 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:self-start lg:overflow-y-auto lg:border-l lg:border-border">
          {!locked && (
            <StyleCheck
              body={body}
              onApply={(next) => {
                setBody(next);
                setRichKey((k) => k + 1); // remount the rich editor on the fixed text
                dirty.current = true;
              }}
            />
          )}
          <div>
            <label className={label} htmlFor="slug">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={article.slug}
              placeholder="auto-from-title"
              className={`${field} font-mono text-[12px]`}
            />
          </div>

          <div>
            <label className={label} htmlFor="category_id">
              Category
            </label>
            <select id="category_id" name="category_id" defaultValue={article.category_id} className={field}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="format_id">
              Format
            </label>
            <select id="format_id" name="format_id" defaultValue={article.format_id} className={field}>
              <option value="">None</option>
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={label} htmlFor="series_id">
                Series
              </label>
              <select id="series_id" name="series_id" defaultValue={article.series_id} className={field}>
                <option value="">None</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24 shrink-0">
              <label className={label} htmlFor="series_position">
                Part #
              </label>
              <input
                id="series_position"
                name="series_position"
                type="number"
                min="1"
                defaultValue={article.series_position}
                placeholder="1"
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="tags">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              defaultValue={article.tags}
              placeholder="rag, evaluation, python"
              className={field}
            />
            <p className="mt-1 text-[10px] leading-snug text-muted">
              Comma-separated, up to 8. Each tag gets its own page listing every article with it.
            </p>
          </div>

          {writers.filter((w) => w.id !== article.author_id).length > 0 && (
            <fieldset>
              <legend className={label}>Co-authors</legend>
              <div className="max-h-40 overflow-y-auto rounded border border-border bg-surface-1 px-3 py-2">
                {writers
                  .filter((w) => w.id !== article.author_id)
                  .map((w) => (
                    <label key={w.id} className="flex items-center gap-2 py-1 text-[13px]">
                      <input
                        type="checkbox"
                        name="coauthors"
                        value={w.id}
                        defaultChecked={article.coauthor_ids.includes(w.id)}
                        className="size-3.5 accent-[var(--df-gold)]"
                      />
                      {w.full_name}
                    </label>
                  ))}
              </div>
              <p className="mt-1 text-[10px] leading-snug text-muted">
                They share the byline and the piece appears on their author page.
              </p>
            </fieldset>
          )}

          <GuestAuthors initial={article.guest_authors} labelClass={label} fieldClass={field} />

          <div>
            <label className={label} htmlFor="kicker">
              Kicker
            </label>
            <input
              id="kicker"
              name="kicker"
              defaultValue={article.kicker}
              placeholder="e.g. Sierra Leone · Policy"
              className={field}
            />
          </div>

          <div>
            <label className={label} htmlFor="excerpt">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              defaultValue={article.excerpt}
              rows={3}
              placeholder="Card and preview text."
              className={`${field} resize-none`}
            />
          </div>

          <div id="cover" className="scroll-mt-24">
            <span className={label}>Cover image</span>
            <CoverUpload name="cover_image" defaultUrl={article.cover_image} />
          </div>

          {canPublish && (
            <label className="flex items-start gap-2.5 rounded border border-gold/30 bg-surface-1 px-3 py-3 text-[13px]">
              <input type="checkbox" name="featured" defaultChecked={article.featured} className="mt-0.5 size-4 accent-gold" />
              <span>
                <span className="font-semibold">Feature on homepage</span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  Make this the big hero article on the front page. Only one article can be the hero, so turning this on replaces the current one. It must be published to show.
                </span>
              </span>
            </label>
          )}

          <div className="rounded border border-border bg-surface-1 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">Search (SEO)</p>
            <label className="mb-1 block text-[11px] text-muted" htmlFor="meta_title">SEO title</label>
            <input
              id="meta_title"
              name="meta_title"
              defaultValue={article.meta_title}
              maxLength={70}
              placeholder="Front-load the keyword, aim for ~60 chars"
              className={field}
            />
            <SeoTitleHint formRef={formRef} />
            <label className="mb-1 block text-[11px] text-muted" htmlFor="meta_description">Meta description</label>
            <textarea
              id="meta_description"
              name="meta_description"
              defaultValue={article.meta_description}
              rows={3}
              maxLength={170}
              placeholder="~155 characters. Leave blank to use the excerpt."
              className={`${field} resize-none`}
            />
            <SeoDescriptionHint formRef={formRef} />
            <label className="mt-3 mb-1 block text-[11px] text-muted" htmlFor="canonical_url">
              Originally published at
            </label>
            <input
              id="canonical_url"
              name="canonical_url"
              type="url"
              defaultValue={article.canonical_url}
              placeholder="https://yourblog.com/the-original-post"
              className={`${field} font-mono text-[12px]`}
            />
            <p className="mt-1 text-[10px] leading-snug text-muted">
              Republishing a post from your own blog or Medium? Paste the original link. Google
              credits the original, so neither copy is penalised. Leave blank for new pieces.
            </p>
          </div>

          {article.id && canPublish && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this article permanently?")) {
                  startSave(async () => {
                    const res = await deleteArticle(article.id!);
                    if (res?.error) setError(res.error);
                  });
                }
              }}
              className="mt-2 text-left text-[12px] text-red hover:underline"
            >
              Delete article
            </button>
          )}
        </aside>
      </div>
      </fieldset>
    </form>
  );
}

/**
 * Guest co-authors: a name and an optional profile link each. Submitted as
 * parallel guest_name / guest_url fields (FormData.getAll keeps their order).
 */
function GuestAuthors({
  initial,
  labelClass,
  fieldClass,
}: {
  initial: { name: string; url: string }[];
  labelClass: string;
  fieldClass: string;
}) {
  const [rows, setRows] = useState(initial.length ? initial : []);
  const update = (i: number, key: "name" | "url", v: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: v } : row)));

  return (
    <fieldset>
      <legend className={labelClass}>Guest co-authors</legend>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="rounded border border-border bg-surface-1 p-2">
            <input
              name="guest_name"
              value={row.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Full name"
              maxLength={80}
              className={`${fieldClass} mb-1.5`}
            />
            <input
              name="guest_url"
              type="url"
              value={row.url}
              onChange={(e) => update(i, "url", e.target.value)}
              placeholder="https://linkedin.com/in/… (optional)"
              className={`${fieldClass} font-mono text-[12px]`}
            />
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
              className="mt-1 text-[11px] text-red hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {rows.length < 4 && (
          <button
            type="button"
            onClick={() => setRows((r) => [...r, { name: "", url: "" }])}
            className="self-start rounded border border-border px-3 py-1.5 text-[12px] hover:border-border-strong hover:bg-surface-1"
          >
            + Add guest co-author
          </button>
        )}
      </div>
      <p className="mt-1 text-[10px] leading-snug text-muted">
        For people without a writer account. Shown in the byline; the link (LinkedIn, website,
        Scholar) is optional.
      </p>
    </fieldset>
  );
}
