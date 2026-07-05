import type { Metadata } from "next";
import Image from "next/image";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Seller Automation & AI Listing Features | A+ Studio",
  description: "Explore AI Content Studio, bulk product uploads, PDF label analyser, and Chrome extension autofill features for Meesho, Flipkart, and Amazon sellers.",
  keywords: ["A+ Studio features", "AI Content Studio", "PDF Label Analyser", "bulk listing upload", "marketplace listing tools"],
  alternates: { canonical: "/features" },
  openGraph: {
    title: "Seller Automation & AI Listing Features | A+ Studio",
    description: "Explore AI Content Studio, bulk product uploads, PDF label analyser, and Chrome extension autofill features for Meesho, Flipkart, and Amazon sellers.",
    url: "https://iprixmedia.com/features",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://iprixmedia.com/ai-content.png", width: 1200, height: 630, alt: "AI Content Studio Features" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seller Automation & AI Listing Features | A+ Studio",
    description: "Explore AI Content Studio, bulk product uploads, PDF label analyser, and Chrome extension autofill features for Meesho, Flipkart, and Amazon sellers.",
    images: ["https://iprixmedia.com/ai-content.png"],
  },
};

// Minimalist vector icons using currentColor (indigo)
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
};

export default function FeaturesPage() {
  const features = [
    { title: "Reusable listing templates", icon: <Icons.FileText />, desc: "Design custom listing schemas for Meesho, Flipkart, and Amazon to capture and replicate winning setups." },
    { title: "Product library", icon: <Icons.Box />, desc: "Organize catalog listings, track live stock statuses, and store high-resolution marketing assets in one central library." },
    { title: "Smart listing bulk generator", icon: <Icons.Bolt />, desc: "Process thousands of SKU combinations simultaneously to launch seasonal product collections in bulk." },
    { title: "AI content writer", icon: <Icons.Sparkles />, desc: "Generate optimized product titles, detailed feature bullet points, and highly persuasive descriptions in seconds." },
    { title: "AI keyword research", icon: <Icons.Eye />, desc: "Extract top-performing search terms directly from customer search volumes and competitive marketplace analytics." },
    { title: "Label analyser", icon: <Icons.Tag />, desc: "Perform intelligent validation checks to ensure listing labels adhere to strict legal and platform guidelines." },
    { title: "Image maker", icon: <Icons.Image />, desc: "Create polished product banner visuals, clean backgrounds, and generate contextual lifestyle graphics automatically." },
    { title: "Marketplace compliance score", icon: <Icons.Shield />, desc: "Audit product catalogs against marketplace ranking criteria to maximize visibility and reduce returns." },
    { title: "SKU generator", icon: <Icons.Barcode />, desc: "Automatically generate unique, structured barcode IDs and SKUs matching your warehouse taxonomy." },
    { title: "Team collaboration", icon: <Icons.Users />, desc: "Collaborate seamlessly with managers, content creators, and dispatch operators using robust role permissions." },
    { title: "CSV import/export", icon: <Icons.Download />, desc: "Seamlessly sync your existing inventory sheets and upload bulk updates using standard CSV configurations." },
    { title: "Chrome extension autofill", icon: <Icons.Chrome />, desc: "Inject generated titles, attributes, pricing, and images directly into active marketplace forms in 1-click." },
  ];

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-zinc-950 py-24 border-b border-zinc-900">
        {/* Premium Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ececef_1px,transparent_1px),linear-gradient(to_bottom,#ececef_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-950/20 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
        
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-305 uppercase tracking-widest mb-5">
              <Icons.Sparkles />
              Platform Capabilities
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-100 tracking-tight mb-6 leading-tight">
              Powerful features built for <span className="underline decoration-indigo-500 underline-offset-4 decoration-4">listing automation.</span>
            </h1>
            <p className="text-base lg:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Everything you need to create, optimize, automate and manage marketplace listings at scale.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <article key={idx} className="flex gap-4 p-6 rounded-3xl border border-zinc-900 bg-zinc-900/30 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-zinc-800 hover:bg-zinc-900/50 transition-all duration-300 group relative items-start">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-zinc-900">
                  {feature.icon}
                </div>
                <div className="flex-grow">
                  <h2 className="font-extrabold text-zinc-100 text-base leading-snug mb-1">{feature.title}</h2>
                  <p className="text-xs text-zinc-450 leading-relaxed pr-8">{feature.desc}</p>
                </div>
                <div className="absolute bottom-5 right-5 w-6 h-6 rounded-full border border-zinc-850 flex items-center justify-center bg-zinc-900 group-hover:border-zinc-700 group-hover:bg-zinc-850 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </article>
            ))}
          </div>

          {/* ── SHOWCASE SECTION ── */}
          <div className="mt-32 border-t border-zinc-900 pt-24 space-y-32">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-300 uppercase tracking-widest mb-5">
                Product Showcase
              </div>
              <h2 className="text-4xl font-extrabold text-zinc-100 tracking-tight mb-4">
                Visualizing the automation experience.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Take a closer look at the actual dashboards, AI writer panels, image optimization outputs, and Chrome extension overlays.
              </p>
            </div>

            {[
              {
                title: "AI Content Studio",
                subtitle: "High-Converting AI Listings",
                desc: "Generate listing content that matches Meesho, Flipkart, and Amazon search algorithms. Get instant access to title optimization, custom descriptions, bullet points, and search tags.",
                img: "/ai-content.png",
                badge: "AI Writer",
              },
              {
                title: "Chrome Extension Autofill",
                subtitle: "Autofill Marketplace Forms",
                desc: "Automatically sync templates and generated listing text fields directly inside active seller portal forms. Zero manual copy-pasting, zero formatting mistakes.",
                img: "/chrome-extension-preview.png",
                badge: "1-Click Autofill",
              },
              {
                title: "Image Resizer & Enhancer",
                subtitle: "1000x1000 Pixel Canvas",
                desc: "Enhance product catalog assets to meet marketplace requirements. Automatically crop, resize, clean backgrounds, and format graphics for high-quality previews.",
                img: "/image-optimization.png",
                badge: "Image Maker",
              },
              {
                title: "Seller Administration Dashboard",
                subtitle: "Quotas, Templates & Team Roles",
                desc: "Track active usage quotas, manage product template schemas, and collaborate with listing specialists using permission-controlled accounts.",
                img: "/admin-analytics.png",
                badge: "Workspace Analytics",
              },
            ].map((showcase, index) => (
              <div
                key={showcase.title}
                className={`grid gap-12 lg:grid-cols-2 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <span className="rounded-full bg-indigo-950 border border-indigo-900 px-3.5 py-1 text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">
                    {showcase.badge}
                  </span>
                  <h3 className="text-3xl font-extrabold text-zinc-100 mt-4">
                    {showcase.title}
                  </h3>
                  <p className="text-sm font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                    {showcase.subtitle}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-400 mt-4">
                    {showcase.desc}
                  </p>
                </div>
                <div className={`relative rounded-3xl border border-zinc-850 bg-zinc-900/80 p-2 shadow-2xl ${
                  index % 2 === 1 ? "lg:order-1" : ""
                }`}>
                  <div className="relative overflow-hidden rounded-2xl aspect-[16/10] bg-zinc-950">
                    <Image
                      src={showcase.img}
                      alt={showcase.title}
                      fill
                      className="object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
