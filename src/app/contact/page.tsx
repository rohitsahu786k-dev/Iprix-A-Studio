import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PublicShell } from "@/components/public-shell";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact Iprix Media Support | A+ Studio",
  description: "Get in touch with the A+ Studio support team. Send an inquiry, contact us on WhatsApp, or email info@iprixmedia.com for assistance.",
  keywords: ["Contact A+ Studio", "Iprix Media support email", "WhatsApp e-commerce support", "Rajasthan e-commerce tool help"],
  alternates: { canonical: "/contact" },
};

// Minimalist vector icons using currentColor (monochrome)
const Icons = {
  Mail: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  MessageCircle: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  MapPin: () => (
    <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="container py-20 bg-white">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] max-w-5xl mx-auto items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-5">
              Get In Touch
            </div>
            <h1 className="text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">
              Contact <span className="underline decoration-neutral-950 underline-offset-4">Iprix Media</span>
            </h1>
            <p className="text-base leading-8 text-neutral-500 mb-10">
              Send an inquiry, email support, or message us on WhatsApp for A+ Studio setup help. We will get back to you within 24 hours.
            </p>
            
            <div className="space-y-6">
              <a href={`mailto:${brand.supportEmail}`} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 transition-all bg-white group">
                <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Icons.Mail />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Email Support</p>
                  <p className="text-sm font-bold text-neutral-850 group-hover:underline">{brand.supportEmail}</p>
                </div>
              </a>

              <a href={brand.whatsappUrl} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 transition-all bg-white group">
                <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Icons.MessageCircle />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">WhatsApp chat</p>
                  <p className="text-sm font-bold text-neutral-850 group-hover:underline">{brand.whatsappDisplay}</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white">
                <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Icons.MapPin />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Office Address</p>
                  <p className="text-sm font-bold text-neutral-850">{brand.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-2xl border border-neutral-250 p-6 md:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
