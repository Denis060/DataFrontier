"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/admin";
import { hasRole } from "@/lib/auth";

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};

/** Save the core site settings. Admin only. */
export async function saveSettings(fd: FormData): Promise<{ error: string } | { ok: true }> {
  const me = await requireStaff();
  if (!hasRole(me.role, ["admin"])) return { error: "Only an admin can change site settings." };

  const yearRaw = str(fd, "established_year");
  const year = yearRaw ? Number(yearRaw) : null;
  if (yearRaw && (Number.isNaN(year) || year! < 1900 || year! > 2200)) {
    return { error: "Established year looks off." };
  }

  const siteName = str(fd, "site_name"); // NOT NULL column — must be present
  if (!siteName) return { error: "Site name can't be empty." };

  const fields = {
    site_name: siteName,
    tagline: str(fd, "tagline"),
    established_year: year,
    contact_email: str(fd, "contact_email"),
    default_meta_title: str(fd, "default_meta_title"),
    default_meta_description: str(fd, "default_meta_description"),
    newsletter_headline: str(fd, "newsletter_headline"),
    newsletter_subtext: str(fd, "newsletter_subtext"),
    newsletter_show_stats: fd.get("newsletter_show_stats") === "on",
    spotlight_headline: str(fd, "spotlight_headline"),
    spotlight_body: str(fd, "spotlight_body"),
    spotlight_cta_url: str(fd, "spotlight_cta_url"),
  };

  const db = await createClient();
  const { error } = await db.from("site_settings").update(fields).eq("id", true);
  if (error) return { error: error.message };

  revalidatePath("/", "layout"); // brand shows site-wide
  revalidatePath("/admin/settings");
  return { ok: true };
}
