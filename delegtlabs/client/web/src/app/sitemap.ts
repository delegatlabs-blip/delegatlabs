import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { listAgentSlugs } from "@/server/agents/repository";

const paths = [
  "/",
  "/about",
  "/agents",
  "/blog",
  "/careers",
  "/contact",
  "/portfolio",
  "/privacy",
  "/terms",
  "/copyright",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries = paths.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency:
      path === "/" || path === "/blog" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "/" ? 1 : 0.6,
  }));

  const agentEntries = listAgentSlugs().map((slug) => ({
    url: `${siteConfig.url}/agents/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...agentEntries];
}
