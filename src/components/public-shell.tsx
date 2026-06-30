import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { brand, publicLinks } from "@/lib/brand";
import { BrandLogo, WideLogo } from "@/components/brand-logo";

import { getSession } from "@/lib/auth";

export async function PublicHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md transition-all duration-300">
      <div className="container flex min-h-[80px] items-center justify-between gap-6 relative">
        {/* Brand Logo */}
        <div className="flex items-center">
          <BrandLogo priority />
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-1.5 rounded-full border border-zinc-850 bg-zinc-900/40 p-1 text-sm font-semibold text-zinc-400 lg:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-full px-4.5 py-2 transition-all duration-200 hover:bg-zinc-800 hover:text-white hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons or User session details */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <Link 
                className="text-sm font-semibold text-zinc-350 hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group" 
                href="/dashboard"
              >
                Dashboard
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <div className="flex items-center gap-2 border-l border-zinc-850 pl-3">
                {/* Premium Stylized Indian Seller Avatar */}
                <svg className="h-7 w-7 rounded-full border border-zinc-850 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#18181B" />
                  {/* Hair */}
                  <path d="M6 16C6 9 10 6 16 6C22 6 26 9 26 16V18H6V16Z" fill="#27272A" />
                  {/* Face */}
                  <circle cx="16" cy="16" r="7" fill="#FDBA74" />
                  {/* Eyebrows */}
                  <path d="M12 13C13 12.5 14 12.5 14.5 13" stroke="#18181B" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M17.5 13C18 12.5 19 12.5 20 13" stroke="#18181B" strokeWidth="0.8" strokeLinecap="round" />
                  {/* Eyes */}
                  <circle cx="13.5" cy="14.5" r="0.8" fill="#18181B" />
                  <circle cx="18.5" cy="14.5" r="0.8" fill="#18181B" />
                  {/* Indian Bindi/Tilak */}
                  <circle cx="16" cy="12.5" r="0.6" fill="#DC2626" />
                  {/* Smile */}
                  <path d="M14 17.5C14.8 18.2 17.2 18.2 18 17.5" stroke="#18181B" strokeWidth="1" strokeLinecap="round" />
                  {/* Indian clothing (kurta neck) */}
                  <path d="M7 27C7 22.5 11 20 16 20C21 20 25 22.5 25 27H7Z" fill="#27272A" />
                  <path d="M14.5 20L16 22L17.5 20" stroke="#52525B" strokeWidth="0.75" />
                </svg>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] font-bold text-zinc-200 leading-none">{session.name}</span>
                  <span className="text-[8px] font-semibold text-zinc-550 mt-0.5 capitalize">{session.role}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link 
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group" 
                href="/login"
              >
                Login
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link 
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-550/10 hover:from-indigo-500 hover:to-violet-550 active:scale-[0.98] transition-all duration-200 group" 
                href="/signup"
              >
                Sign up
              </Link>
            </>
          )}

          {/* Mobile Navigation Dropdown Menu (Pure CSS Checkbox Toggle) */}
          <div className="relative lg:hidden">
            <input type="checkbox" id="mobile-menu-toggle" className="peer hidden" />
            <label 
              htmlFor="mobile-menu-toggle" 
              className="peer-checked:bg-zinc-800 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all select-none"
            >
              <svg className="h-4.5 w-4.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
            
            {/* Dropdown panel */}
            <div className="absolute right-0 top-11 z-50 w-48 origin-top-right rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2 shadow-xl backdrop-blur-md transition-all duration-300 transform scale-90 opacity-0 pointer-events-none peer-checked:scale-100 peer-checked:opacity-100 peer-checked:pointer-events-auto">
              <div className="flex flex-col gap-0.5">
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 pt-20 pb-12 text-zinc-400">
      <div className="container">
        {/* Top Section */}
        <div className="grid gap-12 pb-16 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] border-b border-zinc-900">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <WideLogo />
            <p className="text-sm leading-relaxed text-zinc-400 max-w-sm">
              A+ Studio by Iprix Media helps Indian sellers create, optimize, save and autofill marketplace listings with AI.
            </p>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2.5 text-xs font-bold text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              Secure seller automation workspace
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-100">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              {publicLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -ml-3.5 group-hover:ml-0 duration-200 text-indigo-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-100">Product</h3>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/chrome-extension", label: "Chrome Extension" },
                { href: "/features", label: "AI Tools" },
                { href: "/pricing", label: "Plans" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -ml-3.5 group-hover:ml-0 duration-200 text-indigo-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-100">Get In Touch</h3>
              <div className="grid gap-3 text-sm text-zinc-400">
                <a className="inline-flex items-center gap-2 hover:text-white transition-colors" href={`mailto:${brand.supportEmail}`}>
                  <Mail className="h-4 w-4 text-zinc-400" />
                  {brand.supportEmail}
                </a>
                <a className="inline-flex items-center gap-2 hover:text-white transition-colors" href={brand.whatsappUrl}>
                  <MessageCircle className="h-4 w-4 text-zinc-400" />
                  {brand.whatsappDisplay}
                </a>
                <span className="leading-relaxed text-xs text-zinc-500">{brand.address}</span>
              </div>
            </div>

            {/* Newsletter Input */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-100">Subscribe to updates</h3>
              <p className="text-xs text-zinc-550 leading-relaxed">Get product updates, features, and pricing details.</p>
              <form className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2.5 shadow-sm focus-within:border-zinc-750 transition-colors">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full placeholder:text-zinc-650"
                  required
                />
                <button type="submit" className="text-xs font-bold text-zinc-150 hover:text-white transition-colors flex items-center gap-1">
                  Join
                  <ArrowRight className="h-3 w-3" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>Copyright 2026 Iprix Media. All rights reserved.</p>
          <div className="flex gap-6 font-semibold">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-zinc-300 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white selection:bg-indigo-600 selection:text-white">
      <PublicHeader />
      {children}
      <PublicFooter />
    </main>
  );
}
