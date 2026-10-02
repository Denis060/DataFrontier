import Link from "next/link";
import { requireStaff } from "@/lib/admin";
import { getCommentsOnMyPieces } from "@/lib/workspace";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "Comments on your pieces | Newsroom", robots: { index: false } };

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * What readers are saying across a writer's published pieces, in one place.
 * Replies happen on the article itself, in context.
 */
export default async function ResponsesPage() {
  const profile = await requireStaff();
  const { comments, waiting } = await getCommentsOnMyPieces(profile.id);

  return (
    <AdminShell role={profile.role} name={profile.full_name}>
      <div className="mx-auto w-full max-w-[760px] px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="font-serif text-[28px] font-black tracking-[-0.5px] sm:text-3xl">Comments on your pieces</h1>
        <p className="mt-1 text-[13px] text-muted">
          Reply on the article so the conversation stays in context.
          {waiting > 0 && ` ${waiting} more ${waiting === 1 ? "is" : "are"} waiting for an editor to approve.`}
        </p>

        {comments.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-[14px] text-muted">
            No comments yet. Ending a piece with a question readers can answer is a good way to start a
            conversation.
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-bg2 p-4">
                <p className="text-[12px] text-muted">
                  {c.whoSlug ? (
                    <Link href={`/author/${c.whoSlug}`} className="font-semibold text-ink hover:text-gold">
                      {c.who}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink">{c.who}</span>
                  )}{" "}
                  {c.isReply ? "replied on" : "commented on"}{" "}
                  <Link href={`/article/${c.article.slug}`} className="text-ink hover:text-gold">
                    {c.article.title}
                  </Link>{" "}
                  · {day(c.at)}
                </p>
                <p className="mt-2 line-clamp-4 text-[14px] leading-relaxed whitespace-pre-wrap">{c.body}</p>
                <Link
                  href={`/article/${c.article.slug}#comments`}
                  className="mt-3 inline-flex w-full items-center justify-center rounded border border-border px-3 py-2 text-[12px] font-semibold hover:border-border-strong hover:bg-surface-1 sm:w-auto"
                >
                  Reply on the article →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
