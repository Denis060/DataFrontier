import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DeskPiece = {
  id: string;
  title: string;
  writer: string;
  avatar: string | null;
  /** When it was last sent (updated_at while in review). */
  since: string;
  revised: boolean;
  note: string | null;
};

export type DeskPitch = { id: string; name: string; topics: string; since: string };

export type Desk = {
  review: DeskPiece[];
  pitches: DeskPitch[];
  pitchCount: number;
  comments: number;
  /** Sent back and waiting on the writer: not the editor's move, but worth seeing. */
  withWriters: number;
};

/** Everything waiting on the editor, oldest first, for the top of the overview. */
export async function getEditorDesk(): Promise<Desk> {
  const db = await createClient();
  const head = { count: "exact" as const, head: true };
  const [review, pitches, comments, withWriters] = await Promise.all([
    db
      .from("articles")
      .select("id, title, updated_at, author_note, review_snapshot, writer:profiles!articles_author_id_fkey(full_name, avatar_url)")
      .eq("status", "in_review")
      .order("updated_at", { ascending: true }),
    db
      .from("author_applications")
      .select("id, topics, created_at, applicant:profiles!author_applications_profile_id_fkey(full_name)", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(3),
    db.from("comments").select("id", head).eq("is_approved", false),
    db.from("articles").select("id", head).eq("status", "changes_requested"),
  ]);

  type Writer = { full_name: string | null; avatar_url: string | null } | null;
  type Applicant = { full_name: string | null } | null;
  return {
    review: (review.data ?? []).map((a) => {
      const w = a.writer as unknown as Writer;
      return {
        id: a.id,
        title: a.title,
        writer: w?.full_name ?? "Unknown writer",
        avatar: w?.avatar_url ?? null,
        since: a.updated_at,
        revised: !!(a.review_snapshot || a.author_note),
        note: a.author_note ?? null,
      };
    }),
    pitches: (pitches.data ?? []).map((p) => ({
      id: p.id,
      name: (p.applicant as unknown as Applicant)?.full_name ?? "Someone",
      topics: p.topics ?? "",
      since: p.created_at,
    })),
    pitchCount: pitches.count ?? 0,
    comments: comments.count ?? 0,
    withWriters: withWriters.count ?? 0,
  };
}
