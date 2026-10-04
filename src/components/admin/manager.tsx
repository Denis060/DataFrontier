"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Plus, Upload } from "lucide-react";
import { useUpload } from "@/components/admin/use-upload";
import { resourceFor, type Field } from "@/lib/managed";
import { deleteRow, saveRow } from "@/app/admin/manage/actions";

export type Option = { value: string; label: string };
type Values = Record<string, string | boolean | null>;
type Row = Record<string, unknown>;

const input =
  "w-full rounded border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const labelCls = "mb-1 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

/** ISO timestamp -> the browser's local "YYYY-MM-DDTHH:mm" for <input type=datetime-local>. */
function toLocalInput(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initialValues(fields: Field[], row: Row | null): Values {
  const v: Values = {};
  for (const f of fields) {
    const raw = row?.[f.name];
    if (f.type === "checkbox") v[f.name] = row ? raw === true : f.name === "is_active" || f.name === "published" ? true : false;
    else if (f.type === "datetime") v[f.name] = toLocalInput(raw);
    else if (f.type === "tags") v[f.name] = Array.isArray(raw) ? raw.join(", ") : "";
    else if (f.type === "date" && !row && f.required) v[f.name] = new Date().toISOString().slice(0, 10);
    else if (f.name === "status" && !row) v[f.name] = "open";
    else if (!row && f.defaultValue !== undefined) v[f.name] = f.defaultValue;
    else v[f.name] = raw == null ? "" : String(raw);
  }
  // Predictions and corrections start unpublished; everything else starts live.
  if (!row && fields.some((f) => f.name === "published") && fields.some((f) => f.name === "claim")) v.published = false;
  return v;
}

export function Manager({
  resourceKey,
  rows,
  options,
}: {
  resourceKey: string;
  rows: Row[];
  options: Record<string, Option[]>;
}) {
  const res = resourceFor(resourceKey)!;
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const optionLabel = (f: Field, value: unknown) => {
    const list = f.options ?? (f.optionsFrom ? options[f.optionsFrom] : undefined);
    return list?.find((o) => o.value === value)?.label ?? String(value ?? "");
  };
  const meta = (row: Row) =>
    (res.summary.meta ?? [])
      .map((name) => {
        const f = res.fields.find((x) => x.name === name);
        const v = row[name];
        if (!f || v == null || v === "") return null;
        if (f.type === "checkbox") return v ? f.label : null;
        if (f.type === "datetime") return new Date(String(v)).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
        if (f.type === "select") return optionLabel(f, v);
        return String(v);
      })
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
          {rows.length} {rows.length === 1 ? res.singular : `${res.singular}s`}
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded bg-gold px-3.5 py-2 text-[13px] font-bold text-on-accent hover:opacity-85"
          >
            <Plus className="size-4" aria-hidden /> Add {res.singular}
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-6 rounded-md border border-gold/40 bg-bg2 p-5">
          <p className="mb-4 font-serif text-lg font-black">New {res.singular}</p>
          <RowForm resourceKey={resourceKey} row={null} options={options} onDone={() => setAdding(false)} />
        </div>
      )}

      {rows.length === 0 && !adding ? (
        <p className="rounded border border-dashed border-border px-6 py-12 text-center text-[13px] text-muted">
          Nothing here yet. Use “Add {res.singular}” to create the first one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const id = String(row.id);
            const isOpen = open === id;
            const hidden =
              ("is_active" in row && row.is_active === false) || ("published" in row && row.published === false);
            return (
              <li key={id} className="rounded-md border border-border bg-bg2">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">
                      {String(row[res.summary.title] ?? "Untitled")}
                    </span>
                    {meta(row) && <span className="block truncate text-[12px] text-muted">{meta(row)}</span>}
                  </span>
                  {hidden && (
                    <span className="shrink-0 rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1px] text-muted">
                      hidden
                    </span>
                  )}
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border px-4 py-4">
                    <RowForm resourceKey={resourceKey} row={row} options={options} onDone={() => setOpen(null)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RowForm({
  resourceKey,
  row,
  options,
  onDone,
}: {
  resourceKey: string;
  row: Row | null;
  options: Record<string, Option[]>;
  onDone: () => void;
}) {
  const res = resourceFor(resourceKey)!;
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => initialValues(res.fields, row));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (name: string, v: string | boolean) => setValues((s) => ({ ...s, [name]: v }));

  function save() {
    setError(null);
    // datetime-local is the editor's local time; send a real instant.
    const out: Values = { ...values };
    for (const f of res.fields) {
      if (f.type === "datetime" && typeof out[f.name] === "string" && out[f.name]) {
        out[f.name] = new Date(out[f.name] as string).toISOString();
      }
    }
    start(async () => {
      const r = await saveRow(resourceKey, row ? String(row.id) : null, out);
      if ("error" in r) return setError(r.error);
      router.refresh();
      onDone();
    });
  }

  function remove() {
    if (!row || !confirm(`Delete this ${res.singular}? This can't be undone.`)) return;
    setError(null);
    start(async () => {
      const r = await deleteRow(resourceKey, String(row.id));
      if ("error" in r) return setError(r.error);
      router.refresh();
      onDone();
    });
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {res.fields.map((f) => {
          if (f.showWhen && !f.showWhen.in.includes(String(values[f.showWhen.field] ?? ""))) return null;
          const id = `${resourceKey}-${row ? String(row.id) : "new"}-${f.name}`;
          const v = values[f.name];
          if (f.type === "checkbox") {
            return (
              <label key={f.name} htmlFor={id} className="flex items-center gap-2.5 self-end py-2 text-[13px]">
                <input id={id} type="checkbox" checked={v === true} onChange={(e) => set(f.name, e.target.checked)} className="size-4 accent-[var(--df-gold)]" />
                {f.label}
              </label>
            );
          }
          const list = f.options ?? (f.optionsFrom ? options[f.optionsFrom] : undefined);
          return (
            <div key={f.name} className={f.wide || f.type === "textarea" ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className={labelCls}>
                {f.label}
                {f.required && <span className="text-gold"> *</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea id={id} rows={4} value={String(v ?? "")} onChange={(e) => set(f.name, e.target.value)} className={`${input} resize-y`} />
              ) : f.type === "select" ? (
                <select id={id} value={String(v ?? "")} onChange={(e) => set(f.name, e.target.value)} className={input}>
                  {!f.required && <option value="">None</option>}
                  {f.required && !v && <option value="">Choose…</option>}
                  {list?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  type={f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"}
                  value={String(v ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                  className={input}
                />
              )}
              {f.upload && (
                <UploadButton
                  spec={f.upload}
                  onUploaded={(urls) =>
                    set(f.name, f.upload!.mode === "append" ? [String(v ?? "").trim(), ...urls].filter(Boolean).join("\n") : urls[urls.length - 1])
                  }
                />
              )}
              {f.help && <p className="mt-1 text-[11px] text-muted">{f.help}</p>}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-4 rounded border border-red/30 bg-red-dim px-3 py-2 text-[13px] text-red">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {row ? "Save changes" : `Add ${res.singular}`}
        </button>
        <button type="button" onClick={onDone} className="text-[13px] text-muted hover:text-ink">
          Cancel
        </button>
        {row && (
          <button type="button" onClick={remove} disabled={pending} className="ml-auto text-[12px] text-red hover:underline">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Uploads files (to the cheat-sheets bucket, which takes images and PDFs up
 * to 10 MB) and hands back each public link, one by one, in the order picked.
 */
function UploadButton({ spec, onUploaded }: { spec: NonNullable<Field["upload"]>; onUploaded: (urls: string[]) => void }) {
  const { upload, uploading, error } = useUpload();
  const [count, setCount] = useState(0);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border px-3 py-1.5 text-[12px] font-semibold hover:bg-surface-1">
        {uploading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
        {uploading ? "Uploading…" : (spec.label ?? "Upload")}
        <input
          type="file"
          accept={spec.accept}
          multiple={spec.mode === "append"}
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            // Upload in the order picked, then hand all links back at once.
            const urls: string[] = [];
            for (const file of files) {
              const url = await upload(file, "cheat-sheets");
              if (url) urls.push(url);
            }
            if (urls.length) {
              onUploaded(urls);
              setCount((n) => n + urls.length);
            }
          }}
        />
      </label>
      {count > 0 && !uploading && <span className="text-[11px] text-teal">{count} uploaded. Save to keep {count === 1 ? "it" : "them"}.</span>}
      {error && <span className="text-[11px] text-red">{error}</span>}
    </div>
  );
}
