import type { Metadata } from "next";
import Image from "next/image";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = { title: "Chrome Extension | A+ Studio" };

// Minimalist vector icons using currentColor (monochrome)
const Icons = {
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
  Clock: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

export default function ChromeExtensionPage() {
  return (
    <PublicShell>
      <section className="relative py-24 bg-white overflow-hidden border-b border-neutral-100">
        {/* Premium Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80 pointer-events-none" />
        
        <div className="container relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200/80 bg-neutral-50 text-xs font-semibold text-neutral-800 mb-6">
                <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={16} height={16} className="object-contain" />
                A+ Studio Chrome Extension
              </div>
              <h1 className="text-5xl lg:text-[64px] font-extrabold tracking-tight text-neutral-900 mb-6 leading-[1.1]">
                Automate listings with our <span className="underline decoration-neutral-950 underline-offset-4 decoration-4">Chrome Extension</span>
              </h1>
              <p className="text-lg lg:text-xl text-neutral-600 leading-relaxed mb-8 max-w-2xl">
                Deploy the Manifest V3 extension to capture listing templates in 1-click, preview AI autofill attributes, and instantly populate listing forms on seller portals.
              </p>
              
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  { label: "Manifest V3", icon: <Icons.Shield /> },
                  { label: "Secure & Private", icon: <Icons.Lock /> },
                  { label: "Fast & Lightweight", icon: <Icons.Bolt /> },
                  { label: "Auto-detect Marketplace", icon: <Icons.Check /> },
                ].map((pill, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-800 shadow-sm">
                    {pill.icon}
                    {pill.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Chrome extension floating popup mockup inside marketplace bg */}
            <div className="relative">
              {/* Browser mockup box */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden aspect-[4/3] flex flex-col hover:shadow-2xl transition-all duration-300">
                {/* Browser top header */}
                <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-neutral-300" />
                    <span className="w-3 h-3 rounded-full bg-neutral-300" />
                    <span className="w-3 h-3 rounded-full bg-neutral-300" />
                  </div>
                  <div className="bg-white border border-neutral-200/80 rounded-md px-3 py-0.5 text-[10px] text-neutral-400 w-1/2 text-center select-none truncate">
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
                  {/* Floating Extension Popup UI simulation */}
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
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-neutral-400 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/Meesho_logo.png" alt="Meesho" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-800">LIVE</span>
                </div>
                <h3 className="font-extrabold text-neutral-900 text-lg leading-tight mb-2">Meesho Integration</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Autofill single or bulk product catalog forms on Meesho Seller Panel instantly with captured templates.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="w-12 h-[3px] bg-neutral-900 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-neutral-400 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/flipkart-icon.png" alt="Flipkart" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-800">BETA</span>
                </div>
                <h3 className="font-extrabold text-neutral-900 text-lg leading-tight mb-2">Flipkart Integration</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Beta integration supporting description enrichments, size variations, and automated pricing calculations.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="w-12 h-[3px] bg-neutral-400 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-neutral-400 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-24 h-8">
                    <Image src="/icon/amazon.jpg" alt="Amazon" fill className="object-contain" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-800">COMING SOON</span>
                </div>
                <h3 className="font-extrabold text-neutral-900 text-lg leading-tight mb-2">Amazon Integration</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  Coming soon: Automate inventory template sheets, high-quality images, and bullet point generation directly.
                </p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="w-12 h-[3px] bg-neutral-200 rounded-full" />
                <div className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:border-neutral-300 group-hover:bg-neutral-50 transition-colors">
                  <Icons.ArrowRight />
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Trust Strip */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center flex-shrink-0 border border-neutral-100">
                  <Icons.Shield />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">100% Secure</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">No backend secrets or API keys stored locally in the extension</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center flex-shrink-0 border border-neutral-100">
                  <Icons.Lock />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">Privacy First</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">Your data is safe, fully encrypted, and complies with MV3 policies</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center flex-shrink-0 border border-neutral-100">
                  <Icons.Bolt />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">High Performance</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Lightweight background worker with sub-second form fill speed</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center flex-shrink-0 border border-neutral-100">
                  <Icons.Clock />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm mb-1">Activity Logs</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">Audit trail of every template saved, populated, or modified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
