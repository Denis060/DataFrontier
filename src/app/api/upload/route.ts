import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024; // must match the bucket's file_size_limit
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Accepts a single image and stores it in the article-images bucket. Auth is
 * checked here AND enforced by storage RLS — the route is the friendly error,
 * the policy is the real gate.
 */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !hasRole(profile.role, ["admin", "editor", "author"])) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported type. Use JPEG, PNG, WebP, GIF, or AVIF." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image exceeds the 5 MB limit." }, { status: 413 });
  }

  // Path: <uid>/<year>/<uuid>.<ext>. The uid prefix keeps one author's uploads
  // together; the uuid makes the name unguessable and collision-free.
  const year = new Date().getUTCFullYear();
  const path = `${profile.id}/${year}/${crypto.randomUUID()}.${ext}`;

  const db = await createClient();
  const { error } = await db.storage
    .from("article-images")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = db.storage.from("article-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
