import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site-config";
import { getPlugins } from "@/lib/registry";

/**
 * Sitemap. Only the live hub surfaces are indexable — the inherited Shipkit
 * routes (docs, blog, legal, install, contact, …) are not part of the
 * Paperclip Hub product and are 404'd by middleware, so we omit them here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/submit`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const plugins = await getPlugins();
  const pluginRoutes: MetadataRoute.Sitemap = plugins.map((p) => ({
    url: `${base}/plugins/${p.slug}`,
    lastModified: p.submittedAt ? new Date(p.submittedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...pluginRoutes];
}
