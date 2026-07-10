import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ImageIcon, Lock, Search, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { FreeToolsHub } from "@/components/seller-tools";

const pageTitle = "Free Meesho Seller Tools — Shipping, Profit, Image, SKU & Title Checkers";
const pageDescription =
  "7 free tools for Meesho, Flipkart & Amazon sellers: low-shipping image generator, shipping weight & slab calculator, profit calculator with GST/commission/RTO, listing image checker, bulk SKU generator and title checker. No login, no credit card, unlimited use.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "free meesho seller tools",
    "meesho shipping calculator",
    "meesho profit calculator",
    "meesho image size checker",
    "meesho sku generator",
    "meesho title checker",
    "meesho low shipping image tool",
    "free seller tools india",
  ],
  alternates: { canonical: "/tools" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "https://aplusstudio.iprixmedia.com/tools",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://aplusstudio.iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "A+ Studio free seller tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

const toolList = [
  { name: "Meesho Low-Shipping Image Generator", url: "/tools/meesho-low-shipping-image-generator", description: "Generate 5 honest white-background 1024×1024 image variants that reduce perceived bulk and shipping slab." },
  { name: "Shipping Weight & Slab Calculator", url: "/tools/meesho-shipping-calculator", description: "Volumetric vs dead weight, chargeable slab and zone-wise shipping estimates." },
  { name: "Profit Calculator", url: "/tools/meesho-profit-calculator", description: "Per-order profit after GST, commission, shipping, ads and RTO." },
  { name: "Price Calculator", url: "/tools/meesho-price-calculator", description: "Enter the profit you want per order, get the minimum listing price and charm price." },
  { name: "Listing Image Checker", url: "/tools/meesho-image-checker", description: "Size, square ratio, background and brightness compliance in one click." },
  { name: "Bulk SKU Generator", url: "/tools/meesho-sku-generator", description: "Generate consistent SKUs in bulk with CSV export." },
  { name: "Title Checker", url: "/tools/meesho-title-checker", description: "Length, keyword coverage and marketplace-safety check for listing titles." },
  { name: "Keyword Explorer", url: "/dashboard/keyword-explorer", description: "Live Google India autocomplete keywords grouped by buyer intent (free account needed)." },
];

export default function ToolsHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free seller tools by A+ Studio",
    itemListElement: toolList.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      description: tool.description,
      url: `https://aplusstudio.iprixmedia.com${tool.url}`,
    })),
  };

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">100% free · No login · No AI credits used</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">Free Seller Tools</h1>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-400">
            Har tool hamesha free hai — calculators aur checkers aapke browser me hi chalte hain. Meesho, Flipkart aur Amazon
            sellers ke liye banaya gaya.
          </p>
        </div>

        {/* Featured: Low-Shipping Image Generator */}
        <div className="mx-auto mt-10 max-w-4xl">
          <Link
            href="/tools/meesho-low-shipping-image-generator"
            className="group flex flex-col gap-4 rounded-3xl border border-indigo-500/25 bg-indigo-500/5 p-6 transition-all hover:border-indigo-400/50 hover:bg-indigo-500/10 sm:flex-row sm:items-center"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <ImageIcon className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-extrabold text-zinc-100">
                Meesho Low-Shipping Image Generator
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">New</span>
              </span>
              <span className="mt-1.5 block text-xs font-semibold leading-relaxed text-zinc-400">
                Meesho aapki photo se product ka bulk estimate karta hai — bulky photo, zyada shipping. 5 white-background compact
                variants banao (100% browser me), Bulk Score dekho aur A/B test karke sabse kam slab wali image choose karo.
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Keyword explorer pointer */}
        <div className="mx-auto mt-4 max-w-4xl">
          <Link
            href="/dashboard/keyword-explorer"
            className="group flex items-center gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300">
              <Search className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-extrabold text-zinc-100">
                Keyword Explorer
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">
                  <Lock className="h-2.5 w-2.5" /> Free account
                </span>
              </span>
              <span className="mt-1 block text-xs font-semibold text-zinc-400">
                Live Google India autocomplete keywords, buyer-intent groups me — unlimited, koi AI credit nahi lagta.
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Inline free tools */}
        <div className="mx-auto mt-12 max-w-5xl" id="free-tools">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-zinc-100">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Use the tools right here
          </h2>
          <FreeToolsHub />
        </div>
      </section>
    </PublicShell>
  );
}
