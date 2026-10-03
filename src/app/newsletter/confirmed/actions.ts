"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { cleanSurvey } from "@/lib/free-offers";

export type SurveyState = { ok: boolean } | null;

/**
 * Saves the optional post-confirmation survey. The confirm token (from the
 * subscriber's own email link) identifies them; only known answers are kept.
 */
export async function saveSurvey(_prev: SurveyState, formData: FormData): Promise<SurveyState> {
  const token = String(formData.get("t") ?? "");
  if (!token) return { ok: false };
  const answers = cleanSurvey(Object.fromEntries(formData.entries()));
  if (Object.keys(answers).length === 0) return { ok: true };

  const db = createAdminClient();
  const { error } = await db
    .from("newsletter_subscribers")
    .update({ survey: answers, survey_at: new Date().toISOString() })
    .eq("confirm_token", token)
    .eq("status", "confirmed");
  return { ok: !error };
}
