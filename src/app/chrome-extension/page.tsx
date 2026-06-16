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
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-800 mb-6">
                <Image src="/icon/chrome.jpg" alt="Chrome Logo" width={16} height={16} className="object-contain" />
                A+ Studio Chrome Extension
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6 leading-tight">
                Automate listings with the <span className="underline decoration-neutral-950 underline-offset-4">Chrome Extension</span>
              </h1>
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
              {/* Browser mockup box */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden aspect-[4/3] flex flex-col">
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

                {/* Simulated Marketplace content layout */}
                <div className="flex-grow p-4 bg-neutral-50/50 relative flex gap-4">
                  <div className="w-2/3 space-y-3 opacity-30 select-none">
                    <div className="h-6 bg-neutral-200 rounded w-1/2" />
                    <div className="h-10 bg-neutral-200 rounded" />
                    <div className="h-10 bg-neutral-200 rounded" />
                    <div className="h-10 bg-neutral-200 rounded" />
                  </div>

                  {/* Floating Extension Popup UI inside browser */}
                  <div className="absolute right-4 top-4 w-72 rounded-xl border border-neutral-200 bg-white shadow-2xl p-4 z-20 flex flex-col justify-between">
                    <div>
                      {/* Extension Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center text-white text-[10px] font-bold">A+</div>
                          <span className="font-extrabold text-xs text-neutral-800">A+ Studio</span>
                        </div>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-50 border border-neutral-200 text-[9px] font-bold text-neutral-800 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                          Active
                        </span>
                      </div>

                      {/* Marketplace detected status */}
                      <div className="bg-neutral-50 border border-neutral-150 rounded-lg p-2.5 mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] text-neutral-500 font-semibold uppercase tracking-wider">Marketplace Detected</p>
                          <p className="font-extrabold text-sm text-neutral-900">Meesho</p>
                        </div>
                        <span className="bg-neutral-950 text-white font-bold text-[9px] px-2 py-0.5 rounded-md">Live</span>
                      </div>

                      {/* Info details */}
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-neutral-500">Plan:</span>
                          <span className="font-bold text-neutral-800">Pro</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-neutral-500">Renewal date:</span>
                          <span className="font-bold text-neutral-800">24 Jun 2026</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 mb-2">
                        <button className="w-full py-2 bg-neutral-950 text-white text-xs font-bold rounded-lg hover:bg-neutral-900 transition-colors">
                          Capture Template
                        </button>
                        <button className="w-full py-2 border border-neutral-250 text-neutral-700 text-xs font-bold rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                          Autofill Preview
                        </button>
                      </div>
                    </div>

                    {/* Bottom Nav inside extension */}
                    <div className="flex justify-between border-t border-slate-100 pt-2 mt-2 text-[8px] font-bold text-neutral-400">
                      <div className="text-neutral-900 flex flex-col items-center"><span className="text-xs">🏠</span>Home</div>
                      <div className="flex flex-col items-center"><span className="text-xs">📋</span>Templates</div>
                      <div className="flex flex-col items-center"><span className="text-xs">📦</span>Products</div>
                      <div className="flex flex-col items-center"><span className="text-xs">⚡</span>Activity</div>
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
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
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
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
    </PublicShell>
  );
}
