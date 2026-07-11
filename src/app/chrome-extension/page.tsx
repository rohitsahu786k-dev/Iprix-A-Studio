import type { Metadata } from "next";
import Image from "next/image";
import { Box, Home as HomeIcon, Layers, Zap as ZapIcon } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Meesho & Flipkart Autofill Extension",
  description: "Download the A+ Studio Chrome Extension. Save templates and automatically autofill seller forms inside Meesho, Flipkart, and Amazon listing panels.",
  keywords: ["Autofill Chrome Extension", "Meesho seller extension", "Flipkart automation tool", "Amazon seller assistant"],
  alternates: { canonical: "/chrome-extension" },
  openGraph: {
    title: "Meesho, Flipkart & Amazon Listing Autofill Chrome Extension | A+ Studio",
    description: "Download the A+ Studio Chrome Extension. Save templates and automatically autofill seller forms inside Meesho, Flipkart, and Amazon listing panels.",
    url: "https://aplusstudio.iprixmedia.com/chrome-extension",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://aplusstudio.iprixmedia.com/chrome-extension-preview.png", width: 1200, height: 630, alt: "Chrome Extension Preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meesho & Flipkart Autofill Extension | A+ Studio",
    description: "Download the A+ Studio Chrome Extension. Save templates and automatically autofill seller forms inside Meesho, Flipkart, and Amazon listing panels.",
    images: ["https://aplusstudio.iprixmedia.com/chrome-extension-preview.png"],
  },
};

