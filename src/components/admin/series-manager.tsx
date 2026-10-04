"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { saveSeries, deleteSeries, moveLesson } from "@/app/admin/series/actions";
import { useUpload } from "@/components/admin/use-upload";
import { CoverMosaic } from "@/components/learning/cover-mosaic";
import { StatusBadge } from "@/components/admin/status-badge";

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  status: string;
  cover_image: string | null;
  reading_time: number | null;
  series_position: number | null;
};

export type Series = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  sort_order: number;
  cover_url: string | null;
  lessons: Lesson[];
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

const lessons = (n: number) => `${n} ${n === 1 ? "lesson" : "lessons"}`;
const minutes = (ls: Lesson[]) => ls.filter((l) => l.status === "published").reduce((m, l) => m + (l.reading_time ?? 0), 0);

/** The path's details, including its own cover image. */
function Fields({ series, onDone }: { series?: Series; onDone?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState(series?.cover_url ?? "");
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { upload, uploading, error: upErr } = useUpload();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const data = new FormData(formRef.current!);
    startSave(async () => {
      const res = await saveSeries(data);
      if ("error" in res) setMsg({ ok: false, text: res.error });
      else {
        setMsg({ ok: true, text: "Saved." });
        onDone?.();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSave} className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      {series && <input type="hidden" name="id" value={series.id} />}
      <input type="hidden" name="cover_url" value={cover} />

      <div>
        <span className={label}>Cover image</span>
        <CoverMosaic
          covers={cover ? [cover] : (series?.lessons ?? []).map((l) => l.cover_image).filter((x): x is string => !!x)}
          title={series ? lessons(series.lessons.length) : "New path"}
          seed={series?.slug ?? "new"}
          steps={series?.lessons.length ?? 3}
          className="aspect-[16/9] rounded-md border border-border"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-[12px] font-semibold hover:bg-surface-1"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
            {cover ? "Replace" : "Upload a cover"}
          </button>
          {cover && (
            <button type="button" onClick={() => setCover("")} className="text-[12px] text-muted hover:text-red">
              Remove
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const url = await upload(f);
              if (url) setCover(url);
            }}
          />
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted">
          {cover ? "Shown on the path's card and page." : "Without one, the path uses its lessons' covers (or the step graphic)."} 16:9 works best.
        </p>
        {upErr && <p className="mt-1 text-[11px] text-red">{upErr}</p>}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={label}>Title *</label>
            <input name="title" defaultValue={series?.title ?? ""} required className={field} />
          </div>
          <div className="w-20 shrink-0">
            <label className={label} title="Lower numbers come first on /series">
              Order
            </label>
            <input name="sort_order" type="number" defaultValue={series?.sort_order ?? 0} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>Short description</label>
          <textarea name="description" rows={2} defaultValue={series?.description ?? ""} className={`${field} resize-none`} />
          <p className="mt-1 text-[11px] text-muted">On the path&apos;s card and in search results. A line or two.</p>
        </div>
        <div>
          <label className={label}>Introduction</label>
          <textarea name="long_description" rows={5} defaultValue={series?.long_description ?? ""} className={field} />
          <p className="mt-1 text-[11px] text-muted">Markdown. Shown at the top of the path&apos;s page, above the lessons.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving || uploading} className="rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
            {saving ? "Saving…" : series ? "Save changes" : "Create path"}
          </button>
          {onDone && (
            <button type="button" onClick={onDone} className="text-[13px] text-muted hover:text-ink">
              Cancel
            </button>
          )}
          {series && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (confirm(`Delete “${series.title}”? Its articles stay, they're just no longer in a path.`)) startDelete(() => deleteSeries(series.id));
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded border border-red/40 px-3 py-2 text-[12px] text-red hover:bg-red-dim disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Delete path
            </button>
          )}
          {msg && <span className={`text-[12px] ${msg.ok ? "text-teal" : "text-red"}`}>{msg.text}</span>}
        </div>
      </div>
    </form>
  );
}

