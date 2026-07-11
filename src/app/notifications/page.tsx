import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { markAllRead } from "./actions";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/notifications");

  const db = await createClient();
  const { data } = await db
    .from("notifications")
    .select("id, type, title, url, actor_name, is_read, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = data ?? [];
  const hasUnread = items.some((n) => !n.is_read);

  return (
    <Shell>
      <div className="mx-auto w-full max-w-[680px] px-5 py-12 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-black tracking-[-0.5px]">Notifications</h1>
          {hasUnread && (
            <form action={markAllRead}>
              <button type="submit" className="text-[13px] text-gold hover:underline">
                Mark all read
              </button>
            </form>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded border border-dashed border-border px-6 py-16 text-center">
            <Bell className="mx-auto mb-3 size-6 text-muted" aria-hidden />
            <p className="text-sm text-muted">
              Nothing yet. Follow an author or a topic and you&apos;ll hear when they publish.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.url.replace(/^https?:\/\/[^/]+/, "")}
                  className={`flex items-start gap-3 py-4 transition-colors hover:bg-surface-1 ${
                    n.is_read ? "" : "bg-gold-dim/40"
                  }`}
                >
                  {!n.is_read && <span className="mt-2 size-2 shrink-0 rounded-full bg-gold" />}
                  <div className={n.is_read ? "pl-5" : ""}>
                    <p className="text-[14px] leading-snug">
                      <span className="font-semibold">{n.actor_name}</span> published{" "}
                      <span className="font-serif font-bold">{n.title}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">{fmt(n.created_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
