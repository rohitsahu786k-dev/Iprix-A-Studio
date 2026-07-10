import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { LowShippingStudio } from "@/components/low-shipping-studio";
import { LOW_SHIPPING_STRINGS } from "@/lib/low-shipping";

const pageTitle = "Free Meesho Low-Shipping Image Generator — Reduce Shipping Charges";
const pageDescription =
  "Meesho estimates shipping from your product photo. Generate 5 honest, white-background 1024×1024 listing images at different compactness levels, get a Perceived Bulk Score, and estimate your shipping slab — 100% free, in your browser.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "meesho shipping charges kam kaise kare",
    "meesho low shipping image",
    "meesho image se shipping",
    "meesho volumetric weight calculator",
    "meesho white background image tool",
    "meesho shipping slab calculator",
    "product image background remover free",
  ],
  alternates: { canonical: "/tools/meesho-low-shipping-image-generator" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "https://aplusstudio.iprixmedia.com/tools/meesho-low-shipping-image-generator",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://aplusstudio.iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "Meesho low-shipping image generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

const faq = [
  {
    question: "Why does my product image change my Meesho shipping charge?",
    answer:
      "Meesho charges on chargeable weight = max(dead weight, volumetric weight), but its system also estimates the product's physical bulk from the listing image using computer vision. Spread-out flat-lays, props, gift boxes, hands and cluttered backgrounds inflate the perceived bulk, so the same product can be quoted a higher shipping slab with a bulky-looking photo.",
  },
  {
    question: "Is this tool safe for my Meesho seller account?",
    answer:
      "Yes. Images stay honest — only the background, crop and framing change, never the product itself. The tool performs zero automated actions on the Meesho Supplier Panel; you upload the chosen image manually. All shipping figures are editable-rate-card estimates, not guarantees.",
  },
  {
    question: "How is volumetric weight calculated?",
    answer:
      "Volumetric weight (kg) = Length × Breadth × Height in cm ÷ 5000. Your chargeable weight is the higher of dead weight and volumetric weight, and the slab plus delivery zone decides the shipping charge.",
  },
  {
    question: "Do my images get uploaded to a server?",
    answer:
      "No. Background removal and all 5 variants are generated 100% inside your browser using WASM. Your product photos never leave your device.",
  },
];

export default function LowShippingToolPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Meesho Low-Shipping Image Generator",
        url: "https://aplusstudio.iprixmedia.com/tools/meesho-low-shipping-image-generator",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        description: pageDescription,
        publisher: { "@type": "Organization", name: "Iprix Media", url: "https://iprixmedia.com" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Free seller tool · No login needed</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">
            Meesho Low-Shipping Image Generator
          </h1>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-400">
            {pageDescription}
          </p>
          <p className="mt-3 text-[11px] font-semibold text-zinc-500">{LOW_SHIPPING_STRINGS.disclaimer.en}</p>
        </div>
        <div className="mt-10">
          <LowShippingStudio />
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-xl font-extrabold text-zinc-100">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <details className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5" key={item.question}>
                <summary className="cursor-pointer text-sm font-extrabold text-zinc-100">{item.question}</summary>
                <p className="mt-3 text-xs font-semibold leading-relaxed text-zinc-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
