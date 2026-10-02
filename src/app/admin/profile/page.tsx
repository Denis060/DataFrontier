import Link from "next/link";
import { Check } from "lucide-react";
import { requireStaff } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { AdminShell } from "@/components/admin/admin-shell";
import { AccountForm, type AccountProfile } from "@/components/account/account-form";

export const metadata = { title: "Your profile | Newsroom", robots: { index: false } };

/**
 * The writer's public profile, edited inside the workspace: what readers see
 * on their author page and under every piece. Same form as /account.
 */
export default async function ProfilePage() {
  const profile = await requireStaff();
  const db = await createClient();
  const [{ data: row }, { data: auth }, ws] = await Promise.all([
    db.from("profiles").select("full_name, title, bio, avatar_url, socials, slug").eq("id", profile.id).single(),
    db.auth.getUser(),
    getWorkspace(profile.id),
  ]);

  const data: AccountProfile = {
    full_name: row?.full_name ?? "",
    title: row?.title ?? "",
    bio: row?.bio ?? "",
    avatar_url: row?.avatar_url ?? "",
    socials: (row?.socials ?? {}) as AccountProfile["socials"],
  };
  const todo = ws.profile.checklist.filter((c) => !c.done);

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[680px] px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="font-serif text-[28px] font-black tracking-[-0.5px] sm:text-3xl">Your profile</h1>
        <p className="mt-1 text-[13px] text-muted">
          This is what readers see on your author page and in the &ldquo;About the writer&rdquo; box under
          each of your pieces.
          {row?.slug && (
            <>
              {" "}
              <Link href={`/author/${row.slug}`} target="_blank" className="font-semibold text-gold hover:underline">
                See your author page →
              </Link>
            </>
          )}
        </p>

        <section
          className={`mt-6 rounded-lg border p-4 ${todo.length ? "border-gold/40 bg-gold-dim" : "border-teal/30 bg-teal-dim"}`}
        >
          <p className="mb-2 text-[13px] font-semibold">
            {todo.length ? `${todo.length} thing${todo.length === 1 ? "" : "s"} would make your page stronger` : "Your author page is complete"}
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {ws.profile.checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-[12px]">
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                    c.done ? "border-teal bg-teal-dim text-teal" : "border-border text-transparent"
                  }`}
                  aria-hidden
                >
                  <Check className="size-2.5" />
                </span>
                <span className={c.done ? "text-muted line-through" : ""}>{c.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted">
            ORCID, Google Scholar and LinkedIn links also tell search engines your work is yours.
          </p>
        </section>

        <div className="mt-6">
          <AccountForm email={auth.user?.email ?? ""} profile={data} />
        </div>
      </div>
    </AdminShell>
  );
}
