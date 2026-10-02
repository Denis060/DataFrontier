"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { checkStyle } from "@/lib/style-check";
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from "@/lib/seo-title";

type Line = { ok: boolean; label: string; detail?: string; field?: string; blocking?: boolean };

const CONFIRMS = [
  "My sources are real, linked, and I've read them.",
  "I say what doesn't work, or what would prove me wrong.",
];

/**
 * The last look before a piece goes to the editor: what the machine can
 * check (fields, links, house style), plus two things only the writer can
 * vouch for. Only a missing category or format blocks; everything else is a
 * warning the writer may send anyway.
 */
export function SubmitCheck({
  form,
  body,
  onCancel,
  onConfirm,
}: {
  form: HTMLFormElement;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [ticked, setTicked] = useState<boolean[]>(CONFIRMS.map(() => false));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const lines = useMemo<Line[]>(() => {
    const val = (n: string) => ((form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "").trim();
    const fixes = checkStyle(body).filter((i) => i.level !== "tip");
    const links = /\]\(https?:\/\/|(^|\s)https?:\/\//m.test(body.replace(/```[\s\S]*?```/g, ""));
    const metaTitle = val("meta_title");
    const metaDesc = val("meta_description");
    return [
      { ok: !!val("title"), label: "Headline", field: "title", blocking: true, detail: "Add a headline." },
      { ok: !!val("category_id"), label: "Category chosen", field: "category_id", blocking: true, detail: "Pick a category." },
      { ok: !!val("format_id"), label: "Format chosen", field: "format_id", blocking: true, detail: "Pick a format." },
      { ok: !!val("cover_image"), label: "Cover image", field: "cover", detail: "Pieces with a cover get more clicks. 16:9 works best." },
      { ok: !!val("excerpt"), label: "Excerpt", field: "excerpt", detail: "One or two lines shown on cards and in search." },
      { ok: links, label: "Sources linked in the text", detail: "Link the paper, dataset or benchmark behind each claim." },
      {
        ok: fixes.length === 0,
        label: "House style",
        detail: fixes.length ? fixes.map((f) => f.title).join(" · ") : undefined,
      },
      {
        ok: metaTitle.length <= TITLE_LIMIT && metaDesc.length <= DESCRIPTION_LIMIT,
        label: "SEO title and description fit",
        field: metaTitle.length > TITLE_LIMIT ? "meta_title" : "meta_description",
        detail: `Title ${metaTitle.length}/${TITLE_LIMIT}, description ${metaDesc.length}/${DESCRIPTION_LIMIT}. Google cuts anything longer.`,
      },
    ];
  }, [form, body]);

  const blocked = lines.some((l) => l.blocking && !l.ok);
  const warnings = lines.filter((l) => !l.ok && !l.blocking).length;
  const confirmed = ticked.every(Boolean);

  function goTo(field?: string) {
    onCancel();
    if (!field) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(field) ?? (form.elements.namedItem(field) as HTMLElement | null);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el && "focus" in el) (el as HTMLElement).focus({ preventScroll: true });
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-check-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-t-xl border border-border bg-bg p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-gold">Before you send it</p>
            <h2 id="submit-check-title" className="mt-1 font-serif text-xl font-black">
              {blocked ? "A couple of things are missing" : warnings ? "Nearly there" : "Ready for the editor"}
            </h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded p-1.5 text-muted hover:bg-surface-1 hover:text-ink">
            <X className="size-4" />
          </button>
        </div>

        <ul className="mt-4 flex flex-col divide-y divide-border rounded-md border border-border">
          {lines.map((l) => (
            <li key={l.label} className="flex items-start gap-3 px-3 py-2.5 text-[13px]">
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                  l.ok ? "bg-teal-dim text-teal" : l.blocking ? "bg-red-dim text-red" : "bg-gold-dim text-gold"
                }`}
                aria-hidden
              >
                {l.ok ? <Check className="size-3" /> : l.blocking ? <X className="size-3" /> : <AlertTriangle className="size-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={l.ok ? "text-muted" : "font-semibold"}>{l.label}</p>
                {!l.ok && l.detail && <p className="mt-0.5 text-[12px] text-muted">{l.detail}</p>}
              </div>
              {!l.ok && l.field && (
                <button type="button" onClick={() => goTo(l.field)} className="shrink-0 text-[12px] font-semibold text-gold hover:underline">
                  Fix
                </button>
              )}
            </li>
          ))}
        </ul>

        <fieldset className="mt-4">
          <legend className="mb-2 text-[13px] font-semibold">Only you can confirm these</legend>
          {CONFIRMS.map((c, i) => (
            <label key={c} className="flex cursor-pointer items-start gap-2.5 py-1 text-[13px]">
              <input
                type="checkbox"
                checked={ticked[i]}
                onChange={(e) => setTicked((t) => t.map((v, k) => (k === i ? e.target.checked : v)))}
                className="mt-0.5 size-4 accent-[var(--df-gold)]"
              />
              {c}
            </label>
          ))}
        </fieldset>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded border border-border px-4 py-2.5 text-[13px] font-semibold hover:bg-surface-1">
            Keep editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={blocked || !confirmed}
            className="rounded bg-gold px-4 py-2.5 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {warnings && !blocked ? "Send anyway" : "Send to the editor"}
          </button>
        </div>
        {blocked && <p className="mt-2 text-right text-[11px] text-red">Category and format are needed before review.</p>}
      </div>
    </div>
  );
}
