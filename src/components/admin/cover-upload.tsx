"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useUpload } from "@/components/admin/use-upload";

/** Cover image: drag-drop or click to upload, with a live thumbnail. The URL
 *  is mirrored into a hidden input so the surrounding <form> still submits it. */
export function CoverUpload({ name, defaultUrl }: { name: string; defaultUrl: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [dragging, setDragging] = useState(false);
  const { upload, uploading, error } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    const uploaded = await upload(file);
    if (uploaded) setUrl(uploaded);
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="group relative overflow-hidden rounded-md border border-border">
          <Image
            src={url}
            alt="Cover preview"
            width={320}
            height={180}
            unoptimized
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="Remove cover image"
            className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded bg-bg/80 text-muted backdrop-blur hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files[0]);
          }}
          className={`flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-[12px] transition-colors ${
            dragging ? "border-gold bg-gold-dim text-gold" : "border-border text-muted hover:border-border-strong"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="size-5" />
              Drop an image or click to upload
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {error && <p className="mt-1.5 text-[11px] text-red">{error}</p>}
    </div>
  );
}
