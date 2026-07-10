"use client";

import { useState } from "react";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File, bucket?: string): Promise<string | null> {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      if (bucket) body.append("bucket", bucket);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        return null;
      }
      return json.url as string;
    } catch {
      setError("Upload failed — check your connection.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
