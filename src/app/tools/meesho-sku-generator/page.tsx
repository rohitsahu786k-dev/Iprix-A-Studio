import type { Metadata } from "next";
import { SkuGenerator } from "@/components/seller-tools";
import { ToolPage } from "@/components/tool-page";

const title = "Free Bulk SKU Generator for Meesho, Flipkart & Amazon Sellers";
const description =
  "Generate consistent product SKUs in bulk from brand, category, color and size — with duplicate detection and one-click CSV export. Free, no login, runs in your browser.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "sku generator free",
    "bulk sku generator",
    "meesho sku generator",
    "sku code kaise banaye",
    "product sku format india",
  ],
  alternates: { canonical: "/tools/meesho-sku-generator" },
  openGraph: { title, description, url: "https://aplusstudio.iprixmedia.com/tools/meesho-sku-generator", siteName: "A+ Studio", type: "website" },
  twitter: { card: "summary", title, description },
};

const faq = [
  {
    question: "What is a good SKU format?",
    answer:
      "BRAND-CATEGORY-ATTRIBUTE-NUMBER, e.g. APS-KURTI-RED-M-001. Keep it short, uppercase, no spaces or special characters, and encode only what helps you pick and pack faster (color, size, variant).",
  },
  {
    question: "Why do consistent SKUs matter on marketplaces?",
    answer:
      "SKUs link your orders, inventory, returns and settlements across Meesho, Flipkart and Amazon. Inconsistent SKUs cause wrong-item shipments, unclaimed returns and impossible reconciliation at settlement time.",
  },
  {
    question: "Can I export the generated SKUs?",
    answer: "Yes — one click exports the full list as CSV, ready to paste into your catalog sheets or inventory software.",
  },
];

export default function Page() {
  return (
    <ToolPage
      slug="meesho-sku-generator"
      title="Bulk SKU Generator"
      subtitle="Brand + category + attributes se consistent SKUs banao — bulk me, duplicate check ke saath, CSV export ready. Meesho, Flipkart aur Amazon sab ke liye."
      faq={faq}
    >
      <SkuGenerator />
    </ToolPage>
  );
}
