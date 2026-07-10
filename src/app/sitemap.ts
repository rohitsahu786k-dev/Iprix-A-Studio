import type { MetadataRoute } from "next";

const routes = [
  "",
  "/features",
  "/chrome-extension",
  "/pricing",
  "/tools",
  "/tools/meesho-low-shipping-image-generator",
  "/tools/meesho-shipping-calculator",
  "/tools/meesho-profit-calculator",
  "/tools/meesho-price-calculator",
  "/tools/meesho-image-checker",
  "/tools/meesho-sku-generator",
  "/tools/meesho-title-checker",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/refund",
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
