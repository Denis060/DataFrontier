"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { resourceFor, slugify, type Field, type Resource } from "@/lib/managed";

export type ManageResult = { error: string } | { ok: true };
type Value = string | boolean | null;

async function gate(key: string): Promise<{ res: Resource; profileId: string } | { error: string }> {
  const profile = await requireStaff();
  const res = resourceFor(key);
  if (!res) return { error: "Unknown section." };
  if (!hasRole(profile.role, res.roles)) return { error: "You don't have access to this section." };
  return { res, profileId: profile.id };
}

/** Turn one submitted value into what the column expects, or explain why not. */
function coerce(f: Field, raw: Value): { value: unknown } | { error: string } {
  if (f.type === "checkbox") return { value: raw === true || raw === "on" || raw === "true" };

  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) {
    if (f.required) return { error: `${f.label} is required.` };
    return { value: f.type === "tags" ? [] : null };
  }
  switch (f.type) {
    case "number": {
      const n = Number(s);
      return Number.isFinite(n) ? { value: Math.trunc(n) } : { error: `${f.label} must be a number.` };
    }
    case "url":
      return /^https?:\/\/\S+$/i.test(s) ? { value: s } : { error: `${f.label} must be a full link starting with https://` };
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? { value: s } : { error: `${f.label} must be a date.` };
    case "datetime":
      return Number.isNaN(Date.parse(s)) ? { error: `${f.label} must be a date and time.` } : { value: new Date(s).toISOString() };
    case "select":
      if (f.options && !f.options.some((o) => o.value === s)) return { error: `Pick a valid ${f.label.toLowerCase()}.` };
      return { value: s };
    case "tags":
      return { value: s.split(",").map((t) => t.trim()).filter(Boolean) };
    default:
      return { value: s };
  }
}

function friendly(message: string): string {
  if (message.includes("duplicate key")) return "Something with that slug or name already exists. Try a different one.";
  if (message.includes("violates foreign key")) return "That item is still in use elsewhere, so it can't be changed this way.";
  if (message.includes("row-level security") || message.includes("42501")) return "You don't have permission to do that.";
  return message;
}

function refresh(res: Resource) {
  revalidatePath(`/admin/manage/${res.key}`);
  for (const p of res.revalidate) {
    if (p === "layout") revalidatePath("/", "layout");
    else revalidatePath(p);
  }
}

/** Create (no id) or update one row. Only the resource's declared fields are written. */
export async function saveRow(key: string, id: string | null, values: Record<string, Value>): Promise<ManageResult> {
  const g = await gate(key);
  if ("error" in g) return g;
  const { res, profileId } = g;

  const row: Record<string, unknown> = {};
  for (const f of res.fields) {
    let raw = values[f.name] ?? null;
    if (f.slugFrom && (typeof raw !== "string" || !raw.trim())) {
      const from = values[f.slugFrom];
      raw = typeof from === "string" ? slugify(from) : null;
    } else if (f.slugFrom && typeof raw === "string") {
      raw = slugify(raw);
    }
    const c = coerce(f, raw);
    if ("error" in c) return c;
    row[f.name] = c.value;
  }
  if (!id && res.stampCreator) row[res.stampCreator] = profileId;

  const db = await createClient();
  // The table name comes from the static config, never from the request.
  const table = db.from(res.table as never) as unknown as {
    insert: (r: unknown) => Promise<{ error: { message: string } | null }>;
    update: (r: unknown) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
  };
  const { error } = id ? await table.update(row).eq("id", id) : await table.insert(row);
  if (error) return { error: friendly(error.message) };

  refresh(res);
  return { ok: true };
}

export async function deleteRow(key: string, id: string): Promise<ManageResult> {
  const g = await gate(key);
  if ("error" in g) return g;
  const db = await createClient();
  const table = db.from(g.res.table as never) as unknown as {
    delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
  };
  const { error } = await table.delete().eq("id", id);
  if (error) return { error: friendly(error.message) };
  refresh(g.res);
  return { ok: true };
}
