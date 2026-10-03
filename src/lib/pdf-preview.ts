"use client";

/**
 * Renders the first page of a PDF to a PNG in the browser, for a cheat
 * sheet's preview image. pdf.js is loaded only when a PDF is picked, so it
 * never weighs on other pages.
 */
export async function pdfFirstPageToPng(file: File, targetWidth = 1600): Promise<File> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(4, targetWidth / base.width) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas");
    // PDFs assume a white page; transparent areas would show the site background.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("Couldn't draw the page");
    return new File([blob], file.name.replace(/\.pdf$/i, "") + "-preview.png", { type: "image/png" });
  } finally {
    await doc.destroy();
  }
}