/** One path: its picture, numbers, the lessons in order (with reordering), and its details. */
function PathCard({ series }: { series: Series }) {
  const [editing, setEditing] = useState(false);
  const [moving, startMove] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const published = series.lessons.filter((l) => l.status === "published").length;

  function move(id: string, dir: -1 | 1) {
    setErr(null);
    startMove(async () => {
      const res = await moveLesson(series.id, id, dir);
      if ("error" in res) setErr(res.error);
    });
  }

  return (
    <article className={`overflow-hidden rounded-lg border bg-bg2 ${editing ? "border-gold/50 md:col-span-2 xl:col-span-3" : "border-border"}`}>
      {editing ? (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">Editing: {series.title}</p>
            <button type="button" onClick={() => setEditing(false)} aria-label="Close" className="rounded p-1 text-muted hover:bg-surface-1 hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
          <Fields series={series} onDone={() => setEditing(false)} />
        </div>
      ) : (
        <>
          <CoverMosaic
            covers={series.cover_url ? [series.cover_url] : series.lessons.map((l) => l.cover_image).filter((x): x is string => !!x)}
            title={lessons(series.lessons.length)}
            seed={series.slug}
            steps={series.lessons.length}
            className="aspect-[16/9]"
          />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-gold">
                  {published} published{series.lessons.length > published && ` · ${series.lessons.length - published} draft`} · {minutes(series.lessons)} min
                </p>
                <h2 className="mt-1 font-serif text-[19px] leading-tight font-black">{series.title}</h2>
              </div>
              <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted" title="Order on /series">
                #{series.sort_order}
              </span>
            </div>
            {series.description && <p className="mt-2 line-clamp-2 text-[13px] text-muted">{series.description}</p>}

            <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-[1.5px] text-muted">Lessons, in reading order</p>
            {series.lessons.length === 0 ? (
              <p className="rounded border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted">
                No lessons yet. Open an article and pick this path under <strong className="text-ink">Series</strong>.
              </p>
            ) : (
              <ol className={`flex flex-col divide-y divide-border rounded border border-border bg-bg ${moving ? "opacity-60" : ""}`}>
                {series.lessons.map((l, i) => (
                  <li key={l.id} className="flex items-center gap-2 px-2.5 py-2 text-[13px]">
                    <span className="w-5 shrink-0 text-center font-mono text-[11px] text-gold">{i + 1}</span>
                    <Link href={`/admin/articles/${l.id}`} className="min-w-0 flex-1 truncate hover:text-gold" title={l.title}>
                      {l.title}
                    </Link>
                    {l.status !== "published" && <StatusBadge status={l.status} />}
                    <span className="flex shrink-0">
                      <button
                        type="button"
                        onClick={() => move(l.id, -1)}
                        disabled={i === 0 || moving}
                        aria-label={`Move “${l.title}” up`}
                        className="rounded p-1 text-muted hover:bg-surface-1 hover:text-ink disabled:opacity-25"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(l.id, 1)}
                        disabled={i === series.lessons.length - 1 || moving}
                        aria-label={`Move “${l.title}” down`}
                        className="rounded p-1 text-muted hover:bg-surface-1 hover:text-ink disabled:opacity-25"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {err && <p className="mt-2 text-[12px] text-red">{err}</p>}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-2 text-[12px] font-semibold hover:border-border-strong hover:bg-surface-1"
              >
                <Pencil className="size-3.5" /> Edit details &amp; cover
              </button>
              <Link href={`/series/${series.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-gold">
                View <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export function SeriesManager({ series }: { series: Series[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      {adding ? (
        <div className="rounded-lg border border-gold/50 bg-bg2 p-5">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[2px] text-gold">New learning path</p>
          <Fields onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 self-start rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85"
        >
          <Plus className="size-4" /> New learning path
        </button>
      )}
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {series.map((s) => (
          <PathCard key={s.id} series={s} />
        ))}
      </div>
    </div>
  );
}
