"use client";

import { useRef, useState, useTransition } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { saveResource, deleteResource } from "@/app/admin/resources/actions";

export type Resource = {
  id: string;
  title: string;
  emoji: string | null;
  description: string | null;
  url: string;
  cta_label: string | null;
  sort_order: number;
  is_active: boolean;
};

const field =
  "w-full rounded border border-border bg-surface-1 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/40 focus:bg-surface-2";
const label = "mb-1 block font-mono text-[10px] uppercase tracking-[1.5px] text-muted";

/** The edit form — shared by an existing row (expanded) and the "add" panel. */
function ResourceFields({ resource, onSaved }: { resource?: Resource; onSaved?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const data = new FormData(formRef.current!);
    startSave(async () => {
      const res = await saveResource(data);
      if ("error" in res) setMsg({ ok: false, text: res.error });
      else {
        setMsg({ ok: true, text: "Saved." });
        onSaved?.();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSave} className="border-t border-border px-4 py-4">
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <div className="flex gap-3">
        <div className="w-16 shrink-0">
          <label className={label}>Emoji</label>
          <input name="emoji" defaultValue={resource?.emoji ?? ""} placeholder="📘" className={`${field} text-center`} />
        </div>
        <div className="flex-1">
          <label className={label}>Title *</label>
          <input name="title" defaultValue={resource?.title ?? ""} required className={field} />
        </div>
        <div className="w-20 shrink-0">
          <label className={label}>Order</label>
          <input name="sort_order" type="number" defaultValue={resource?.sort_order ?? 0} className={field} />
        </div>
      </div>

      <div className="mt-3">
        <label className={label}>Description</label>
        <textarea name="description" rows={2} defaultValue={resource?.description ?? ""} className={`${field} resize-none`} />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={label}>Link URL *</label>
          <input name="url" defaultValue={resource?.url ?? ""} required placeholder="https://…" className={`${field} font-mono text-[12px]`} />
        </div>
        <div className="w-full shrink-0 sm:w-40">
          <label className={label}>Button label</label>
          <input name="cta_label" defaultValue={resource?.cta_label ?? ""} placeholder="Learn more" className={field} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" name="is_active" defaultChecked={resource ? resource.is_active : true} className="size-4 accent-gold" />
          Show on homepage
        </label>
        <button type="submit" disabled={saving} className="rounded bg-gold px-4 py-2 text-[13px] font-bold text-on-accent hover:opacity-85 disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        {resource && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (confirm(`Delete “${resource.title}”?`)) startDelete(() => deleteResource(resource.id));
            }}
            className="inline-flex items-center gap-1.5 rounded border border-red/40 px-3 py-2 text-[12px] text-red hover:bg-red-dim disabled:opacity-50"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        )}
        {msg && <span className={`text-[12px] ${msg.ok ? "text-teal" : "text-red"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

/** A collapsed row that expands to the edit form on click. */
function ResourceRow({ resource }: { resource: Resource }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border bg-bg2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        <span className="text-lg">{resource.emoji || "🔗"}</span>
        <span className="min-w-0 flex-1 truncate font-serif text-[15px] font-bold">{resource.title}</span>
        {!resource.is_active && (
          <span className="shrink-0 rounded-[3px] bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1px] text-muted">
            hidden
          </span>
        )}
        <span className="shrink-0 font-mono text-[11px] text-muted">#{resource.sort_order}</span>
      </button>
      {open && <ResourceFields resource={resource} />}
    </div>
  );
}

export function ResourcesManager({ resources }: { resources: Resource[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      {resources.map((r) => (
        <ResourceRow key={r.id} resource={r} />
      ))}

      {adding ? (
        <div className="rounded-md border border-gold/30 bg-bg2">
          <p className="px-4 pt-3 font-mono text-[10px] uppercase tracking-[1.5px] text-gold">New resource</p>
          <ResourceFields onSaved={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 self-start rounded border border-dashed border-border px-4 py-2.5 text-[13px] font-medium text-muted hover:border-border-strong hover:text-ink"
        >
          <Plus className="size-4" /> Add resource
        </button>
      )}
    </div>
  );
}
