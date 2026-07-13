import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes the site installable ("Add to Home Screen") and
 * app-like when launched. Pure metadata; it can't affect page loads.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Everyday Data Science",
    short_name: "Everyday DS",
    description: "Practical AI, ML & data science for people who build.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080a0e",
    theme_color: "#080a0e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
