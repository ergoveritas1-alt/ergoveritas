import type { MetadataRoute } from "next";

const siteUrl = "https://ergoveritas.com";

const routes = [
  "",
  "/check_exposure",
  "/contact",
  "/legal",
  "/privacy",
  "/register",
  "/terms",
  "/verify"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
