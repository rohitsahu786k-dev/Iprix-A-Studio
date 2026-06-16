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
    <header className="sticky top-0 z-50 border-b border-neutral-150 bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="container flex min-h-[80px] items-center justify-between gap-6">
        {/* Brand Logo */}
        <div className="flex items-center">
          <BrandLogo priority />
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50/70 p-1 text-sm font-semibold text-neutral-600 lg:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-full px-4.5 py-2 transition-all duration-200 hover:bg-white hover:text-neutral-950 hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Buttons or User session details */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <Link 
                className="text-sm font-semibold text-neutral-600 hover:text-neutral-950 transition-colors duration-200 inline-flex items-center gap-1 group" 
                href="/dashboard"
              >
                Dashboard
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <div className="flex items-center gap-3 border-l border-neutral-200 pl-4">
                {/* Premium Stylized Indian Seller Avatar */}
                <svg className="h-8 w-8 rounded-full border border-neutral-200 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#F4F4F5" />
                  {/* Hair */}
                  <path d="M6 16C6 9 10 6 16 6C22 6 26 9 26 16V18H6V16Z" fill="#18181B" />
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
                  <path d="M7 27C7 22.5 11 20 16 20C21 20 25 22.5 25 27H7Z" fill="#18181B" />
                  <path d="M14.5 20L16 22L17.5 20" stroke="#E4E4E7" strokeWidth="0.75" />
                </svg>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-neutral-900 leading-none">{session.name}</span>
                  <span className="text-[9px] font-semibold text-neutral-400 mt-0.5 capitalize">{session.role} Workspace</span>
                </div>
              </div>

              <a 
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all duration-200" 
                href="/api/auth/logout"
              >
                Sign out
              </a>
            </div>
          ) : (
            <>
              <Link 
                className="text-sm font-semibold text-neutral-600 hover:text-neutral-950 transition-colors duration-200 inline-flex items-center gap-1 group" 
                href="/login"
              >
                Login
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link 
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-neutral-850 hover:shadow-md active:scale-[0.98] transition-all duration-200 group" 
                href="/signup"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white pt-20 pb-12">
      <div className="container">
        {/* Top Section */}
        <div className="grid gap-12 pb-16 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] border-b border-neutral-100">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <WideLogo />
            <p className="text-sm leading-relaxed text-neutral-500 max-w-sm">
              A+ Studio by Iprix Media helps Indian sellers create, optimize, save and autofill marketplace listings with AI.
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-bold text-neutral-700">
              <ShieldCheck className="h-4 w-4 text-neutral-900" />
              Secure seller automation workspace
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-950">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-neutral-500">
              {publicLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-neutral-950 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -ml-3.5 group-hover:ml-0 duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-950">Product</h3>
            <ul className="space-y-2.5 text-sm text-neutral-500">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/chrome-extension", label: "Chrome Extension" },
                { href: "/features", label: "AI Tools" },
                { href: "/pricing", label: "Plans" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-neutral-950 transition-colors flex items-center gap-1 group">
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -ml-3.5 group-hover:ml-0 duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-950">Get In Touch</h3>
              <div className="grid gap-3 text-sm text-neutral-500">
                <a className="inline-flex items-center gap-2 hover:text-neutral-950 transition-colors" href={`mailto:${brand.supportEmail}`}>
                  <Mail className="h-4 w-4 text-neutral-700" />
                  {brand.supportEmail}
                </a>
                <a className="inline-flex items-center gap-2 hover:text-neutral-950 transition-colors" href={brand.whatsappUrl}>
                  <MessageCircle className="h-4 w-4 text-neutral-700" />
                  {brand.whatsappDisplay}
                </a>
                <span className="leading-relaxed text-xs">{brand.address}</span>
              </div>
            </div>

            {/* Newsletter Input */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-950">Subscribe to updates</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">Get product updates, features, and pricing details.</p>
              <form className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-neutral-100 transition-colors">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="bg-transparent text-xs text-neutral-900 focus:outline-none w-full placeholder:text-neutral-400"
                  required
                />
                <button type="submit" className="text-xs font-bold text-neutral-900 hover:text-neutral-600 transition-colors flex items-center gap-1">
                  Join
                  <ArrowRight className="h-3 w-3" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>Copyright 2026 Iprix Media. All rights reserved.</p>
          <div className="flex gap-6 font-semibold">
            <Link href="/terms" className="hover:text-neutral-950 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-neutral-950 transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-neutral-950 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-neutral-950 selection:bg-neutral-900 selection:text-white">
      <PublicHeader />
      {children}
      <PublicFooter />
    </main>
  );
}
