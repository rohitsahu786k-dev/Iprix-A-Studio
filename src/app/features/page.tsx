import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = { title: "Features | A+ Studio" };

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
  ArrowRight: () => (
    <svg className="w-4 h-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
};

export default function FeaturesPage() {
  const features = [
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
  ];

  return (
    <PublicShell>
      <section className="container py-20 bg-white">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-5">
            <Icons.Sparkles />
            Platform Capabilities
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tight mb-4">
            Powerful features built for <span className="underline decoration-neutral-950 underline-offset-4">listing automation.</span>
          </h1>
          <p className="text-base lg:text-lg text-neutral-600 leading-relaxed">
            Everything you need to create, optimize, automate and manage marketplace listings at scale.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <article key={idx} className="flex gap-4 p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-neutral-450 transition-all group relative items-start">
              <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                {feature.icon}
              </div>
              <div className="flex-grow">
                <h2 className="font-bold text-neutral-850 text-base leading-snug mb-1">{feature.title}</h2>
                <p className="text-xs text-neutral-500 leading-relaxed pr-8">{feature.desc}</p>
              </div>
              <div className="absolute bottom-5 right-5 w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                <Icons.ArrowRight />
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
