import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/public-shell";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "A+ Studio by Iprix Media - AI Listing Autofill Tool for Indian Sellers",
  description: "Create marketplace-ready product listings, AI titles, descriptions, keywords, SKUs and images for Meesho, Flipkart and Amazon sellers.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "A+ Studio by Iprix Media - AI Listing Autofill Tool for Indian Sellers",
    description: "Create marketplace-ready product listings, AI titles, descriptions, keywords, SKUs and images for Meesho, Flipkart and Amazon sellers.",
    url: "https://iprixmedia.com",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "A+ Studio Seller Dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A+ Studio by Iprix Media - AI Listing Autofill Tool for Indian Sellers",
    description: "Create marketplace-ready product listings, AI titles, descriptions, keywords, SKUs and images for Meesho, Flipkart and Amazon sellers.",
    images: ["https://iprixmedia.com/seller-dashboard.png"],
  },
};

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
      <section className="relative overflow-hidden bg-zinc-950 py-24 lg:py-36 border-b border-zinc-900">
        {/* Premium Grid Blueprint Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-950/15 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute -left-12 top-1/4 w-[400px] h-[400px] bg-violet-950/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-[10000ms]" />
        
        <div className="container grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/10 bg-indigo-950/20 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-8">
              <Icons.Sparkles />
              AI Listing Studio for Indian Sellers
            </div>
            <h1 className="text-5xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.05] mb-6">
              Create marketplace-ready <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">listings in seconds.</span>
            </h1>
            <p className="text-lg lg:text-xl text-zinc-400 leading-relaxed mb-10 max-w-2xl">
              A+ Studio by Iprix Media helps Indian sellers create AI-powered product titles, descriptions, keywords,
              SKUs, images and autofill marketplace listing forms with a powerful Chrome extension.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className="rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 px-8 py-4.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_24px_rgba(99,102,241,0.15)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_32px_rgba(99,102,241,0.25)] hover:from-indigo-450 hover:via-indigo-550 hover:to-violet-550 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300" href="/signup">
                Start Free Trial
              </Link>
              <Link className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-8 py-4.5 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-750 transition-all inline-flex items-center gap-2.5 hover:scale-[1.01] active:scale-[0.98] duration-300" href="#chrome-extension">
                <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={18} height={18} className="object-contain rounded" />
                Install Extension
              </Link>
              <Link className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 px-8 py-4.5 text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all hover:scale-[1.01] active:scale-[0.98] duration-300" href="/pricing">
                View Plans
              </Link>
            </div>
          </div>
 
          {/* Premium Preview Stack (Layered Showcase UI) */}
          <div className="relative lg:ml-4">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent rounded-[32px] blur-3xl opacity-80 -z-10 animate-pulse duration-[6000ms]" />
            
            {/* Main Browser Mockup (Dashboard) */}
            <div className="relative rounded-[32px] border border-zinc-800/80 bg-zinc-900/70 p-2 shadow-2xl transition-all duration-300 backdrop-blur-md">
              <div className="bg-zinc-950/80 border-b border-zinc-850/80 px-4 py-3 flex items-center gap-1.5 rounded-t-[24px] select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="mx-auto bg-zinc-900 border border-zinc-850 rounded px-4 py-0.5 text-[9px] text-zinc-500 font-mono w-1/2 text-center truncate">
                  app.iprixmedia.com/dashboard
                </div>
              </div>
              <div className="relative overflow-hidden rounded-b-[24px] aspect-[16/10] bg-zinc-950">
                <Image 
                  src="/seller-dashboard.png" 
                  alt="A+ Studio Seller Dashboard" 
                  fill 
                  className="object-cover object-top hover:scale-[1.01] transition-transform duration-500" 
                  priority
                />
              </div>
            </div>
 
            {/* Floating Live Indicator Badge */}
            <div className="absolute -right-4 -top-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-4 py-2.5 shadow-xl flex items-center gap-2 z-20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-extrabold text-zinc-200 uppercase tracking-widest">A+ AI Agent Active</span>
            </div>
 
            {/* Floating Meesho Listing Preview Card (Layered on top of the dashboard screenshot) */}
            <div className="absolute -left-6 -bottom-6 w-72 rounded-3xl border border-zinc-800/80 bg-zinc-900/95 p-5 shadow-2xl z-20 hidden md:block hover:-translate-y-1 transition-transform duration-300 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Image src="/icon/Meesho_logo.png" alt="Meesho" width={16} height={16} className="object-contain rounded" />
                  <span className="font-extrabold text-white text-xs">Meesho Preview</span>
                </div>
                <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[9px] font-extrabold text-zinc-350">92 Score</span>
              </div>
              <div className="space-y-2">
                {["Product Title", "MRP & Selling Price", "SKU & Keywords"].map((field) => (
                  <div key={field} className="flex justify-between items-center rounded-2xl border border-zinc-850 bg-zinc-950/70 px-3.5 py-2.5 text-[10px]">
                    <span className="text-zinc-550 font-bold">{field}</span>
                    <span className="text-indigo-400 font-extrabold flex items-center gap-1">
                      <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Autofill Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: WORKFLOW STEPS ── */}
      <section className="relative py-28 bg-zinc-950 border-t border-zinc-900">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-300 uppercase tracking-widest mb-6">
              <Icons.Sparkles />
              Seller Automation Workflow
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
              Built for the <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400 bg-clip-text text-transparent">repetitive seller workflow.</span>
            </h2>
            <p className="text-base lg:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Save once, generate with AI, preview with confidence, and track every seller operation from one place.
            </p>
          </div>

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Desktop Connecting Line */}
            <div className="absolute top-[48px] left-[12%] right-[12%] h-[1px] bg-zinc-850/80 z-0 hidden lg:block" />

            {/* Card 1 */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-zinc-850/50 bg-zinc-900/20 p-7 shadow-sm hover:border-zinc-700/80 hover:bg-zinc-900/40 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-zinc-400 bg-zinc-900 border border-zinc-850 px-3 py-1 rounded-full uppercase tracking-wider">Step 1</span>
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-sm group-hover:border-zinc-700 transition-colors">
                    <Icons.Database />
                  </div>
                </div>
                <h3 className="font-extrabold text-white text-base leading-snug mb-3">Save product data and selectors once.</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Store reusable product details and selectors to speed up future listings.</p>
              </div>
            </article>

            {/* Card 2 (Highlighted) */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-indigo-500/35 bg-indigo-950/10 p-7 shadow-xl shadow-indigo-950/10 hover:border-indigo-500/60 hover:scale-[1.01] transition-all duration-300 group overflow-hidden">
              <div className="absolute -right-12 -top-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/15 transition-colors" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-white bg-indigo-650 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Step 2</span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-md">
                    <Icons.Sparkles />
                  </div>
                </div>
                <h3 className="font-extrabold text-white text-base leading-snug mb-3">Generate title, SKU and keywords with AI.</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-5">Create optimized marketplace-ready content in seconds.</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest border border-indigo-900/50">
                  AI Powered
                </span>
              </div>
            </article>

            {/* Card 3 */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-zinc-850/50 bg-zinc-900/20 p-7 shadow-sm hover:border-zinc-700/80 hover:bg-zinc-900/40 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-zinc-400 bg-zinc-900 border border-zinc-850 px-3 py-1 rounded-full uppercase tracking-wider">Step 3</span>
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-sm group-hover:border-zinc-700 transition-colors">
                    <Icons.Eye />
                  </div>
                </div>
                <h3 className="font-extrabold text-white text-base leading-snug mb-3">Preview inside Chrome extension.</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Review and confirm all values before pushing them live.</p>
              </div>
            </article>

            {/* Card 4 */}
            <article className="relative z-10 flex flex-col justify-between rounded-3xl border border-zinc-850/50 bg-zinc-900/20 p-7 shadow-sm hover:border-zinc-700/80 hover:bg-zinc-900/40 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-extrabold text-zinc-400 bg-zinc-900 border border-zinc-850 px-3 py-1 rounded-full uppercase tracking-wider">Step 4</span>
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-sm group-hover:border-zinc-700 transition-colors">
                    <Icons.Chart />
                  </div>
                </div>
                <h3 className="font-extrabold text-white text-base leading-snug mb-3">Track usage and admin activity logs.</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Centralize analytics, billing, team activity and admin visibility.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: COMPLETE SAAS MODULES ── */}
      <section className="relative py-28 bg-zinc-900/20 border-y border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.02),transparent_40%)] pointer-events-none" />
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-300 uppercase tracking-widest mb-6">
              <Icons.Database />
              Core Platform Modules
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
              Complete <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400 bg-clip-text text-transparent">SaaS modules</span>
            </h2>
            <p className="text-base lg:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
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
              <article key={idx} className="flex flex-col justify-between rounded-3xl border border-zinc-850/60 bg-zinc-900/20 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-zinc-700/80 hover:bg-zinc-900/40 transition-all duration-300 group overflow-hidden">
                <div className="p-6 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 border-b border-zinc-900/80 flex items-center justify-center relative aspect-[16/10] overflow-hidden">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-850 shadow-sm bg-zinc-950">
                    <Image 
                      src={module.image} 
                      alt={module.title} 
                      fill 
                      className="object-cover object-top p-1 group-hover:scale-[1.03] transition-transform duration-500" 
                    />
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 text-zinc-300 group-hover:border-zinc-700 group-hover:text-indigo-400 transition-colors duration-300">
                        {module.icon}
                      </div>
                      <h3 className="font-extrabold text-white text-base leading-tight group-hover:text-indigo-300 transition-colors duration-350">{module.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-400">{module.desc}</p>
                  </div>
                  <div className="flex justify-end mt-6">
                    <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900/60 group-hover:border-indigo-550/40 group-hover:bg-indigo-950/20 text-zinc-400 group-hover:text-indigo-400 transition-all duration-300">
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
      <section className="relative py-28 bg-zinc-950 overflow-hidden">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-300 uppercase tracking-widest mb-6">
              <Icons.Sparkles />
              Core Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5">Features</h2>
            <p className="text-base lg:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
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
              <article key={idx} className="flex gap-4.5 p-6 rounded-3xl border border-zinc-850/50 bg-zinc-900/10 shadow-sm hover:shadow-xl hover:shadow-indigo-550/2 hover:-translate-y-0.5 hover:border-zinc-700/80 transition-all duration-300 group relative items-start">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center flex-shrink-0 text-zinc-400 group-hover:text-indigo-400 group-hover:border-zinc-700 transition-colors duration-300">
                  {feature.icon}
                </div>
                <div className="flex-grow pr-6">
                  <h3 className="font-extrabold text-white text-sm leading-snug mb-1.5 group-hover:text-indigo-300 transition-colors">{feature.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
                <div className="absolute bottom-6 right-6 w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900/60 group-hover:border-indigo-500/40 group-hover:bg-indigo-950/20 text-zinc-550 group-hover:text-indigo-400 transition-all duration-300">
                  <Icons.ArrowRight />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CHROME EXTENSION ── */}
      <section className="relative py-28 bg-zinc-900/20 border-t border-zinc-900 overflow-hidden" id="chrome-extension">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.02),transparent_40%)] pointer-events-none" />
        <div className="container relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-350 mb-6">
                <Image src="/icon/chrome.jpg" alt="Chrome logo" width={16} height={16} className="object-contain" />
                A+ Studio Chrome Extension
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                A+ Studio <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400 bg-clip-text text-transparent">Chrome Extension</span>
              </h2>
              <p className="text-base lg:text-lg text-zinc-400 leading-relaxed mb-10 max-w-xl">
                Manifest V3 extension with login, plan status, templates, products, Meesho detection, template capture, autofill preview and activity logs.
              </p>
              
              <div className="grid grid-cols-2 gap-3.5 max-w-md">
                {[
                  { label: "Manifest V3", icon: <Icons.Shield /> },
                  { label: "Secure & Private", icon: <Icons.Lock /> },
                  { label: "Fast & Lightweight", icon: <Icons.Bolt /> },
                  { label: "Auto-detect Marketplace", icon: <Icons.Check /> },
                ].map((pill, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 px-4.5 py-3 rounded-2xl border border-zinc-850 bg-zinc-900/10 text-xs font-extrabold text-zinc-300">
                    <span className="text-indigo-450">{pill.icon}</span>
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Chrome extension floating popup mockup inside marketplace bg */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 via-violet-500/5 to-transparent rounded-[32px] blur-3xl opacity-80 -z-10 animate-pulse duration-[8000ms]" />
              <div className="relative rounded-[32px] border border-zinc-800/80 bg-zinc-900/70 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col backdrop-blur-md">
                {/* Browser top header */}
                <div className="bg-zinc-950/80 border-b border-zinc-850/85 px-4 py-3.5 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-850 rounded px-4 py-0.5 text-[9px] text-zinc-500 font-mono w-1/2 text-center select-none truncate">
                    seller.meesho.com
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={14} height={14} className="object-contain" />
                  </div>
                </div>

                {/* Browser content rendering chrome-extension-preview */}
                <div className="relative flex-grow bg-zinc-950 overflow-hidden">
                  <Image 
                    src="/chrome-extension-preview.png" 
                    alt="A+ Studio Chrome Extension Preview" 
                    fill 
                    className="object-cover object-top hover:scale-[1.01] transition-transform duration-550"
                  />
                  {/* Floating Extension Popup UI simulation */}
                  <div className="absolute right-4 top-4 bottom-4 w-72 rounded-2xl border border-zinc-800/90 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-4.5 z-20 flex flex-col justify-between hidden md:flex">
                    <div>
                      {/* Extension Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-850 mb-3.5">
                        <div className="flex items-center gap-2">
                          <Image src="/icon/iprix-media-white-logo.webp" alt="Iprix Logo" width={16} height={16} className="object-contain" />
                          <span className="font-extrabold text-xs text-white tracking-tight">A+ Studio</span>
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
                          <p className="font-extrabold text-xs text-white">Meesho Seller Portal</p>
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
                          <span className="font-bold text-zinc-355">150 / 500 Credits</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-650 to-violet-650 text-white text-xs font-bold rounded-lg hover:from-indigo-450 hover:to-violet-550 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md shadow-indigo-550/15 cursor-pointer">
                          Capture Listing Template
                        </button>
                        <button className="w-full py-2.5 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-lg bg-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 active:scale-[0.98] transition-all cursor-pointer">
                          Autofill Form Now
                        </button>
                      </div>
                    </div>

                    {/* Bottom Nav inside extension */}
                    <div className="flex justify-between border-t border-zinc-850 pt-3 mt-3 text-[9px] font-bold text-zinc-500">
                      <div className="text-zinc-300 flex flex-col items-center gap-1 cursor-pointer"><span className="text-xs">🏠</span>Home</div>
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
            <article className="rounded-3xl border border-indigo-500/20 bg-indigo-950/5 p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-550/40 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/Meesho_logo.png" alt="Meesho" fill className="object-contain" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/35 text-[9px] font-extrabold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <h3 className="font-extrabold text-white text-base leading-tight mb-2">Meesho Listing Automation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The extension never stores backend secrets and never auto-submits marketplace forms.
                </p>
              </div>
              <div className="flex justify-between items-center pt-5 mt-6 border-t border-zinc-900/60">
                <span className="w-12 h-[3px] bg-indigo-550 rounded-full" />
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-950 group-hover:border-indigo-500/40 group-hover:bg-indigo-950/30 text-zinc-400 group-hover:text-indigo-400 transition-colors duration-300">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="rounded-3xl border border-zinc-850/80 bg-zinc-900/10 p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/2 hover:-translate-y-1 hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/flipkart-icon.png" alt="Flipkart" fill className="object-contain" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold text-zinc-350 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    BETA
                  </span>
                </div>
                <h3 className="font-extrabold text-white text-base leading-tight mb-2">Flipkart Automation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The extension never stores backend secrets and never auto-submits marketplace forms.
                </p>
              </div>
              <div className="flex justify-between items-center pt-5 mt-6 border-t border-zinc-900/60">
                <span className="w-12 h-[3px] bg-zinc-700 rounded-full" />
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-950 group-hover:border-zinc-700 group-hover:bg-zinc-900/50 text-zinc-400 group-hover:text-zinc-350 transition-colors duration-300">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="rounded-3xl border border-zinc-850/80 bg-zinc-900/10 p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/2 hover:-translate-y-1 hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/amazon.jpg" alt="Amazon" fill className="object-contain rounded-md" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-850 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">COMING SOON</span>
                </div>
                <h3 className="font-extrabold text-white text-base leading-tight mb-2">Amazon Integration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The extension never stores backend secrets and never auto-submits marketplace forms.
                </p>
              </div>
              <div className="flex justify-between items-center pt-5 mt-6 border-t border-zinc-900/60">
                <span className="w-12 h-[3px] bg-zinc-800 rounded-full" />
                <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-950 group-hover:border-zinc-700 group-hover:bg-zinc-900/50 text-zinc-400 group-hover:text-zinc-350 transition-colors duration-300">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Trust Strip */}
          <div className="rounded-[28px] border border-zinc-850/80 bg-zinc-900/10 p-6 md:p-8 backdrop-blur-sm shadow-md">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-800 text-indigo-400 shadow-inner">
                  <Icons.Shield />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1.5">100% Secure</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">No backend secrets stored in the extension</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-800 text-indigo-400 shadow-inner">
                  <Icons.Lock />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1.5">Privacy First</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Your data is safe and always encrypted</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-800 text-indigo-400 shadow-inner">
                  <Icons.Bolt />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1.5">High Performance</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Lightweight extension with blazing fast speed</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-800 text-indigo-400 shadow-inner">
                  <Icons.Clock />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1.5">Activity Logs</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Detailed logs for every action you take</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING PLANS ── */}
      <PricingSection />
    </PublicShell>
  );
}
