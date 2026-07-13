import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, hasRole } from "@/lib/auth";

// Per-bucket size limits (must match the storage migration) and the extra
// types some buckets allow. Only these buckets are writable through here.
const BUCKETS: Record<string, { maxBytes: number; extraTypes?: Record<string, string>; anyUser?: boolean }> = {
  "article-images": { maxBytes: 5 * 1024 * 1024 },
  "cheat-sheets": {
    maxBytes: 10 * 1024 * 1024,
    extraTypes: { "application/pdf": "pdf" },
  },
  // Any signed-in user may upload their own avatar (storage RLS scopes it to
  // their own folder).
  avatars: { maxBytes: 2 * 1024 * 1024, anyUser: true },
};

const IMAGE_TYPES: Record<string, string> = {
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
  if (!profile) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const bucketName = (form?.get("bucket") as string) || "article-images";
  const bucket = BUCKETS[bucketName];
  if (!bucket) {
    return NextResponse.json({ error: "Unknown upload target." }, { status: 400 });
  }
  // Staff-only buckets; avatars are open to any signed-in user.
  if (!bucket.anyUser && !hasRole(profile.role, ["admin", "editor", "author"])) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const allowed = { ...IMAGE_TYPES, ...(bucket.extraTypes ?? {}) };
  const ext = allowed[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }
  if (file.size > bucket.maxBytes) {
    return NextResponse.json(
      { error: `File exceeds the ${bucket.maxBytes / 1024 / 1024} MB limit.` },
      { status: 413 },
    );
  }

  // Path: <uid>/<year>/<uuid>.<ext>. The uid prefix keeps one author's uploads
  // together; the uuid makes the name unguessable and collision-free.
  const year = new Date().getUTCFullYear();
  const path = `${profile.id}/${year}/${crypto.randomUUID()}.${ext}`;

  const db = await createClient();
  const { error } = await db.storage
    .from(bucketName)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = db.storage.from(bucketName).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
