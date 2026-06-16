import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About A+ Studio by Iprix Media | Seller Automation Mission",
  description: "Learn more about Iprix Media and A+ Studio's mission to streamline listing creation and inventory onboarding for Indian marketplace sellers.",
  keywords: ["Iprix Media", "About A+ Studio", "Udaipur Rajasthan IT", "e-commerce seller automation team"],
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About A+ Studio by Iprix Media | Seller Automation Mission",
    description: "Learn more about Iprix Media and A+ Studio's mission to streamline listing creation and inventory onboarding for Indian marketplace sellers.",
    url: "https://iprixmedia.com/about",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "About A+ Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About A+ Studio by Iprix Media | Seller Automation Mission",
    description: "Learn more about Iprix Media and A+ Studio's mission to streamline listing creation and inventory onboarding for Indian marketplace sellers.",
    images: ["https://iprixmedia.com/seller-dashboard.png"],
  },
};

// Minimalist vector icons using currentColor (monochrome)
const Icons = {
  Sparkles: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.736L20 10.5l-6.088 1.764L12 18l-1.912-5.736L4 10.5l6.088-1.764L12 3z" />
      <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
    </svg>
  ),
  Database: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="container py-20 bg-white">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-5">
            <Icons.Sparkles />
            About Iprix Media
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6 leading-tight">
            Pioneering seller workflow <span className="underline decoration-neutral-950 underline-offset-4">automation.</span>
          </h1>
          <p className="text-base lg:text-lg leading-8 text-neutral-500 max-w-2xl mx-auto">
            Iprix Media is founded by {brand.founders}, based in {brand.address}, with {brand.experience}. Our mission
            is to help Indian sellers automate listing workflows with AI, clean software, Chrome automation and practical
            seller tools.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {[
            { title: "AI seller tools", icon: <Icons.Sparkles />, desc: "Focused on marketplace operators who need speed, accuracy and repeatable workflows." },
            { title: "Automation systems", icon: <Icons.Database />, desc: "Engineering lightweight chrome tools and background processors that run efficiently." },
            { title: "Digital growth", icon: <Icons.Chart />, desc: "Empowering scaling Indian merchants to double their listing output without adding overhead." },
          ].map((item, idx) => (
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-400 transition-all flex flex-col justify-between" key={idx}>
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mb-2">{item.title}</h2>
                <p className="text-xs leading-relaxed text-neutral-500">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
