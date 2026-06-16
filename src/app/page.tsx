import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/public-shell";
import { pricingPlans } from "@/lib/plans";

// Minimalist vector icons using currentColor (monochrome)
const Icons = {
  Chrome: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  ),
  Database: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.736L20 10.5l-6.088 1.764L12 18l-1.912-5.736L4 10.5l6.088-1.764L12 3z" />
      <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4 text-neutral-800 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Bolt: () => (
    <svg className="w-4 h-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4 text-neutral-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Box: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    </svg>
  ),
  Image: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Barcode: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="18" />
      <rect x="10" y="3" width="2" height="18" />
      <rect x="15" y="3" width="1" height="18" />
      <rect x="19" y="3" width="2" height="18" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

export default function Home() {
  return (
    <PublicShell>
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-white py-20 lg:py-32 border-b border-neutral-100">
        {/* Premium Grid Blueprint Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-neutral-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="container grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200/80 bg-neutral-50 text-xs font-semibold text-neutral-800 mb-6">
              <Icons.Sparkles />
              AI Listing Studio for Indian Sellers
            </div>
            <h1 className="text-5xl lg:text-[64px] font-extrabold tracking-tight text-neutral-900 leading-[1.1] mb-6">
              Create marketplace-ready <span className="underline decoration-neutral-950 underline-offset-4 decoration-4">listings in seconds.</span>
            </h1>
            <p className="text-lg lg:text-xl text-neutral-600 leading-relaxed mb-8 max-w-2xl">
              A+ Studio by Iprix Media helps Indian sellers create AI-powered product titles, descriptions, keywords,
              SKUs, images and autofill marketplace listing forms with a powerful Chrome extension.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className="rounded-xl bg-neutral-950 px-7 py-4 text-sm font-bold text-white shadow-md hover:bg-neutral-850 hover:shadow-lg transition-all active:scale-[0.98]" href="/signup">
                Start Free Trial
              </Link>
              <Link className="rounded-xl border border-neutral-200 bg-white px-7 py-4 text-sm font-bold text-neutral-850 hover:bg-neutral-50 transition-all inline-flex items-center gap-2.5 active:scale-[0.98]" href="#chrome-extension">
                <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={18} height={18} className="object-contain rounded" />
                Install Extension
              </Link>
              <Link className="rounded-xl border border-neutral-200 bg-white px-7 py-4 text-sm font-bold text-neutral-500 hover:text-neutral-850 hover:bg-neutral-50 transition-all active:scale-[0.98]" href="/pricing">
                View Plans
              </Link>
            </div>
          </div>

          {/* Premium Preview Stack (Layered Showcase UI) */}
          <div className="relative lg:ml-4">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-neutral-200/40 via-neutral-100/50 to-neutral-50/20 rounded-3xl blur-3xl opacity-80 -z-10" />
            
            {/* Main Browser Mockup (Dashboard) */}
            <div className="relative rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-neutral-50 border-b border-neutral-150 px-4 py-2.5 flex items-center gap-1.5 rounded-t-xl select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                <div className="mx-auto bg-white border border-neutral-200 rounded px-4 py-0.5 text-[9px] text-neutral-400 font-mono w-1/2 text-center truncate">
                  app.iprixmedia.com/dashboard
                </div>
              </div>
              <div className="relative overflow-hidden rounded-b-xl aspect-[16/10] bg-neutral-50">
                <Image 
                  src="/seller-dashboard.png" 
                  alt="A+ Studio Seller Dashboard" 
                  fill 
                  className="object-cover object-top hover:scale-[1.02] transition-transform duration-500" 
                  priority
                />
              </div>
            </div>

            {/* Floating Live Indicator Badge */}
            <div className="absolute -right-4 -top-4 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 shadow-lg flex items-center gap-2 z-20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider">A+ AI Agent Active</span>
            </div>

            {/* Floating Meesho Listing Preview Card (Layered on top of the dashboard screenshot) */}
            <div className="absolute -left-6 -bottom-6 w-72 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl z-20 hidden md:block hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Image src="/icon/Meesho_logo.png" alt="Meesho" width={16} height={16} className="object-contain rounded" />
                  <span className="font-bold text-neutral-800 text-xs">Meesho Listing Preview</span>
                </div>
                <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-800">92 Score</span>
              </div>
              <div className="space-y-2">
                {["Product Title", "MRP & Selling Price", "SKU & Keywords"].map((field) => (
                  <div key={field} className="flex justify-between items-center rounded-xl border border-neutral-50 bg-neutral-50/70 px-3 py-2 text-[10px]">
                    <span className="text-neutral-500 font-medium">{field}</span>
                    <span className="text-neutral-900 font-bold flex items-center gap-1">
                      <svg className="w-3 h-3 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Ready to Autofill
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: WORKFLOW STEPS ── */}
      <section className="relative py-24 bg-white border-t border-neutral-100">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-5">
              <Icons.Sparkles />
              Seller Automation Workflow
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight mb-4">
              Built for the <span className="underline decoration-neutral-950 underline-offset-4">repetitive seller workflow.</span>
            </h2>
            <p className="text-base lg:text-lg text-neutral-600 leading-relaxed">
              Save once, generate with AI, preview with confidence, and track every seller operation from one place.
            </p>
          </div>

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Desktop Connecting Line */}
            <div className="absolute top-[48px] left-[12%] right-[12%] h-0.5 bg-neutral-200 z-0 hidden lg:block" />

            {/* Card 1 */}
            <article className="relative z-10 flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-400 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Step 1</span>
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100">
                    <Icons.Database />
                  </div>
                </div>
                <h3 className="font-bold text-neutral-800 text-sm leading-snug mb-2">Save product data and marketplace selectors once.</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">Store reusable product details and selectors to speed up future listings.</p>
              </div>
            </article>

            {/* Card 2 (Highlighted Monochrome) */}
            <article className="relative z-10 flex flex-col justify-between rounded-2xl border border-neutral-200 shadow-md bg-white p-6 shadow-md hover:shadow-lg transition-all group">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-bold text-white bg-neutral-900 px-2.5 py-1 rounded-full uppercase tracking-wider">Step 2</span>
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 flex items-center justify-center text-white shadow-md">
                    <Icons.Sparkles />
                  </div>
                </div>
                <h3 className="font-bold text-neutral-900 text-sm leading-snug mb-2">Generate title, description, bullets, SKU and keywords with AI.</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">Create optimized marketplace-ready content in seconds.</p>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-900 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                  AI Powered
                </span>
              </div>
            </article>

            {/* Card 3 */}
            <article className="relative z-10 flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-400 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Step 3</span>
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100">
                    <Icons.Eye />
                  </div>
                </div>
                <h3 className="font-bold text-neutral-800 text-sm leading-snug mb-2">Preview every value inside the Chrome extension before autofill.</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">Review and confirm all values before pushing them live.</p>
              </div>
            </article>

            {/* Card 4 */}
            <article className="relative z-10 flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-400 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Step 4</span>
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100">
                    <Icons.Chart />
                  </div>
                </div>
                <h3 className="font-bold text-neutral-800 text-sm leading-snug mb-2">Track usage, credits, payments, team activity and admin logs.</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Centralize analytics, billing, team activity and admin visibility.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: COMPLETE SAAS MODULES ── */}
      <section className="relative py-24 bg-neutral-50 border-y border-neutral-200">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-white text-xs font-bold text-neutral-800 uppercase tracking-wider mb-5">
              <Icons.Database />
              Core Platform Modules
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight mb-4">
              Complete <span className="underline decoration-neutral-950 underline-offset-4">SaaS modules</span>
            </h2>
            <p className="text-base lg:text-lg text-neutral-600 leading-relaxed">
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
              <article key={idx} className="flex flex-col justify-between rounded-3xl border border-neutral-200/85 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-neutral-400 transition-all duration-300 group overflow-hidden">
                <div className="p-5 bg-gradient-to-br from-neutral-50 to-neutral-100/50 border-b border-neutral-100 flex items-center justify-center relative aspect-[16/10] overflow-hidden">
                  <div className="relative w-full h-full rounded-xl overflow-hidden border border-neutral-200/65 shadow-sm bg-white">
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
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
                        {module.icon}
                      </div>
                      <h3 className="font-bold text-neutral-900 text-lg leading-tight">{module.title}</h3>
                    </div>
                    <p className="text-sm text-neutral-500 leading-relaxed">{module.desc}</p>
                  </div>
                  <div className="flex justify-end mt-6">
                    <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                      <Icons.ArrowRight />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE FEATURES (12 CARDS GRID) ── */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-5">
              <Icons.Sparkles />
              Core Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight mb-4">Features</h2>
            <p className="text-base lg:text-lg text-neutral-600 leading-relaxed">
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
              <article key={idx} className="flex gap-4 p-5 rounded-2xl border border-neutral-200 bg-white/70 shadow-sm hover:shadow-md hover:border-neutral-400 transition-all group relative items-start">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-neutral-850 text-sm leading-snug mb-1">{feature.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed pr-8">{feature.desc}</p>
                </div>
                <div className="absolute bottom-5 right-5 w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CHROME EXTENSION ── */}
      <section className="relative py-24 bg-neutral-50 border-t border-neutral-200 overflow-hidden" id="chrome-extension">
        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-800 mb-6">
                <Image src="/icon/chrome.jpg" alt="Chrome logo" width={16} height={16} className="object-contain" />
                A+ Studio Chrome Extension
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 mb-6">
                A+ Studio <span className="underline decoration-neutral-950 underline-offset-4">Chrome Extension</span>
              </h2>
              <p className="text-base lg:text-lg text-neutral-600 leading-relaxed mb-8">
                Manifest V3 extension with login, plan status, templates, products, Meesho detection, template capture, autofill preview and activity logs.
              </p>
              
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { label: "Manifest V3", icon: <Icons.Shield /> },
                  { label: "Secure & Private", icon: <Icons.Lock /> },
                  { label: "Fast & Lightweight", icon: <Icons.Bolt /> },
                  { label: "Auto-detect Marketplace", icon: <Icons.Check /> },
                ].map((pill, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700">
                    {pill.icon}
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Chrome extension floating popup mockup inside marketplace bg */}
            <div className="relative">
              <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden aspect-[4/3] flex flex-col">
                {/* Browser top header */}
                <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-neutral-300" />
                    <span className="w-3 h-3 rounded-full bg-neutral-300" />
                    <span className="w-3 h-3 rounded-full bg-neutral-300" />
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-md px-3 py-0.5 text-[10px] text-neutral-400 w-1/2 text-center select-none truncate">
                    seller.meesho.com
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={16} height={16} className="object-contain" />
                  </div>
                </div>

                {/* Browser content rendering chrome-extension-preview */}
                <div className="relative flex-grow bg-neutral-100 overflow-hidden">
                  <Image 
                    src="/chrome-extension-preview.png" 
                    alt="A+ Studio Chrome Extension Preview" 
                    fill 
                    className="object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                  />
                  {/* Floating Extension Popup UI simulation side-by-side or layered overlay */}
                  <div className="absolute right-4 top-4 bottom-4 w-72 rounded-xl border border-neutral-200/90 bg-white/95 backdrop-blur-md shadow-2xl p-4.5 z-20 flex flex-col justify-between hidden md:flex">
                    <div>
                      {/* Extension Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-3">
                        <div className="flex items-center gap-2">
                          <Image src="/icon/iprix-media-white-logo.webp" alt="Iprix Logo" width={16} height={16} className="object-contain invert" />
                          <span className="font-bold text-xs text-neutral-900 tracking-tight">A+ Studio</span>
                        </div>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200/60 text-[9px] font-extrabold text-neutral-800 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
                          Active
                        </span>
                      </div>

                      {/* Marketplace detected status */}
                      <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Detected Site</p>
                          <p className="font-extrabold text-sm text-neutral-900">Meesho Seller Portal</p>
                        </div>
                        <span className="bg-neutral-900 text-white font-extrabold text-[9px] px-2 py-0.5 rounded">Live</span>
                      </div>

                      {/* Info details */}
                      <div className="space-y-2 mb-5">
                        <div className="flex justify-between text-xs border-b border-neutral-50 pb-1.5">
                          <span className="text-neutral-500 font-medium">Pricing Plan</span>
                          <span className="font-bold text-neutral-800">Pro (Yearly)</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-neutral-50 pb-1.5">
                          <span className="text-neutral-500 font-medium">Daily Limit</span>
                          <span className="font-bold text-neutral-800">150 / 500 Credits</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 mb-2">
                        <button className="w-full py-2.5 bg-neutral-950 text-white text-xs font-bold rounded-lg hover:bg-neutral-850 active:scale-[0.98] transition-all shadow-sm">
                          Capture Listing Template
                        </button>
                        <button className="w-full py-2.5 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-lg bg-white hover:bg-neutral-50 active:scale-[0.98] transition-all">
                          Autofill Form Now
                        </button>
                      </div>
                    </div>

                    {/* Bottom Nav inside extension */}
                    <div className="flex justify-between border-t border-neutral-100 pt-3 mt-3 text-[9px] font-bold text-neutral-400">
                      <div className="text-neutral-900 flex flex-col items-center gap-1 cursor-pointer"><span className="text-xs">🏠</span>Home</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-neutral-800"><span className="text-xs">📋</span>Templates</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-neutral-800"><span className="text-xs">📦</span>Products</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-neutral-800"><span className="text-xs">⚡</span>Activity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three large marketplace cards below */}
          <div className="grid gap-6 md:grid-cols-3 mb-16">
            {/* Card 1 */}
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/Meesho_logo.png" alt="Meesho" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-800">LIVE</span>
                </div>
                <h3 className="font-bold text-neutral-900 text-lg leading-tight mb-2">Meesho live</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  The extension never stores backend secrets and never auto-submits marketplace forms.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-neutral-50">
                <span className="w-12 h-[3px] bg-neutral-900 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/flipkart-icon.png" alt="Flipkart" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-800">BETA</span>
                </div>
                <h3 className="font-bold text-neutral-900 text-lg leading-tight mb-2">Flipkart beta</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  The extension never stores backend secrets and never auto-submits marketplace forms.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-neutral-50">
                <span className="w-12 h-[3px] bg-neutral-400 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/amazon.jpg" alt="Amazon" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-800">COMING SOON</span>
                </div>
                <h3 className="font-bold text-neutral-900 text-lg leading-tight mb-2">Amazon Coming Soon</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  The extension never stores backend secrets and never auto-submits marketplace forms.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-neutral-50">
                <span className="w-12 h-[3px] bg-neutral-200 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Trust Strip */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200">
                  <Icons.Shield />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-xs">100% Secure</h4>
                  <p className="text-[10px] text-neutral-500">No backend secrets stored in the extension</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200">
                  <Icons.Lock />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-xs">Privacy First</h4>
                  <p className="text-[10px] text-neutral-500">Your data is safe and always encrypted</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200">
                  <Icons.Bolt />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-xs">High Performance</h4>
                  <p className="text-[10px] text-slate-500">Lightweight extension with blazing fast speed</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200">
                  <Icons.Clock />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 text-xs">Activity Logs</h4>
                  <p className="text-[10px] text-neutral-500">Detailed logs for every action you take</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING PLANS ── */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-4">Pricing plans for every seller</h2>
            <p className="text-base text-neutral-600 leading-relaxed">
              Start free, upgrade as you grow. Fully automated Meesho and Flipkart listings.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {pricingPlans.map((plan) => (
              <article key={plan.slug} className={`rounded-2xl border p-6 flex flex-col justify-between transition-all group ${
                plan.featured ? "border border-neutral-200 shadow-md bg-white shadow-md" : "border-neutral-200 bg-white/70 shadow-sm"
              }`}>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-neutral-500 mb-4">{plan.yearlyDiscount}</p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-extrabold text-neutral-900">₹{plan.monthlyPrice}</span>
                    <span className="text-neutral-400 text-xs ml-1">/mo</span>
                  </div>
                  <div className="border-t border-neutral-100 pt-4 space-y-2 mb-8">
                    <div className="text-xs font-semibold text-neutral-700">AI Listings: {plan.listings}</div>
                    <div className="text-xs font-semibold text-neutral-700">Products: {plan.productLimit}</div>
                    <div className="text-xs font-semibold text-neutral-700">Team: {plan.team}</div>
                  </div>
                </div>
                <Link className={`mt-auto flex w-full justify-center items-center py-2.5 rounded-xl text-xs font-bold transition-all ${
                  plan.featured ? "bg-neutral-900 text-white hover:bg-neutral-800" : "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50"
                }`} href="/signup">
                  Choose Plan
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
