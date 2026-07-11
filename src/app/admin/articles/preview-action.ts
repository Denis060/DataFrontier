"use server";

import { requireStaff } from "@/lib/admin";
import { ArticleBody } from "@/components/article/article-body";

/**
 * Compiles MDX with the exact renderer the public article page uses, so the
 * preview cannot drift from production. Returns a React node the client slots
 * in. Errors (a half-typed JSX tag) come back as a message, not a crash.
 */
export async function renderPreview(source: string) {
  await requireStaff();
  try {
    return { node: await ArticleBody({ source }), error: null as string | null };
  } catch (e) {
    return { node: null, error: e instanceof Error ? e.message : "Could not render MDX." };
  }
}
