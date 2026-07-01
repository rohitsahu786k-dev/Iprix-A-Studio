import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "A+ Studio by Iprix Media - AI Listing Autofill Tool for Indian Sellers",
  description:
    "Create marketplace-ready product listings, AI titles, descriptions, keywords, SKUs and images for Meesho, Flipkart and Amazon sellers.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "A+ Studio by Iprix Media - AI Listing Autofill Tool for Indian Sellers",
    description:
      "Create marketplace-ready product listings, AI titles, descriptions, keywords, SKUs and images for Meesho, Flipkart and Amazon sellers.",
    url: "https://iprixmedia.com",
    siteName: "A+ Studio",
    type: "website",
    images: [
      {
        url: "https://iprixmedia.com/seller-dashboard.png",
        width: 1200,
        height: 630,
        alt: "A+ Studio Seller Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "A+ Studio by Iprix Media - AI Listing Autofill Tool for Indian Sellers",
    description:
      "Create marketplace-ready product listings, AI titles, descriptions, keywords, SKUs and images for Meesho, Flipkart and Amazon sellers.",
    images: ["https://iprixmedia.com/seller-dashboard.png"],
  },
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const common = {
    className: `h-5 w-5 ${className}`,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<string, JSX.Element> = {
    sparkles: (
      <svg {...common}>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        <path d="M5 17l.7 2.1L8 20l-2.3.9L5 23l-.7-2.1L2 20l2.3-.9L5 17z" />
      </svg>
    ),
    chrome: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <path d="M21.2 8H12" />
        <path d="M3.9 6.1 8.5 14" />
        <path d="M10.9 21.9 15.5 14" />
      </svg>
    ),
    shield: (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    bolt: (
      <svg {...common}>
        <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7z" />
      </svg>
    ),
    chart: (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-7" />
      </svg>
    ),
    database: (
      <svg {...common}>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </svg>
    ),
    image: (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <path d="m20 6-11 11-5-5" />
      </svg>
    ),
  };

  return icons[name] || icons.sparkles;
}

const stats = [
  { value: "5 min", label: "average listing setup" },
  { value: "3", label: "marketplaces supported" },
  { value: "24/7", label: "seller workflow support" },
];

const workflow = [
  {
    step: "01",
    title: "Capture once",
    text: "Save product fields, selectors and category context directly from marketplace pages.",
    icon: "database",
  },
  {
    step: "02",
    title: "Generate with AI",
    text: "Create titles, descriptions, keywords, SKUs and listing-ready content faster.",
    icon: "sparkles",
  },
  {
    step: "03",
    title: "Autofill safely",
    text: "Use the Chrome extension to fill marketplace forms without auto-submitting anything.",
    icon: "chrome",
  },
  {
    step: "04",
    title: "Track everything",
    text: "Monitor usage, templates, listings, teams and admin activity from one dashboard.",
    icon: "chart",
  },
];

const modules = [
  {
    title: "Seller dashboard",
    desc: "A clean command center for listings, templates, usage, products and subscriptions.",
    image: "/seller-dashboard.png",
    icon: "chart",
  },
  {
    title: "Chrome extension",
    desc: "Capture and autofill listing fields on Meesho, Flipkart and Amazon Seller Central.",
    image: "/chrome-extension-preview.png",
    icon: "chrome",
  },
  {
    title: "AI listing studio",
    desc: "Generate marketplace-ready titles, descriptions, keywords and SKU ideas.",
    image: "/ai-content.png",
    icon: "sparkles",
  },
  {
    title: "Image optimization",
    desc: "Prepare better product visuals with image enhancement and marketplace-focused tools.",
    image: "/image-optimization.png",
    icon: "image",
  },
  {
    title: "Product library",
    desc: "Keep reusable product data organized so every new listing starts faster.",
    image: "/listing-automation.png",
    icon: "database",
  },
  {
    title: "Admin analytics",
    desc: "Give admins visibility into users, plans, payments, AI usage and extension activity.",
    image: "/admin-analytics.png",
    icon: "shield",
  },
];

const features = [
  "Reusable listing templates",
  "Flipkart, Meesho and Amazon workflows",
  "AI title and description generation",
  "Keyword research and label analysis",
  "CSV import and export",
  "Team and admin management",
  "Usage limits and subscription controls",
  "Safe autofill with no auto-submit",
  "Audit logs and extension activity tracking",
];

const platformCards = [
  {
    name: "Meesho",
    text: "Template capture, product data reuse and autofill support for seller listing workflows.",
  },
  {
    name: "Flipkart",
    text: "Category-aware templates, tabbed layout filling, variants, pricing and SKU support.",
  },
  {
    name: "Amazon",
    text: "Seller Central capture and autofill foundation for Indian marketplace sellers.",
  },
];

export default function Home() {
  return (
    <PublicShell>
      <main className="overflow-hidden bg-zinc-950 text-white">
        <section className="relative border-b border-white/10 px-6 py-20 sm:py-24 lg:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_28%),linear-gradient(to_bottom,rgba(24,24,27,0.25),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
                <Icon name="sparkles" className="h-4 w-4" />
                AI Listing Studio
              </div>

              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                Build, optimize and autofill marketplace listings faster.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                A+ Studio helps Indian sellers create better product listings, reusable templates,
                AI content, SKUs, keywords and marketplace-ready workflows from one clean dashboard.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-zinc-950 shadow-2xl shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  Start free trial
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#chrome-extension"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
                >
                  View extension
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                    <div className="text-2xl font-black text-white">{item.value}</div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-[3rem] bg-indigo-500/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-zinc-900/80 p-3 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950 p-4">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="text-sm font-bold text-white">Seller Command Center</div>
                      <div className="mt-1 text-xs text-zinc-500">Live listing workflow preview</div>
                    </div>
                    <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Active</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Templates", "128", "database"],
                      ["AI listings", "342", "sparkles"],
                      ["Autofills", "1.8k", "bolt"],
                      ["Keywords", "4.6k", "chart"],
                    ].map(([label, value, icon]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
                          <Icon name={icon} className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-black text-white">{value}</div>
                        <div className="mt-1 text-xs text-zinc-400">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-bold text-white">Marketplace readiness</div>
                      <div className="text-xs font-bold text-indigo-200">92%</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-zinc-400">
                      <span>Meesho</span>
                      <span>Flipkart</span>
                      <span>Amazon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <div className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-indigo-300">Simple workflow</div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">From product data to filled listing form.</h2>
              <p className="mt-5 text-base leading-8 text-zinc-400">
                Designed for sellers who need speed, accuracy and repeatable marketplace operations.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item) => (
                <article key={item.step} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-white/[0.06]">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-sm font-black text-zinc-600">{item.step}</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-indigo-300 transition group-hover:border-indigo-400/30 group-hover:bg-indigo-400/10">
                      <Icon name={item.icon} />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-zinc-900/30 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <div className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-indigo-300">Platform modules</div>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">A cleaner SaaS interface for every workflow.</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-zinc-400">
                The homepage now presents the product like a premium seller automation platform with stronger hierarchy, better cards and clearer CTAs.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((item) => (
                <article key={item.title} className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-indigo-400/30">
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-zinc-900">
                    <Image src={item.image} alt={item.title} fill className="object-cover object-top opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-300">
                      <Icon name={item.icon} />
                    </div>
                    <h3 className="text-lg font-black text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">{item.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-24" id="chrome-extension">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-indigo-300">Chrome extension</div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Capture, save and autofill without losing control.</h2>
              <p className="mt-5 text-base leading-8 text-zinc-400">
                The extension is positioned as a seller productivity layer: it helps capture listing fields, save reusable templates and fill marketplace forms safely.
              </p>
              <div className="mt-8 grid gap-3">
                {["No auto-submit protection", "Category-aware templates", "Usage tracking and admin visibility"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-zinc-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900">
                <Image src="/chrome-extension-preview.png" alt="A+ Studio Chrome Extension" fill className="object-cover object-top" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-zinc-900/30 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-3">
              {platformCards.map((item) => (
                <article key={item.name} className="rounded-3xl border border-white/10 bg-zinc-950/70 p-7">
                  <div className="mb-6 inline-flex rounded-full bg-indigo-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-200">
                    {item.name}
                  </div>
                  <p className="text-sm leading-7 text-zinc-400">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <div className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-indigo-300">Features</div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Everything a seller team needs.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-zinc-200">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/10 text-indigo-300">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-zinc-900/30 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <PricingSection />
          </div>
        </section>

        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-zinc-950 p-8 text-center shadow-2xl shadow-indigo-950/20 sm:p-12">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Ready to speed up your listing workflow?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-indigo-100/80">
              Start with reusable templates, AI content and a safer Chrome extension workflow for marketplace sellers.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-indigo-50">
                Create account
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15">
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
