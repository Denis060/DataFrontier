import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { resourceFor } from "@/lib/managed";
import { AdminShell } from "@/components/admin/admin-shell";
import { Manager, type Option } from "@/components/admin/manager";

export const metadata = { title: "Site content | Newsroom", robots: { index: false } };

export default async function ManagePage({ params }: { params: Promise<{ resource: string }> }) {
  const [profile, { resource }] = await Promise.all([requireStaff(), params]);
  const res = resourceFor(resource);
  if (!res) notFound();
  if (!hasRole(profile.role, res.roles)) redirect("/admin/manage");

  const db = await createClient();
  const columns = ["id", ...res.fields.map((f) => f.name)].join(", ");
  let q = db.from(res.table as never).select(columns);
  for (const o of res.orderBy) q = q.order(o.column as never, { ascending: o.ascending });

  const needs = new Set(res.fields.map((f) => f.optionsFrom).filter(Boolean));
  const [{ data, error }, articles, categories] = await Promise.all([
    q,
    needs.has("articles")
      ? db.from("articles").select("id, title, status").order("published_at", { ascending: false, nullsFirst: false })
      : Promise.resolve({ data: null }),
    needs.has("categories") ? db.from("categories").select("id, name").order("sort_order") : Promise.resolve({ data: null }),
  ]);
  if (error) throw new Error(`Loading ${res.title} failed: ${error.message}`);

  const options: Record<string, Option[]> = {
    articles: (articles.data ?? []).map((a) => ({
      value: a.id,
      label: a.status === "published" ? a.title : `${a.title} (${a.status.replace("_", " ")})`,
    })),
    categories: (categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
  };

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="w-full max-w-[1200px] px-5 py-10 sm:px-8">
        <Link href="/admin/manage" className="text-[13px] text-muted hover:text-ink">
          ← Site content
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-black tracking-[-0.5px]">{res.title}</h1>
        <p className="mt-1 text-[13px] text-muted">{res.description}</p>
        {res.note && (
          <p className="mt-4 rounded border border-gold/30 bg-gold-dim px-4 py-2.5 text-[13px]">{res.note}</p>
        )}
        <Manager resourceKey={res.key} rows={(data ?? []) as unknown as Record<string, unknown>[]} options={options} />
      </div>
    </AdminShell>
  );
}
