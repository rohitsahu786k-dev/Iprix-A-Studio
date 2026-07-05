import type { MetadataRoute } from "next";

const routes = [
  "",
  "/features",
  "/chrome-extension",
  "/pricing",
  "/about",
  "/contact",
  "/terms-of-service",
  "/privacy-policy",
  "/refund-policy",
  "/login",
  "/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://aplusstudio.iprixmedia.com";
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
