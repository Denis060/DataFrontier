import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Everyday Data Science: Applied AI, Agentic Systems & AI in Africa";

/** Default branded share card, used for the homepage and any page that does not
 *  define its own OG image. */
export default function OgImage() {
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
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 900, color: "#e8eaf0" }}>
          <span>Everyday&nbsp;</span>
          <span style={{ color: "#d4a853" }}>Data Science</span>
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
            Applied AI · Agentic Systems · AI in Africa
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, color: "#e8eaf0", maxWidth: 1010 }}>
            Practical AI, machine learning &amp; data science for people who build.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", color: "#8b93a3", fontSize: 26 }}>
          <span>everydaydatascience.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
