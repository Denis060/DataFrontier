"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
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

function ResourceForm({ resource, onSaved }: { resource?: Resource; onSaved?: () => void }) {
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
    <form ref={formRef} onSubmit={onSave} className="rounded-md border border-border bg-bg2 p-4">
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

      <div className="mt-3 flex gap-3">
        <div className="flex-1">
          <label className={label}>Link URL *</label>
          <input name="url" defaultValue={resource?.url ?? ""} required placeholder="https://…" className={`${field} font-mono text-[12px]`} />
        </div>
        <div className="w-40 shrink-0">
          <label className={label}>Button label</label>
          <input name="cta_label" defaultValue={resource?.cta_label ?? ""} placeholder="Learn more" className={field} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
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

export function ResourcesManager({ resources }: { resources: Resource[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {resources.map((r) => (
        <ResourceForm key={r.id} resource={r} />
      ))}

      {adding ? (
        <ResourceForm onSaved={() => setAdding(false)} />
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
