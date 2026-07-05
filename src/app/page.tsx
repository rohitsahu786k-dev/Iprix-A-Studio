import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/public-shell";
import { PricingSection } from "@/components/pricing-section";
import { InteractiveCalculator } from "@/components/interactive-calculator";

export const metadata: Metadata = {
  title: "Meesho Listing AI Tool & Chrome Extension — Free AI Listing Generator | A+ Studio",
  description:
    "A+ Studio is the best Meesho listing tool for Indian sellers: free AI listing generator, Meesho listing extension with autofill, keyword research, catalog image checker, shipping weight calculator and bulk CSV upload for Meesho, Flipkart & Amazon.",
  keywords: [
    "meesho listing tool",
    "meesho listing extension",
    "meesho listing ai tool",
    "ai listing generator free",
    "ai product listing generator",
    "meesho catalog upload",
    "meesho catalogue maker",
    "meesho listing image size",
    "product listing software india",
    "flipkart seller product listing",
    "meesho keyword research tool",
    "meesho seller tools",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Meesho Listing AI Tool & Chrome Extension — A+ Studio",
    description:
      "Free AI listing generator + Meesho listing extension. Create catalog titles, descriptions, keywords & SKUs, autofill listings, check image compliance and shipping weight — built for Indian sellers.",
    url: "https://aplusstudio.iprixmedia.com",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://aplusstudio.iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "A+ Studio — Meesho listing AI tool dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meesho Listing AI Tool & Chrome Extension — A+ Studio",
    description: "Free AI listing generator + Meesho listing extension for Indian sellers. Autofill Meesho, Flipkart & Amazon listings with AI.",
    images: ["https://aplusstudio.iprixmedia.com/seller-dashboard.png"],
  },
};

const faqs = [
  {
    q: "What is the best Meesho listing tool for Indian sellers?",
    a: "A+ Studio is a complete Meesho listing AI tool: it generates catalog titles, descriptions, keywords and SKUs with AI, autofills the Meesho supplier panel through a Chrome extension, checks your first image for compliance and calculates chargeable shipping weight — all from one dashboard. The free plan needs no credit card.",
  },
  {
    q: "Is there a free AI listing generator for Meesho and Flipkart?",
    a: "Yes. A+ Studio's free plan includes AI-generated listings, 30 keyword research reports, unlimited free tools (Keyword Explorer, Shipping Calculator, Profit Calculator, Image Checker, SKU Generator, Title Checker) and the Chrome extension with Meesho autofill.",
  },
  {
    q: "What is the correct Meesho listing image size?",
    a: "Meesho requires a minimum 512×512 px image; we recommend 1000×1000 px or higher, a 1:1 square ratio, a plain white background, no text or watermark, and file size under 2 MB. A+ Studio's free Image Checker verifies all of this in one click before you upload.",
  },
  {
    q: "Why does Meesho charge higher shipping on some products?",
    a: "Couriers charge on the higher of dead weight and volumetric weight (L×B×H÷5000), and Meesho verifies the declared weight against your first catalog image. A combo-looking first image with a single-unit weight is the most common cause of shipping overcharges. A+ Studio's Shipping Calculator and Image Guard catch this before you publish.",
  },
  {
    q: "How can I upload my Meesho catalog faster?",
    a: "Save your product once in A+ Studio, generate the listing with AI, then open the Meesho supplier panel — the Chrome extension autofills titles, prices, descriptions and attributes into the catalog upload form. Sellers typically go from 20+ minutes per listing to under 2 minutes.",
  },
  {
    q: "Does the Chrome extension work on Flipkart and Amazon?",
    a: "Meesho support is fully live. Flipkart listing autofill is in beta, and Amazon is coming soon. One template can be reused across marketplaces.",
  },
  {
    q: "How does the free Meesho keyword research tool work?",
    a: "Keyword Explorer pulls live autocomplete data from Google India and DuckDuckGo — the exact phrases buyers type, like 'cotton kurti for women under 300'. It groups them into buyer-intent, long-tail and audience keywords, and exports to CSV. It is unlimited and never consumes AI credits.",
  },
  {
    q: "Is my seller data safe with A+ Studio?",
    a: "Yes. Authentication uses secure HTTP-only cookies, passwords are hashed, all AI calls run on our servers (no keys in the browser), the extension never auto-submits forms, and payment activation happens only through verified Razorpay webhooks.",
  },
  {
    q: "How much does A+ Studio cost?",
    a: "Start free with no credit card. Paid plans start at ₹99/month (Seller), with Growth at ₹199, Pro at ₹299 and Agency at ₹799 — each raises your monthly AI listing and keyword research limits.",
  },
];

function JsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Iprix Media",
      url: "https://aplusstudio.iprixmedia.com",
      logo: "https://aplusstudio.iprixmedia.com/aplus-logo.png",
      contactPoint: { "@type": "ContactPoint", email: "info@iprixmedia.com", contactType: "customer support", areaServed: "IN" },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "A+ Studio",
      operatingSystem: "Web, Chrome",
      applicationCategory: "BusinessApplication",
      description:
        "AI listing generator and Chrome extension for Meesho, Flipkart and Amazon sellers — catalog autofill, keyword research, image compliance and shipping weight tools.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Free plan — no credit card required" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// Minimalist vector icons using currentColor (monochrome/indigo)
const Icons = {
  Chrome: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  ),
  Database: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.736L20 10.5l-6.088 1.764L12 18l-1.912-5.736L4 10.5l6.088-1.764L12 3z" />
      <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Bolt: () => (
    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Box: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    </svg>
  ),
  Image: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Barcode: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="18" />
      <rect x="10" y="3" width="2" height="18" />
      <rect x="15" y="3" width="1" height="18" />
      <rect x="19" y="3" width="2" height="18" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

export default function Home() {
  return (
    <PublicShell>
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-zinc-950 py-20 lg:py-32 border-b border-zinc-900">
        {/* Premium Grid Blueprint Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1.5px,transparent_1.5px),linear-gradient(to_bottom,#e2e8f0_1.5px,transparent_1.5px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute -left-12 top-1/4 w-[400px] h-[400px] bg-violet-200/15 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-[10000ms]" />
        
        <div className="container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/10 bg-indigo-50 text-xs font-bold text-indigo-650 uppercase tracking-widest mb-8">
              <Icons.Sparkles />
              AI Listing Studio for Indian Sellers
            </div>
            <h1 className="text-4xl lg:text-[54px] font-extrabold tracking-tight text-zinc-100 leading-[1.1] mb-6">
              The <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Meesho listing AI tool</span> that creates catalogs in seconds
            </h1>
            <p className="text-base lg:text-lg text-zinc-550 leading-relaxed mb-10 max-w-2xl">
              A+ Studio is a <strong className="text-zinc-200">free AI listing generator</strong> and{" "}
              <strong className="text-zinc-200">Meesho listing extension</strong> for Indian sellers. Generate catalog titles,
              descriptions, keywords and SKUs with AI, <strong className="text-zinc-200">autofill the Meesho supplier panel</strong> in
              one click, research buyer keywords for free, and check your listing image size and shipping weight before you
              publish — on Meesho today, Flipkart in beta, Amazon coming soon.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className="rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-750 to-violet-650 px-8 py-4.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_24px_rgba(99,102,241,0.15)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_32px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300" href="/signup">
                Start Free Trial
              </Link>
              <Link className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-8 py-4.5 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-750 transition-all inline-flex items-center gap-2.5 hover:scale-[1.01] active:scale-[0.98] duration-300" href="#chrome-extension">
                <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={18} height={18} className="object-contain rounded" unoptimized />
                Install Extension
              </Link>
              <Link className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 px-8 py-4.5 text-sm font-bold text-zinc-550 hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all hover:scale-[1.01] active:scale-[0.98] duration-300" href="/pricing">
                View Plans
              </Link>
            </div>
          </div>
 
          {/* Interactive Calculator placement on right-hand column */}
          <div className="relative lg:ml-4">
            {/* Ambient glows behind calculator */}
            <div className="absolute -inset-4 bg-linear-to-tr from-indigo-500/10 via-violet-500/5 to-transparent rounded-[32px] blur-3xl opacity-70 -z-10 animate-pulse duration-[6000ms]" />
            <InteractiveCalculator />
          </div>
        </div>
      </section>

      {/* ── SECTION 1: WORKFLOW STEPS ── */}
      <section className="relative py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-350 uppercase tracking-widest mb-6">
              <Icons.Sparkles />
              Seller Automation Workflow
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-zinc-100 tracking-tight mb-5 leading-tight">
              Built for the <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">repetitive seller workflow.</span>
            </h2>
            <p className="text-base lg:text-lg text-zinc-550 leading-relaxed max-w-2xl mx-auto">
              Save once, generate with AI, preview with confidence, and track every seller operation from one place.
            </p>
          </div>

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Desktop Connecting Line */}
            <div className="absolute top-[48px] left-[12%] right-[12%] h-[1px] bg-zinc-800 z-0 hidden lg:block" />

            {/* Card 1 */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_24px_rgba(0,0,0,0.02)] hover:border-zinc-700/80 hover:bg-white hover:scale-[1.01] hover:shadow-pin-lg transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full uppercase tracking-wider">Step 1</span>
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-sm group-hover:border-indigo-300 text-zinc-600 transition-colors">
                    <Icons.Database />
                  </div>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-base leading-snug mb-3">Save product details.</h3>
                <p className="text-xs text-zinc-550 leading-relaxed">Store reusable product details and attribute templates to speed up future listings.</p>
              </div>
            </article>

            {/* Card 2 (Highlighted) */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-indigo-200 bg-indigo-50/50 p-7 shadow-pin hover:scale-[1.01] hover:shadow-pin-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute -right-12 -top-12 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Step 2</span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-650 flex items-center justify-center text-white border border-indigo-500 shadow-md">
                    <Icons.Sparkles />
                  </div>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-base leading-snug mb-3">Generate with AI.</h3>
                <p className="text-xs text-zinc-550 leading-relaxed mb-5">Create optimized catalog titles, SKUs, and keywords in seconds using OpenAI.</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest border border-indigo-200">
                  AI Powered
                </span>
              </div>
            </article>

            {/* Card 3 */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_24px_rgba(0,0,0,0.02)] hover:border-zinc-700/80 hover:bg-white hover:scale-[1.01] hover:shadow-pin-lg transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full uppercase tracking-wider">Step 3</span>
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-sm group-hover:border-indigo-300 text-zinc-600 transition-colors">
                    <Icons.Eye />
                  </div>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-base leading-snug mb-3">Preview in Extension.</h3>
                <p className="text-xs text-zinc-550 leading-relaxed">Review and confirm all details inside the sidebar popup before auto-filling.</p>
              </div>
            </article>

            {/* Card 4 */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_24px_rgba(0,0,0,0.02)] hover:border-zinc-700/80 hover:bg-white hover:scale-[1.01] hover:shadow-pin-lg transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full uppercase tracking-wider">Step 4</span>
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-sm group-hover:border-indigo-300 text-zinc-600 transition-colors">
                    <Icons.Chart />
                  </div>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-base leading-snug mb-3">Track Usage & Logs.</h3>
                <p className="text-xs text-zinc-550 leading-relaxed">Centralize analytics, check daily credits quota, and check activity logs.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: COMPLETE SAAS MODULES ── */}
      <section className="relative py-24 bg-zinc-900/10 border-y border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.015),transparent_40%)] pointer-events-none" />
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-350 uppercase tracking-widest mb-6">
              <Icons.Database />
              Core Platform Modules
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-zinc-100 tracking-tight mb-5 leading-tight">
              Complete <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent py-1">SaaS modules</span>
            </h2>
            <p className="text-base lg:text-lg text-zinc-550 leading-relaxed max-w-2xl mx-auto">
              Everything you need to create, optimize, automate and manage marketplace listings at scale.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Product listing automation", image: "/listing-automation.png", desc: "Create, enrich and publish optimized listings across multiple marketplaces in minutes.", icon: <Icons.Database /> },
              { title: "Chrome extension popup", image: "/chrome-extension-preview.png", desc: "Auto-detect, extract and autofill product data directly from any marketplace.", icon: <Icons.Chrome /> },
              { title: "Seller dashboard", image: "/seller-dashboard.png", desc: "Monitor performance, manage listings and track profitability in one unified dashboard.", icon: <Icons.Chart /> },
              { title: "AI content generation", image: "/ai-content.png", desc: "Use AI to write compelling titles, bullets and descriptions that convert.", icon: <Icons.Sparkles /> },
              { title: "Image optimization", image: "/image-optimization.png", desc: "Automatically enhance, background remove and optimize images for every marketplace.", icon: <Icons.Image /> },
              { title: "Admin analytics", image: "/admin-analytics.png", desc: "Advanced analytics, user management and usage insights to grow your business.", icon: <Icons.Chart /> },
            ].map((module, idx) => (
              <article key={idx} className="flex flex-col justify-between rounded-3xl border border-zinc-800 bg-white shadow-pin hover:shadow-pin-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 group overflow-hidden">
                <div className="p-6 bg-zinc-900 border-b border-zinc-800 flex items-center justify-center relative aspect-[16/10] overflow-hidden">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-sm bg-white">
                    <Image 
                      src={module.image} 
                      alt={module.title} 
                      fill 
                      className="object-cover object-top p-1 group-hover:scale-[1.03] transition-transform duration-500" 
                      unoptimized
                    />
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-650 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        {module.icon}
                      </div>
                      <h3 className="font-extrabold text-zinc-100 text-base leading-tight group-hover:text-indigo-600 transition-colors duration-350">{module.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-550">{module.desc}</p>
                  </div>
                  <div className="flex justify-end mt-6">
                    <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 text-zinc-550 group-hover:border-indigo-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300">
                      <Icons.ArrowRight />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE FEATURES ── */}
      <section className="relative py-24 bg-zinc-950 overflow-hidden">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-350 uppercase tracking-widest mb-6">
              <Icons.Sparkles />
              Core Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-zinc-100 tracking-tight mb-5">Features</h2>
            <p className="text-base lg:text-lg text-zinc-550 leading-relaxed max-w-2xl mx-auto">
              Everything you need to create, optimize, automate and manage marketplace listings at scale.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Reusable listing templates", icon: <Icons.FileText />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "Product library", icon: <Icons.Box />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "Smart listing bulk generator", icon: <Icons.Bolt />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "AI content writer", icon: <Icons.Sparkles />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "AI keyword research", icon: <Icons.Eye />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "Label analyser", icon: <Icons.Tag />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "Image maker", icon: <Icons.Image />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "Marketplace compliance score", icon: <Icons.Shield />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "SKU generator", icon: <Icons.Barcode />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "Team collaboration", icon: <Icons.Users />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "CSV import/export", icon: <Icons.Download />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
              { title: "Chrome extension autofill", icon: <Icons.Chrome />, desc: "Connected to backend routes, database models, plan checks and extension workflows where applicable." },
            ].map((feature, idx) => (
              <article key={idx} className="flex gap-4.5 p-6 rounded-3xl border border-zinc-800 bg-white shadow-pin hover:shadow-pin-lg hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-300 group relative items-start">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-550 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors duration-300">
                  {feature.icon}
                </div>
                <div className="flex-grow pr-6">
                  <h3 className="font-extrabold text-zinc-100 text-sm leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                  <p className="text-xs text-zinc-550 leading-relaxed">{feature.desc}</p>
                </div>
                <div className="absolute bottom-6 right-6 w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 text-zinc-650 group-hover:border-indigo-500/40 group-hover:bg-indigo-50 group-hover:text-indigo-650 transition-all duration-300">
                  <Icons.ArrowRight />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CHROME EXTENSION ── */}
      <section className="relative py-24 bg-zinc-900/10 border-t border-zinc-900 overflow-hidden" id="chrome-extension">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.015),transparent_40%)] pointer-events-none" />
        <div className="container relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-350 mb-6">
                <Image src="/icon/chrome.jpg" alt="Chrome logo" width={16} height={16} className="object-contain" unoptimized />
                A+ Studio Chrome Extension
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 mb-6 leading-tight">
                A+ Studio <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Chrome Extension</span>
              </h2>
              <p className="text-base lg:text-lg text-zinc-550 leading-relaxed mb-10 max-w-xl">
                Manifest V3 extension with login, plan status, templates, products, Meesho detection, template capture, autofill preview and activity logs.
              </p>
              
              <div className="grid grid-cols-2 gap-3.5 max-w-md">
                {[
                  { label: "Manifest V3", icon: <Icons.Shield /> },
                  { label: "Secure & Private", icon: <Icons.Lock /> },
                  { label: "Fast & Lightweight", icon: <Icons.Bolt /> },
                  { label: "Auto-detect Marketplace", icon: <Icons.Check /> },
                ].map((pill, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 px-4.5 py-3 rounded-2xl border border-zinc-800 bg-white shadow-sm text-xs font-extrabold text-zinc-200">
                    <span className="text-indigo-600">{pill.icon}</span>
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Chrome extension floating popup mockup inside marketplace bg */}
            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-tr from-indigo-500/10 via-violet-500/5 to-transparent rounded-[32px] blur-3xl opacity-80 -z-10 animate-pulse duration-[8000ms]" />
              <div className="relative rounded-[32px] border border-zinc-800/80 bg-zinc-900/75 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col backdrop-blur-md">
                {/* Browser top header */}
                <div className="bg-zinc-950/90 border-b border-zinc-850/85 px-4 py-3.5 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-850 rounded px-4 py-0.5 text-[9px] text-zinc-550 font-mono w-1/2 text-center select-none truncate">
                    seller.meesho.com
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={14} height={14} className="object-contain" unoptimized />
                  </div>
                </div>

                {/* Browser content rendering chrome-extension-preview */}
                <div className="relative flex-grow bg-zinc-950 overflow-hidden">
                  <Image 
                    src="/chrome-extension-preview.png" 
                    alt="A+ Studio Chrome Extension Preview" 
                    fill 
                    className="object-cover object-top hover:scale-[1.01] transition-transform duration-550"
                    unoptimized
                  />
                  {/* Floating Extension Popup UI simulation */}
                  <div className="absolute right-4 top-4 bottom-4 w-72 rounded-2xl border border-zinc-800/90 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-4.5 z-20 flex flex-col justify-between hidden md:flex">
                    <div>
                      {/* Extension Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-850 mb-3.5">
                        <div className="flex items-center gap-2">
                          <Image src="/aplus-logo.png" alt="A+ Logo" width={16} height={16} className="object-contain rounded" unoptimized />
                          <span className="font-extrabold text-xs text-zinc-100 tracking-tight">A+ Studio</span>
                        </div>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[9px] font-extrabold text-zinc-300 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </div>

                      {/* Marketplace detected status */}
                      <div className="bg-zinc-950/70 border border-zinc-850 rounded-xl p-3.5 mb-4 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Detected Site</p>
                          <p className="font-extrabold text-xs text-zinc-100">Meesho Seller Portal</p>
                        </div>
                        <span className="bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded">Live</span>
                      </div>

                      {/* Info details */}
                      <div className="space-y-2 mb-5">
                        <div className="flex justify-between text-xs border-b border-zinc-850 pb-2">
                          <span className="text-zinc-550 font-semibold">Pricing Plan</span>
                          <span className="font-bold text-zinc-350">Pro (Yearly)</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-zinc-850 pb-2">
                          <span className="text-zinc-550 font-semibold">Daily Limit</span>
                          <span className="font-bold text-zinc-350">150 / 500 Credits</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        <button className="w-full py-2.5 bg-linear-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-lg hover:from-indigo-650 hover:to-violet-650 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md shadow-indigo-550/15 cursor-pointer">
                          Capture Listing Template
                        </button>
                        <button className="w-full py-2.5 border border-zinc-800 text-zinc-350 text-xs font-bold rounded-lg bg-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 active:scale-[0.98] transition-all cursor-pointer">
                          Autofill Form Now
                        </button>
                      </div>
                    </div>

                    {/* Bottom Nav inside extension */}
                    <div className="flex justify-between border-t border-zinc-850 pt-3 mt-3 text-[9px] font-bold text-zinc-500">
                      <div className="text-zinc-350 flex flex-col items-center gap-1 cursor-pointer"><span className="text-xs">🏠</span>Home</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-zinc-350"><span className="text-xs">📋</span>Templates</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-zinc-350"><span className="text-xs">📦</span>Products</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-zinc-350"><span className="text-xs">⚡</span>Activity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three large marketplace cards below */}
          <div className="grid gap-6 md:grid-cols-3 mb-16">
            {/* Card 1 */}
            <article className="rounded-3xl border border-zinc-800 bg-white p-6 shadow-pin hover:shadow-pin-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/Meesho_logo.png" alt="Meesho" fill className="object-contain" unoptimized />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-base leading-tight mb-2">Meesho Listing Autofill</h3>
                <p className="text-xs text-zinc-550 leading-relaxed">
                  Save templates in dashboard and auto-inject attributes into the Meesho supplier catalog panel.
                </p>
              </div>
              <div className="flex justify-between items-center pt-5 mt-6 border-t border-zinc-850">
                <span className="w-12 h-[3px] bg-indigo-600 rounded-full" />
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 group-hover:border-indigo-500 group-hover:bg-indigo-50 text-zinc-650 group-hover:text-indigo-650 transition-colors duration-300">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="rounded-3xl border border-zinc-800 bg-white p-6 shadow-pin hover:shadow-pin-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/flipkart-icon.png" alt="Flipkart" fill className="object-contain" unoptimized />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-extrabold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    BETA
                  </span>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-base leading-tight mb-2">Flipkart Automation</h3>
                <p className="text-xs text-zinc-550 leading-relaxed">
                  Autofill listing parameters into your active Flipkart seller panel catalogue wizard.
                </p>
              </div>
              <div className="flex justify-between items-center pt-5 mt-6 border-t border-zinc-850">
                <span className="w-12 h-[3px] bg-amber-550 rounded-full" />
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 group-hover:border-amber-300 group-hover:bg-amber-50 text-zinc-650 group-hover:text-zinc-655 transition-colors duration-300">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="rounded-3xl border border-zinc-800 bg-white p-6 shadow-pin hover:shadow-pin-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/amazon.jpg" alt="Amazon" fill className="object-contain rounded-md" unoptimized />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold text-zinc-350 uppercase tracking-widest">COMING SOON</span>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-base leading-tight mb-2">Amazon Integration</h3>
                <p className="text-xs text-zinc-550 leading-relaxed">
                  Amazon Central automated single and bulk catalog generation under review.
                </p>
              </div>
              <div className="flex justify-between items-center pt-5 mt-6 border-t border-zinc-850">
                <span className="w-12 h-[3px] bg-zinc-700 rounded-full" />
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 group-hover:border-zinc-700 group-hover:bg-zinc-900 text-zinc-650 group-hover:text-zinc-655 transition-colors duration-300">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Trust Strip */}
          <div className="rounded-[28px] border border-zinc-800 bg-white p-6 md:p-8 shadow-pin">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100 text-indigo-650 shadow-inner">
                  <Icons.Shield />
                </div>
                <div>
                  <h4 className="font-extrabold text-zinc-100 text-xs mb-1.5">100% Secure</h4>
                  <p className="text-[11px] text-zinc-550 leading-relaxed">No credentials stored inside the browser extension.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100 text-indigo-650 shadow-inner">
                  <Icons.Lock />
                </div>
                <div>
                  <h4 className="font-extrabold text-zinc-100 text-xs mb-1.5">Privacy First</h4>
                  <p className="text-[11px] text-zinc-550 leading-relaxed">Local extension analysis prevents leaks.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100 text-indigo-655 shadow-inner">
                  <Icons.Bolt />
                </div>
                <div>
                  <h4 className="font-extrabold text-zinc-100 text-xs mb-1.5">Blazing Fast</h4>
                  <p className="text-[11px] text-zinc-550 leading-relaxed">Lightweight injection model works instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100 text-indigo-655 shadow-inner">
                  <Icons.Clock />
                </div>
                <div>
                  <h4 className="font-extrabold text-zinc-100 text-xs mb-1.5">Saves Time</h4>
                  <p className="text-[11px] text-zinc-550 leading-relaxed">Reduce manual copy-pasting from 20 mins to under 2.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MANUAL vs A+ STUDIO COMPARISON TABLE ── */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-zinc-100 tracking-tight mb-5">
              Manual listing vs <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">A+ Studio</span>
            </h2>
            <p className="text-base lg:text-lg text-zinc-550 leading-relaxed">
              Every hour spent copy-pasting into the Meesho catalog upload form is an hour not spent selling. Here is what changes.
            </p>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-zinc-800 shadow-pin">
            <table className="w-full text-left text-sm bg-white">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4">Seller task</th>
                  <th className="px-6 py-4">Manual listing</th>
                  <th className="px-6 py-4 text-indigo-600">With A+ Studio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-semibold text-zinc-200">
                {[
                  ["Time per catalog listing", "20–40 minutes of typing", "Under 2 minutes with AI + autofill"],
                  ["Product title & description", "Guesswork, inconsistent quality", "AI-generated, keyword-optimized, marketplace-compliant"],
                  ["Keyword research", "Paid tools or none", "Free unlimited Keyword Explorer (live Google India data)"],
                  ["Listing image size check", "Find out after rejection", "Instant Image Checker: size, ratio, background, brightness"],
                  ["Shipping weight surprises", "Discovered on the first order", "Volumetric weight & slab calculated before publishing"],
                  ["Profit per order", "Rough mental math", "GST, commission, ads & RTO factored automatically"],
                  ["Bulk uploads", "One listing at a time", "CSV import up to 250 listings"],
                  ["SKU management", "Manual spreadsheets", "Bulk SKU generator with CSV export"],
                ].map(([task, manual, aps]) => (
                  <tr key={task} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-zinc-100">{task}</td>
                    <td className="px-6 py-4 text-zinc-450">{manual}</td>
                    <td className="px-6 py-4 text-zinc-200">
                      <span className="inline-flex items-start gap-2">
                        <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Icons.Check /></span>
                        {aps}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── LONG-FORM SEO CONTENT ── */}
      <section className="py-24 bg-zinc-900/10 border-t border-zinc-900">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            {/* Left Column: Heading & Callout */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-105 bg-indigo-50 text-[10px] font-extrabold text-indigo-650 uppercase tracking-widest mb-4">
                  Why A+ Studio
                </div>
                <h2 className="text-3xl lg:text-[40px] font-extrabold text-zinc-100 tracking-tight leading-[1.15]">
                  Why Indian sellers switch to an <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">AI product listing generator</span>
                </h2>
              </div>
              <p className="text-base text-zinc-550 leading-relaxed">
                Selling on Meesho, Flipkart or Amazon India is a volume game: the sellers who list more catalogs, with better
                keywords and cleaner images, win more orders. A+ Studio removes the manual copy-paste friction so you can focus on scale.
              </p>
              <div className="rounded-3xl border border-zinc-800 bg-white p-6.5 shadow-pin space-y-4">
                <div className="flex gap-1 text-indigo-500 text-base">✨ ✨ ✨</div>
                <p className="text-xs font-semibold text-zinc-550 leading-relaxed italic">
                  &quot;A+ Studio is built by Iprix Media in India, for Indian marketplace sellers — from first-time Meesho suppliers to agencies managing hundreds of catalogs. Start free, no credit card required.&quot;
                </p>
              </div>
            </div>

            {/* Right Column: Premium Styled Value Proposition Cards */}
            <div className="space-y-5">
              {[
                {
                  title: "Manual catalog upload is slow",
                  desc: "Typing the same brand details, guessing search keywords, resizing images, and re-entering attributes for every single product is a waste of time. Our automated builder handles it in one click.",
                  badge: "Friction Free",
                  icon: "⚡"
                },
                {
                  title: "Simple 3-step listing workflow",
                  desc: "Save a product once in your product library. Generate a complete listing with AI (title, description, keywords, SKU, and score). Then open the Meesho supplier panel and let the extension autofill the form.",
                  badge: "Product Library",
                  icon: "📋"
                },
                {
                  title: "Instant image & weight checker",
                  desc: "Before you hit publish, the Image Checker verifies your first image (size, square ratio, background) and the Shipping Calculator warns you if volumetric weight pushes you into a higher courier slab.",
                  badge: "Profit Guard",
                  icon: "🔍"
                },
                {
                  title: "Built-in Google India keyword research",
                  desc: "Keyword Explorer reads live autocomplete data from Google India — exact phrases buyers type (e.g. 'saree under 500' or 'cotton kurti set') — and groups them into buyer-intent categories for copy-pasting.",
                  badge: "Free Unlimited",
                  icon: "📈"
                }
              ].map((value, idx) => (
                <div key={idx} className="rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6.5 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_24px_rgba(0,0,0,0.02)] hover:border-zinc-700/80 hover:bg-white hover:shadow-pin-lg transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{value.icon}</span>
                      <h3 className="font-extrabold text-zinc-100 text-sm leading-snug">{value.title}</h3>
                    </div>
                    <span className="text-[9px] font-extrabold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-wider">{value.badge}</span>
                  </div>
                  <p className="text-xs text-zinc-550 leading-relaxed font-semibold pl-8">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900" id="faq">
        <div className="container max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-zinc-100 tracking-tight mb-4">
              Frequently asked <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">questions</span>
            </h2>
            <p className="text-base text-zinc-550">Everything sellers ask before starting with A+ Studio.</p>
          </div>
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-3xl border border-zinc-800 bg-white shadow-pin p-6 open:pb-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-extrabold text-zinc-100 list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-650 text-base font-extrabold transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-zinc-550">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PLANS ── */}
      <PricingSection />
      <JsonLd />
    </PublicShell>
  );
}
