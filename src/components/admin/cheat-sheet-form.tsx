"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, ImagePlus, Link2, Loader2 } from "lucide-react";
import { saveCheatSheet, deleteCheatSheet } from "@/app/admin/cheat-sheets/actions";
import { useUpload } from "@/components/admin/use-upload";
import { StatusBadge } from "@/components/admin/status-badge";
import { Popover } from "@/components/admin/popover";
import { pdfFirstPageToPng } from "@/lib/pdf-preview";

type DownloadMode = "image" | "file" | "link";

const isPdf = (url: string) => /\.pdf(\?|$)/i.test(url);
/** What readers get, worked out from a saved sheet. */
function initialMode(download: string): DownloadMode {
  if (!download) return "image";
  return download.includes("/storage/v1/object/public/cheat-sheets/") ? "file" : "link";
}

type Option = { id: string; name: string };

export type CheatSheetDraft = {
  id: string | null;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  download_url: string;
  category_id: string;
  /** draft · in_review · changes_requested · published */
  status: string;
  review_note: string;
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

export function CheatSheetForm({
  sheet,
  categories,
  canPublish,
  isStaff,
  justSaved = false,
  justSent = false,
}: {
  sheet: CheatSheetDraft;
  categories: Option[];
  /** Editors, admins and trusted writers publish; other writers submit. */
  canPublish: boolean;
  /** Only editors and admins send a sheet back with a note. */
  isStaff: boolean;
  justSaved?: boolean;
  justSent?: boolean;
}) {
  const intentRef = useRef<HTMLInputElement>(null);
  const live = sheet.status === "published";
  const locked = live && !canPublish;
  const [imageUrl, setImageUrl] = useState(sheet.image_url);
  const [mode, setMode] = useState<DownloadMode>(initialMode(sheet.download_url));
  const [fileUrl, setFileUrl] = useState(initialMode(sheet.download_url) === "file" ? sheet.download_url : "");
  const [linkUrl, setLinkUrl] = useState(initialMode(sheet.download_url) === "link" ? sheet.download_url : "");
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, startSave] = useTransition();
  const { upload, error: upErr } = useUpload();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const downloadUrl = mode === "file" ? fileUrl : mode === "link" ? linkUrl.trim() : "";

  /**
   * One upload for both cases. An image becomes the preview (and, unless a
   * PDF or link is set, the download). A PDF becomes the download, and its
   * first page is drawn in the browser to make the preview.
   */
  async function pick(file: File | undefined, previewOnly = false) {
    if (!file) return;
    setError(null);
    try {
      if (file.type === "application/pdf" && !previewOnly) {
        setStep("Uploading the PDF…");
        const pdf = await upload(file, "cheat-sheets");
        if (!pdf) return;
        setFileUrl(pdf);
        setMode("file");
        setStep("Making a preview from page 1…");
        try {
          const png = await pdfFirstPageToPng(file);
          const img = await upload(png, "cheat-sheets");
          if (img) setImageUrl(img);
        } catch {
          setError("The PDF is attached, but a preview couldn't be made from it. Upload a preview image below.");
        }
      } else if (file.type.startsWith("image/")) {
        setStep("Uploading the image…");
        const img = await upload(file, "cheat-sheets");
        if (img) setImageUrl(img);
      } else {
        setError("Use an image (PNG, JPG, WebP) or a PDF.");
      }
    } finally {
      setStep(null);
    }
  }

  function submitWith(intent: string) {
    if (intentRef.current) intentRef.current.value = intent;
    formRef.current?.requestSubmit();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const data = new FormData(formRef.current!);
    startSave(async () => {
      const res = await saveCheatSheet(data);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex w-full max-w-[760px] flex-col gap-5 px-5 py-10 sm:px-8">
      {sheet.id && <input type="hidden" name="id" value={sheet.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="download_url" value={downloadUrl} />
      <input ref={intentRef} type="hidden" name="intent" defaultValue="save" />

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/cheat-sheets" className="mr-auto text-[13px] text-muted hover:text-ink">
          ← Cheat sheets
        </Link>
        {sheet.id && <StatusBadge status={sheet.status} />}
        {justSaved && !justSent && <span className="text-[12px] text-teal">Saved</span>}
        {!locked && (
          <button
            type="button"
            onClick={() => submitWith("save")}
            disabled={saving}
            className="rounded border border-border px-3.5 py-2 text-[13px] font-medium hover:border-border-strong hover:bg-surface-1 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
        {!canPublish && (sheet.status === "draft" || sheet.status === "changes_requested") && (
          <button
            type="button"
            onClick={() => submitWith("submit")}
            disabled={saving}
            className="rounded bg-gold px-3.5 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60"
          >
            {sheet.status === "changes_requested" ? "Resubmit for review" : "Submit for review"}
          </button>
        )}
        {canPublish && !live && (
          <button
            type="button"
            onClick={() => submitWith("publish")}
            disabled={saving}
            className="rounded bg-gold px-3.5 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60"
          >
            Publish
          </button>
        )}
        {canPublish && live && (
          <button
            type="button"
            onClick={() => confirm("Take this cheat sheet off the site?") && submitWith("unpublish")}
            disabled={saving}
            className="rounded border border-border px-3.5 py-2 text-[13px] font-medium text-muted hover:text-ink disabled:opacity-60"
          >
            Unpublish
          </button>
        )}
        {isStaff && sheet.status === "in_review" && (
          <Popover
            title="Send back with a note"
            buttonClassName="rounded border border-red/40 px-3.5 py-2 text-[13px] font-medium text-red hover:bg-red-dim"
            label="Send back"
          >
            <label htmlFor="review_note" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
              Note to the writer (emailed to them)
            </label>
            <textarea
              id="review_note"
              name="review_note"
              rows={4}
              defaultValue={sheet.review_note}
              placeholder="What needs to change, and why."
              className="w-full resize-y rounded border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none focus:border-gold/40"
            />
            <button
              type="button"
              onClick={() => submitWith("send_back")}
              disabled={saving}
              className="mt-2 w-full rounded bg-red px-3.5 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              Send back with this note
            </button>
          </Popover>
        )}
      </div>

      {justSent && sheet.status === "in_review" && (
        <p className="rounded border border-teal/30 bg-teal-dim px-3 py-2.5 text-[13px]" role="status">
          <strong className="font-semibold text-teal">Sent. It&apos;s with the editor now.</strong>{" "}You&apos;ll get an email when it&apos;s published or sent back.
        </p>
      )}
      {!isStaff && sheet.status === "in_review" && !justSent && (
        <p className="rounded border border-gold/30 bg-gold-dim px-3 py-2.5 text-[13px]">
          <strong className="font-semibold">Waiting for review.</strong>{" "}You can still make small edits; save them and the editor sees the latest version.
        </p>
      )}
      {sheet.status === "changes_requested" && (
        <div className="rounded border border-red/30 bg-red-dim px-3 py-2.5 text-[13px]">
          <p className="font-semibold text-red">The editor asked for changes</p>
          <p className="mt-1 whitespace-pre-wrap">{sheet.review_note || "No note was left. Reply to the email if anything is unclear."}</p>
          {!isStaff && <p className="mt-1 text-muted">Make your edits, then press Resubmit for review.</p>}
        </div>
      )}
      {locked && (
        <p className="rounded border border-gold/30 bg-gold-dim px-3 py-2.5 text-[13px]">
          <strong className="font-semibold">This cheat sheet is live.</strong>{" "}Live cheat sheets are changed by an editor. To fix something, email the editor with the change you need.
        </p>
      )}

      {error && <p className="rounded border border-red/30 bg-red-dim px-3 py-2 text-[13px] text-red">{error}</p>}

      <fieldset disabled={locked} className="contents">

      <div>
        <span className={label}>The cheat sheet *</span>
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-md border border-border">
            <Image src={imageUrl} alt="Cheat sheet preview" width={720} height={400} unoptimized className="h-auto w-full" />
            <div className="absolute top-2 right-2 flex gap-2">
              {mode === "file" && fileUrl && (
                <span className="inline-flex items-center gap-1 rounded bg-bg/85 px-2.5 py-1.5 text-[12px] font-semibold text-teal backdrop-blur">
                  <FileText className="size-3.5" aria-hidden /> PDF attached
                </span>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded bg-bg/85 px-3 py-1.5 text-[12px] backdrop-blur hover:text-gold"
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={`flex h-44 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 text-center text-[13px] text-muted transition-colors hover:border-border-strong ${
              dragging ? "border-gold bg-gold-dim" : "border-border"
            }`}
          >
            {step ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            <span className="font-semibold text-ink">{step ?? "Upload an image or a PDF"}</span>
            {!step && <span className="text-[12px]">PNG, JPG or PDF, up to 10 MB. Drag it here or click. A PDF&apos;s first page becomes the preview.</span>}
          </button>
        )}
        {imageUrl && step && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-muted">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> {step}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {upErr && <p className="mt-1 text-[11px] text-red">{upErr}</p>}
      </div>

      <fieldset>
        <legend className={label}>What readers download</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              { key: "image", icon: <ImagePlus className="size-4" />, title: "The image", hint: "The picture above, full size." },
              { key: "file", icon: <FileText className="size-4" />, title: "A PDF", hint: "Uploaded here." },
              { key: "link", icon: <Link2 className="size-4" />, title: "A link", hint: "Google Drive, Canva, Notion…" },
            ] as const
          ).map((o) => (
            <label
              key={o.key}
              className={`cursor-pointer rounded border px-3 py-2.5 text-[13px] transition-colors ${
                mode === o.key ? "border-gold/50 bg-gold-dim" : "border-border bg-surface-1 hover:border-border-strong"
              }`}
            >
              <input type="radio" name="download_mode" value={o.key} checked={mode === o.key} onChange={() => setMode(o.key)} className="sr-only" />
              <span className="flex items-center gap-1.5 font-semibold">
                {o.icon}
                {o.title}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">{o.hint}</span>
            </label>
          ))}
        </div>

        {mode === "file" && (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded border border-border bg-bg2 px-3 py-2.5 text-[13px]">
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener" className="inline-flex min-w-0 items-center gap-1.5 text-gold hover:underline">
                <FileText className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{isPdf(fileUrl) ? "PDF attached" : "File attached"}: open it</span>
              </a>
            ) : (
              <span className="text-muted">No PDF yet.</span>
            )}
            <button type="button" onClick={() => pdfRef.current?.click()} className="ml-auto rounded border border-border px-3 py-1.5 text-[12px] font-semibold hover:bg-surface-1">
              {fileUrl ? "Replace PDF" : "Upload PDF"}
            </button>
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        )}
        {mode === "link" && (
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            type="url"
            placeholder="https://drive.google.com/…"
            className={`${field} mt-2 font-mono text-[12px]`}
          />
        )}
        {mode !== "image" && imageUrl && (
          <p className="mt-2 text-[11px] text-muted">
            The image above is the preview readers see.{" "}
            <button type="button" onClick={() => previewRef.current?.click()} className="font-semibold text-gold hover:underline">
              Use a different preview image
            </button>
            <input
              ref={previewRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                pick(e.target.files?.[0], true);
                e.target.value = "";
              }}
            />
          </p>
        )}
        {mode !== "image" && !imageUrl && (
          <p className="mt-2 text-[11px] text-muted">Add a preview image in the box above so readers can see what they&apos;re getting.</p>
        )}
      </fieldset>

      <div>
        <label className={label} htmlFor="title">Title *</label>
        <input id="title" name="title" defaultValue={sheet.title} required className={field} />
      </div>

      <div>
        <label className={label} htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={sheet.slug} placeholder="auto-from-title" className={`${field} font-mono text-[12px]`} />
      </div>

      <div>
        <label className={label} htmlFor="description">Description</label>
        <textarea id="description" name="description" defaultValue={sheet.description} rows={3} className={`${field} resize-none`} />
      </div>

      <div>
        <label className={label} htmlFor="category_id">Category</label>
        <select id="category_id" name="category_id" defaultValue={sheet.category_id} className={field}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      </fieldset>

      {sheet.id && !locked && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this cheat sheet?")) {
              startSave(async () => {
                const res = await deleteCheatSheet(sheet.id!);
                if (res?.error) setError(res.error);
              });
            }
          }}
          className="self-start text-[12px] text-red hover:underline"
        >
          Delete cheat sheet
        </button>
      )}
    </form>
  );
}
