import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://datafrontier.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the newsroom and auth flows out of the index.
      disallow: ["/admin", "/admin/", "/login", "/signup", "/search", "/auth/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
