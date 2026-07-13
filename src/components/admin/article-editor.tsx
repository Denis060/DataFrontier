"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Eye, ImagePlus, Loader2, Save } from "lucide-react";
import { renderPreview } from "@/app/admin/articles/preview-action";
import { saveArticle, deleteArticle } from "@/app/admin/articles/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { CoverUpload } from "@/components/admin/cover-upload";
import { RichEditor } from "@/components/admin/rich-editor";
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
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

export function ArticleEditor({
  article,
  categories,
  formats,
  series,
  canPublish,
  justSaved,
}: {
  article: EditorArticle;
  categories: Option[];
  formats: Option[];
  series: Option[];
  canPublish: boolean;
  justSaved: boolean;
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

  function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const data = new FormData(formRef.current!);
    startSave(async () => {
      const res = await saveArticle(data); // redirects on success
      if (res?.error) setError(res.error);
    });
  }

  /** Set the intent, then submit the whole form — so the body is always saved,
   *  whatever button was clicked. */
  function submitWith(intent: string) {
    setError(null);
    if (intentRef.current) intentRef.current.value = intent;
    formRef.current?.requestSubmit();
  }

  const isDraftish = ["draft", "changes_requested"].includes(article.status);

  return (
    <form ref={formRef} onSubmit={onSubmitForm} className="flex min-h-screen flex-col">
      {article.id && <input type="hidden" name="id" value={article.id} />}
      {/* Which button was pressed: "save" or a target status. */}
      <input ref={intentRef} type="hidden" name="intent" defaultValue="save" />

      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-bg/90 px-5 py-3 backdrop-blur-xl sm:px-8">
        <Link href="/admin/articles" className="text-[13px] text-muted hover:text-ink">
          ← Articles
        </Link>
        {article.id && <StatusBadge status={article.status} />}
        {justSaved && <span className="text-[12px] text-teal">Saved</span>}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {article.id && article.status === "published" && (
            <Link
              href={`/article/${article.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-[12px] text-muted hover:text-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden /> View
            </Link>
          )}

          <button
            type="button"
            onClick={() => submitWith("save")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded border border-border px-3.5 py-2 text-[13px] font-medium transition-colors hover:border-border-strong hover:bg-surface-1 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </button>

          {/* Every transition saves the whole form first — see submitWith. */}
          {isDraftish && (
            <button
              type="button"
              onClick={() => submitWith("in_review")}
              disabled={saving}
              className="rounded border border-gold/40 px-3.5 py-2 text-[13px] font-medium text-gold hover:bg-gold-dim disabled:opacity-60"
            >
              {article.id ? "Submit for review" : "Save & submit"}
            </button>
          )}
          {article.id && canPublish && article.status !== "published" && (
            <button
              type="button"
              onClick={() => submitWith("published")}
              disabled={saving}
              className="rounded bg-gold px-3.5 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60"
            >
              Publish
            </button>
          )}
          {article.id && canPublish && article.status === "in_review" && (
            <button
              type="button"
              onClick={() => submitWith("changes_requested")}
              disabled={saving}
              className="rounded border border-red/40 px-3.5 py-2 text-[13px] font-medium text-red hover:bg-red-dim disabled:opacity-60"
            >
              Request changes
            </button>
          )}
        </div>
      </header>

      {error && (
        <p className="border-b border-red/30 bg-red-dim px-5 py-2.5 text-[13px] text-red sm:px-8">
          {error}
        </p>
      )}

      <div className="grid flex-1 lg:grid-cols-[1fr_320px]">
        {/* Main column: title + body */}
        <div className="flex min-w-0 flex-col border-border lg:border-r">
          <div className="border-b border-border px-5 py-5 sm:px-8">
            <input
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
                  title={hasComponents ? "This article uses callouts (:::). Edit it in Markdown." : undefined}
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
        <aside className="flex flex-col gap-5 bg-bg2 px-5 py-6 sm:px-8">
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

          <div>
            <span className={label}>Cover image</span>
            <CoverUpload name="cover_image" defaultUrl={article.cover_image} />
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
    </form>
  );
}
