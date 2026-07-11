import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PublicShell } from "@/components/public-shell";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact Iprix Media Support",
  description: "Get in touch with the A+ Studio support team. Send an inquiry, contact us on WhatsApp, or email info@iprixmedia.com for assistance.",
  keywords: ["Contact A+ Studio", "Iprix Media support email", "WhatsApp e-commerce support", "Rajasthan e-commerce tool help"],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Iprix Media Support | A+ Studio",
    description: "Get in touch with the A+ Studio support team. Send an inquiry, contact us on WhatsApp, or email info@iprixmedia.com for assistance.",
    url: "https://aplusstudio.iprixmedia.com/contact",
    siteName: "A+ Studio",
    type: "website",
    images: [{ url: "https://aplusstudio.iprixmedia.com/seller-dashboard.png", width: 1200, height: 630, alt: "Contact A+ Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Iprix Media Support | A+ Studio",
    description: "Get in touch with the A+ Studio support team. Send an inquiry, contact us on WhatsApp, or email info@iprixmedia.com for assistance.",
    images: ["https://aplusstudio.iprixmedia.com/seller-dashboard.png"],
  },
};

// Minimalist vector icons using currentColor (monochrome)
const Icons = {
  Mail: () => (
    <svg className="w-5 h-5 text-zinc-350" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  MessageCircle: () => (
    <svg className="w-5 h-5 text-zinc-350" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  MapPin: () => (
    <svg className="w-5 h-5 text-zinc-350" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="container py-20 bg-zinc-950 text-zinc-100">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] max-w-5xl mx-auto items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-5">
              Get In Touch
            </div>
            <h1 className="text-5xl font-extrabold text-zinc-100 tracking-tight mb-6">
              Contact <span className="underline decoration-indigo-500 underline-offset-4">Iprix Media</span>
            </h1>
            <p className="text-base leading-8 text-zinc-400 mb-10">
              Send an inquiry, email support, or message us on WhatsApp for A+ Studio setup help. We will get back to you within 24 hours.
            </p>
            
            <div className="space-y-6">
              <a href={`mailto:${brand.supportEmail}`} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all bg-zinc-900/40 group">
                <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-center flex-shrink-0">
                  <Icons.Mail />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Email Support</p>
                  <p className="text-sm font-bold text-zinc-200 group-hover:underline">{brand.supportEmail}</p>
                </div>
              </a>

              <a href={brand.whatsappUrl} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all bg-zinc-900/40 group">
                <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-center flex-shrink-0">
                  <Icons.MessageCircle />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">WhatsApp chat</p>
                  <p className="text-sm font-bold text-zinc-200 group-hover:underline">{brand.whatsappDisplay}</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
                <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-center flex-shrink-0">
                  <Icons.MapPin />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Office Address</p>
                  <p className="text-sm font-bold text-zinc-200">{brand.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 md:p-8">
            <ContactForm />
          </div>
        </div>

        {/* Support info section for SEO text density */}
        <div className="max-w-5xl mx-auto mt-20 border-t border-zinc-900 pt-16 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-3">Seller support hours</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Our support team is available Monday through Saturday, 10 AM to 7 PM IST. For urgent extension issues or billing queries, WhatsApp is the fastest channel. Email responses typically arrive within 4–8 business hours. We prioritise active paid plan subscribers for live support.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-3">Common questions we handle</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              We regularly assist with Chrome extension installation on Meesho and Flipkart seller panels, plan upgrades, API integration questions, bulk CSV upload formatting, image compliance troubleshooting, and account reset requests. For technical bugs, please include your browser version and a screenshot when writing to us.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-3">Partnership &amp; reseller enquiries</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              If you are a seller coach, cataloging agency, or marketplace consultant interested in offering A+ Studio to your clients, we have a reseller and affiliate programme. Email us with your seller community size, platform focus and use case, and we will get back to you within two business days.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 mb-3">Feature requests &amp; feedback</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              A+ Studio is actively developed based on real seller feedback. If there is a marketplace, form field, category attribute, or workflow you want automated, tell us. Many of our most-used features — including Meesho size grid autofill, bulk listing upload, and the shipping weight guard — were built directly from seller requests.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
