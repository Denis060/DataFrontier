"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Loader2 } from "lucide-react";
import { saveCheatSheet, deleteCheatSheet } from "@/app/admin/cheat-sheets/actions";
import { useUpload } from "@/components/admin/use-upload";

type Option = { id: string; name: string };

export type CheatSheetDraft = {
  id: string | null;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  download_url: string;
  category_id: string;
  published: boolean;
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

export function CheatSheetForm({
  sheet,
  categories,
}: {
  sheet: CheatSheetDraft;
  categories: Option[];
}) {
  const [imageUrl, setImageUrl] = useState(sheet.image_url);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const { upload, uploading, error: upErr } = useUpload();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    const url = await upload(file, "cheat-sheets");
    if (url) setImageUrl(url);
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
    <form ref={formRef} onSubmit={onSubmit} className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-5 py-10 sm:px-8">
      {sheet.id && <input type="hidden" name="id" value={sheet.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />

      <div className="flex items-center justify-between">
        <Link href="/admin/cheat-sheets" className="text-[13px] text-muted hover:text-ink">
          ← Cheat sheets
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && <p className="rounded border border-red/30 bg-red-dim px-3 py-2 text-[13px] text-red">{error}</p>}

      <div>
        <span className={label}>Infographic image *</span>
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-md border border-border">
            <Image src={imageUrl} alt="Cheat sheet" width={720} height={400} unoptimized className="h-auto w-full" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute top-2 right-2 rounded bg-bg/80 px-3 py-1.5 text-[12px] backdrop-blur hover:text-gold"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-[12px] text-muted hover:border-border-strong"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {uploading ? "Uploading…" : "Upload the cheat-sheet image (PNG/JPG, up to 10 MB)"}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {upErr && <p className="mt-1 text-[11px] text-red">{upErr}</p>}
      </div>

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
          <option value="">— none —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="download_url">Hi-res / PDF download URL (optional)</label>
        <input id="download_url" name="download_url" defaultValue={sheet.download_url} placeholder="defaults to the image above" className={`${field} font-mono text-[12px]`} />
      </div>

      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="published" defaultChecked={sheet.published} className="size-4 accent-[var(--df-gold)]" />
        Published (visible on the public site)
      </label>

      {sheet.id && (
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
