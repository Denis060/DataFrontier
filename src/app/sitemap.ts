import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everydaydatascience.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await createClient();

  const [articles, categories, authors, sheets, events] = await Promise.all([
    db.from("articles").select("slug, updated_at").eq("status", "published"),
    db.from("categories").select("slug"),
    db.from("profiles").select("slug").not("slug", "is", null),
    db.from("cheat_sheets").select("slug, created_at").eq("published", true),
    db.from("events").select("slug, updated_at").eq("published", true),
  ]);

  const url = (path: string) => `${SITE}${path}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/jobs"), changeFrequency: "daily", priority: 0.7 },
    { url: url("/cheat-sheets"), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/events"), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/newsletter"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/newsletter/archive"), changeFrequency: "weekly", priority: 0.5 },
    { url: url("/write"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: url("/advertise"), changeFrequency: "yearly", priority: 0.3 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const articleUrls: MetadataRoute.Sitemap = (articles.data ?? []).map((a) => ({
    url: url(`/article/${a.slug}`),
    lastModified: a.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = (categories.data ?? []).map((c) => ({
    url: url(`/category/${c.slug}`),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const authorUrls: MetadataRoute.Sitemap = (authors.data ?? []).map((p) => ({
    url: url(`/author/${p.slug}`),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const sheetUrls: MetadataRoute.Sitemap = (sheets.data ?? []).map((s) => ({
    url: url(`/cheat-sheets/${s.slug}`),
    lastModified: s.created_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const eventUrls: MetadataRoute.Sitemap = (events.data ?? []).map((e) => ({
    url: url(`/events/${e.slug}`),
    lastModified: e.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticPages, ...articleUrls, ...categoryUrls, ...authorUrls, ...sheetUrls, ...eventUrls];
}
