import { ImageResponse } from "next/og";
import { getArticle } from "@/lib/queries";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Data Frontier";

/** A branded OG card generated per article, used when no cover image is set
 *  (and as a consistent share image everywhere). */
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  const title = article?.title ?? "The Data Frontier";
  const category = article?.category?.name ?? "Agentic AI · Data Science";
  const author = article?.author?.full_name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080a0e",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 900, color: "#e8eaf0" }}>
          <span>The Data</span>
          <span style={{ color: "#d4a853" }}>Frontier</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#2dd4bf",
              fontFamily: "monospace",
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: title.length > 70 ? 56 : 68,
              fontWeight: 900,
              lineHeight: 1.08,
              color: "#e8eaf0",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", color: "#8b93a3", fontSize: 26 }}>
          <span>{author ? `By ${author}` : "datafrontier.vercel.app"}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
