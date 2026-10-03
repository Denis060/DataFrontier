"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";
import { isTrusted } from "@/lib/trust";
import { articlePublishedEmail, changesRequestedEmail, reviewSubmittedEmail } from "@/lib/email";
import { newsroomInbox, notify, personFor } from "@/lib/notify";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** What the button asked for. Saving keeps the current status. */
type Intent = "save" | "submit" | "publish" | "unpublish" | "send_back";
const INTENTS: Intent[] = ["save", "submit", "publish", "unpublish", "send_back"];

/**
 * Cheat sheets follow the article review loop: writers submit, an editor (or
 * the writer, if an admin marked them trusted) publishes. The DB trigger from
 * migration 20261008120000 enforces the same rules underneath.
 */
export async function saveCheatSheet(formData: FormData): Promise<{ error: string } | never> {
  const profile = await requireStaff();
  const db = await createClient();
  const staff = hasRole(profile.role, ["admin", "editor"]);
  const canPublish = staff || (await isTrusted(profile.id));

  const id = (formData.get("id") as string) || null;
  const intent = (INTENTS as string[]).includes(formData.get("intent") as string) ? (formData.get("intent") as Intent) : "save";
  const title = (formData.get("title") as string)?.trim();
  const imageUrl = (formData.get("image_url") as string)?.trim();
  if (!title) return { error: "Title is required." };
  if (!imageUrl) return { error: "Upload the cheat sheet (an image or a PDF) first." };

  const download = ((formData.get("download_url") as string) || "").trim();
  if (download && !/^https:\/\/\S+$/i.test(download)) {
    return { error: "The download link must be a full link starting with https://" };
  }

  const existing = id
    ? (await db.from("cheat_sheets").select("status, author_id, slug").eq("id", id).maybeSingle()).data
    : null;
  const current = existing?.status ?? "draft";
  if (current === "published" && !canPublish) {
    return { error: "This cheat sheet is live. Ask an editor to change it." };
  }
  if ((intent === "publish" || intent === "unpublish") && !canPublish) {
    return { error: "Only an editor can publish. Submit it for review instead." };
  }
  if (intent === "send_back" && !staff) return { error: "Only an editor can send a cheat sheet back." };

  const status =
    intent === "submit" ? "in_review" : intent === "publish" ? "published" : intent === "unpublish" ? "draft" : intent === "send_back" ? "changes_requested" : current;

  const rawSlug = (formData.get("slug") as string)?.trim();
  const fields = {
    title,
    slug: rawSlug ? slugify(rawSlug) : slugify(title),
    description: ((formData.get("description") as string) || "").trim() || null,
    image_url: imageUrl,
    download_url: download || null,
    category_id: (formData.get("category_id") as string) || null,
    status,
    published: status === "published",
    ...(intent === "submit" ? { submitted_at: new Date().toISOString() } : {}),
    ...(intent === "send_back" ? { review_note: ((formData.get("review_note") as string) || "").trim() || null } : {}),
    ...(intent === "publish" ? { review_note: null } : {}),
  };

  let sheetId = id;
  let authorId = existing?.author_id ?? profile.id;
  if (id) {
    const { error } = await db.from("cheat_sheets").update(fields).eq("id", id);
    if (error) return { error: humanize(error.message) };
  } else {
    const { data, error } = await db.from("cheat_sheets").insert({ ...fields, author_id: profile.id }).select("id").single();
    if (error) return { error: humanize(error.message) };
    sheetId = data.id;
    authorId = profile.id;
  }

  // Close the loop by email, as for articles. Best-effort.
  if (status !== current || !id) {
    const editUrl = `${SITE}/admin/cheat-sheets/${sheetId}`;
    if (status === "in_review") {
      await notify(
        await newsroomInbox(),
        `Cheat sheet ready for review: ${title}`,
        reviewSubmittedEmail({ title, writer: profile.full_name, editUrl, resubmitted: current === "changes_requested" }),
      );
    } else if (authorId && authorId !== profile.id) {
      const writer = await personFor(authorId);
      if (status === "changes_requested") {
        await notify(writer.email, `Changes requested: ${title}`, changesRequestedEmail({ name: writer.name, title, note: fields.review_note ?? null, editUrl }));
      } else if (status === "published") {
        await notify(writer.email, `You're published: ${title}`, articlePublishedEmail({ name: writer.name, title, url: `${SITE}/cheat-sheets/${fields.slug}` }));
      }
    }
  }

  revalidatePath("/admin/cheat-sheets");
  revalidatePath("/cheat-sheets");
  revalidatePath(`/cheat-sheets/${fields.slug}`);
  revalidatePath("/admin");
  redirect(`/admin/cheat-sheets/${sheetId}?saved=${intent === "submit" ? "sent" : "1"}`);
}

export async function deleteCheatSheet(id: string): Promise<{ error: string } | never> {
  const profile = await requireStaff();
  const db = await createClient();
  // Writers can't take down a live sheet on their own either.
  if (!hasRole(profile.role, ["admin", "editor"]) && !(await isTrusted(profile.id))) {
    const { data } = await db.from("cheat_sheets").select("status").eq("id", id).maybeSingle();
    if (data?.status === "published") return { error: "This cheat sheet is live. Ask an editor to remove it." };
  }
  const { error } = await db.from("cheat_sheets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/cheat-sheets");
  revalidatePath("/cheat-sheets");
  redirect("/admin/cheat-sheets");
}

function humanize(message: string): string {
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "That slug is already taken. Choose a different one.";
  }
  return message;
}
