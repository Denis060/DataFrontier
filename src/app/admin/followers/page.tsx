import Link from "next/link";
import { requireStaff } from "@/lib/admin";
import { getFollowers } from "@/lib/workspace";
import { AdminShell } from "@/components/admin/admin-shell";
import { AuthorAvatar } from "@/components/author-avatar";

export const metadata = { title: "Followers | Newsroom", robots: { index: false } };

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** The people following you as a writer. Names and public pages only, never emails. */
export default async function FollowersPage() {
  const profile = await requireStaff();
  const followers = await getFollowers(profile.id);

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="w-full max-w-[1440px] px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="font-serif text-[28px] font-black tracking-[-0.5px] sm:text-3xl">Followers</h1>
        <p className="mt-1 text-[13px] text-muted">
          {followers.length === 0
            ? "Nobody follows you yet."
            : `${followers.length} ${followers.length === 1 ? "person follows" : "people follow"} you. They're notified when you publish.`}
        </p>

        {followers.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-[14px] text-muted">
            Readers can follow you from your author page and from the &ldquo;About the writer&rdquo; box under
            each of your articles. Sharing your pieces is the fastest way to grow this.
          </div>
        ) : (
          <ul className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border bg-bg2">
            {followers.map((f, i) => {
              const inner = (
                <>
                  <AuthorAvatar name={f.name} src={f.avatar} className="size-10 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{f.name}</span>
                    {f.title && <span className="block truncate text-[12px] text-muted">{f.title}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">since {day(f.since)}</span>
                </>
              );
              return (
                <li key={`${f.name}-${i}`}>
                  {f.slug ? (
                    <Link href={`/author/${f.slug}`} className="flex items-center gap-3 p-4 hover:bg-surface-1">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 p-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