// Minimalist vector icons using currentColor (monochrome/indigo)
const Icons = {
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
  Clock: () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

export default function ChromeExtensionPage() {
  return (
    <PublicShell>
      <section className="relative py-24 bg-zinc-950 overflow-hidden border-b border-zinc-900">
        {/* Premium Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ececef_1px,transparent_1px),linear-gradient(to_bottom,#ececef_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-950/20 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
        
        <div className="container relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-semibold text-zinc-300 mb-6">
                <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={16} height={16} className="object-contain rounded" />
                A+ Studio Chrome Extension
              </div>
              <h1 className="text-5xl lg:text-[64px] font-extrabold tracking-tight text-zinc-100 mb-6 leading-[1.1]">
                Automate listings with our <span className="underline decoration-indigo-500 underline-offset-4 decoration-4">Chrome Extension</span>
              </h1>
              <p className="text-lg lg:text-xl text-zinc-400 leading-relaxed mb-8 max-w-2xl">
                Deploy the Manifest V3 extension to capture listing templates in 1-click, preview AI autofill attributes, and instantly populate listing forms on seller portals.
              </p>
              
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { label: "Manifest V3", icon: <Icons.Shield /> },
                  { label: "Secure & Private", icon: <Icons.Lock /> },
                  { label: "Fast & Lightweight", icon: <Icons.Bolt /> },
                  { label: "Auto-detect Site", icon: <Icons.Check /> },
                ].map((pill, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-zinc-900 bg-zinc-900/30 text-xs font-bold text-zinc-300 shadow-sm">
                    {pill.icon}
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Chrome extension floating popup mockup inside marketplace bg */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl opacity-80 -z-10 animate-pulse" />
              
              {/* Browser mockup box */}
              <div className="relative rounded-3xl border border-zinc-850 bg-zinc-900/80 p-2 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col hover:shadow-2xl transition-all duration-300">
                {/* Browser top header */}
                <div className="bg-zinc-950 border-b border-zinc-850 px-4 py-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-zinc-800" />
                    <span className="w-3 h-3 rounded-full bg-zinc-800" />
                    <span className="w-3 h-3 rounded-full bg-zinc-800" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded px-3 py-0.5 text-[10px] text-zinc-500 w-1/2 text-center select-none truncate">
                    seller.meesho.com
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={16} height={16} className="object-contain rounded" />
                  </div>
                </div>

                {/* Browser content rendering chrome-extension-preview */}
                <div className="relative flex-grow bg-zinc-950 overflow-hidden">
                  <Image 
                    src="/chrome-extension-preview.png" 
                    alt="A+ Studio Chrome Extension Preview" 
                    fill 
                    className="object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                  />
                  {/* Floating Extension Popup UI simulation */}
                  <div className="absolute right-4 top-4 bottom-4 w-72 rounded-2xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-4.5 z-20 flex flex-col justify-between hidden md:flex">
                    <div>
                      {/* Extension Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-850 mb-3">
                        <div className="flex items-center gap-2">
                          <Image src="/iprix-media-white-logo.webp" alt="Iprix Logo" width={16} height={16} className="object-contain" />
                          <span className="font-extrabold text-xs text-zinc-100 tracking-tight">A+ Studio</span>
                        </div>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-850 border border-zinc-800 text-[9px] font-extrabold text-zinc-300 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </div>

                      {/* Marketplace detected status */}
                      <div className="bg-zinc-950/70 border border-zinc-850 rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Detected Site</p>
                          <p className="font-extrabold text-sm text-zinc-100">Meesho Seller Portal</p>
                        </div>
                        <span className="bg-indigo-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded">Live</span>
                      </div>

                      {/* Info details */}
                      <div className="space-y-2 mb-5">
                        <div className="flex justify-between text-xs border-b border-zinc-850 pb-1.5">
                          <span className="text-zinc-500 font-medium">Pricing Plan</span>
                          <span className="font-bold text-zinc-300">Pro (Yearly)</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-zinc-850 pb-1.5">
                          <span className="text-zinc-500 font-medium">Daily Limit</span>
                          <span className="font-bold text-zinc-300">150 / 500 Credits</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 mb-2">
                        <button className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-lg hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all shadow-md shadow-indigo-550/10">
                          Capture Listing Template
                        </button>
                        <button className="w-full py-2.5 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] transition-all">
                          Autofill Form Now
                        </button>
                      </div>
                    </div>

                    {/* Bottom Nav inside extension */}
                    <div className="flex justify-between border-t border-zinc-850 pt-3 mt-3 text-[9px] font-bold text-zinc-500">
                      <div className="text-zinc-300 flex flex-col items-center gap-1 cursor-pointer"><HomeIcon className="h-3.5 w-3.5" /> Home</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-zinc-350"><Layers className="h-3.5 w-3.5" /> Templates</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-zinc-350"><Box className="h-3.5 w-3.5" /> Products</div>
                      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-zinc-350"><ZapIcon className="h-3.5 w-3.5" /> Activity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three large marketplace cards below */}
          <div className="grid gap-6 md:grid-cols-3 mb-16">
            {/* Card 1 */}
            <article className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/Meesho_logo.png" alt="Meesho" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-extrabold text-zinc-300 uppercase tracking-widest">LIVE</span>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-lg leading-tight mb-2">Meesho Integration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Autofill single or bulk product catalog forms on Meesho Seller Panel instantly with captured templates.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
                <span className="w-12 h-[3px] bg-indigo-500 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 group-hover:border-zinc-700 group-hover:bg-zinc-850 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/flipkart-icon.png" alt="Flipkart" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-extrabold text-zinc-350 uppercase tracking-widest">BETA</span>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-lg leading-tight mb-2">Flipkart Integration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Beta integration supporting description enrichments, size variations, and automated pricing calculations.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
                <span className="w-12 h-[3px] bg-zinc-755 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 group-hover:border-zinc-700 group-hover:bg-zinc-850 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/amazon.jpg" alt="Amazon" fill className="object-contain rounded-md" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">COMING SOON</span>
                </div>
                <h3 className="font-extrabold text-zinc-100 text-lg leading-tight mb-2">Amazon Integration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Coming soon: Automate inventory template sheets, high-quality images, and bullet point generation directly.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
                <span className="w-12 h-[3px] bg-zinc-800 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 group-hover:border-zinc-700 group-hover:bg-zinc-850 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Trust Strip */}
          <div className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-8 shadow-sm">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-900">
                  <Icons.Shield />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm mb-1">100% Secure</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">No backend secrets or API keys stored locally in the extension</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-900">
                  <Icons.Lock />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm mb-1">Privacy First</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">Your data is safe, fully encrypted, and complies with MV3 policies</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-900">
                  <Icons.Bolt />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm mb-1">High Performance</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">Lightweight background worker with sub-second form fill speed</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center flex-shrink-0 border border-zinc-900">
                  <Icons.Clock />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm mb-1">Activity Logs</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">Audit trail of every template saved, populated, or modified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Long-form SEO section */}
      <section className="bg-zinc-950 border-t border-zinc-900">
        <div className="container py-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-zinc-100 mb-10 text-center">How the A+ Studio Chrome Extension works</h2>
          <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
            <div>
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Installation and setup</h3>
              <p>
                Download the A+ Studio Chrome extension from the Chrome Web Store or install it as an unpacked extension from your A+ Studio dashboard. Once installed, you will see the A+ Studio icon appear in your Chrome toolbar. Log in using your A+ Studio credentials — the same email and password you use on the website. The extension connects to your account in real time so your saved templates are always in sync.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Autofilling Meesho listings</h3>
              <p>
                Open the Meesho supplier panel and navigate to the catalog listing form. Click the A+ Studio extension icon to open the sidebar, select the template that matches your product, then click Autofill. The extension reads every visible field — product title, price, description, colour, size, material, weight and all category-specific attributes — and fills them automatically. It handles multi-size grids, dropdowns and radio buttons that are standard across Meesho’s 1,000+ categories.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Template capture and reuse</h3>
              <p>
                When you manually fill in a Meesho or Flipkart listing form, the A+ Studio extension can capture all the field values into a reusable template with a single click. This means you never have to type the same product attributes twice. Build a library of templates for your most common product categories and variants — the extension saves them to your account so they are available across devices and browser sessions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Flipkart beta support</h3>
              <p>
                The A+ Studio Chrome extension also supports Flipkart’s seller hub listing forms in beta mode. It captures and fills fields including product name, brand, description, HSN code, MRP, selling price and key attributes across Flipkart’s categories. Full Flipkart support — including all category-specific attribute grids — is in active development and rolling out progressively.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-200 mb-3">Security and privacy</h3>
              <p>
                The A+ Studio extension never auto-submits a form, never reads your bank or payment data, and never captures data from pages unrelated to marketplace listing forms. It only activates on whitelisted domains — Meesho’s supplier panel, Flipkart’s seller hub, and the A+ Studio dashboard. All communication between the extension and our servers uses HTTPS. Your login session is stored in a secure HTTP-only cookie — never in localStorage or extension storage.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
