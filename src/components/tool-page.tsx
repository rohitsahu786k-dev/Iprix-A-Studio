import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export type ToolFaq = { question: string; answer: string };

/**
 * Shared server-side shell for the dedicated free-tool landing pages under
 * /tools/*. Each page supplies its own `metadata` export; this renders the
 * hero, the embedded client tool, FAQ content and JSON-LD.
 */
export function ToolPage({
  slug,
  title,
  subtitle,
  faq,
  children,
}: {
  slug: string;
  title: string;
  subtitle: string;
  faq: ToolFaq[];
  children: React.ReactNode;
}) {
  const url = `https://aplusstudio.iprixmedia.com/tools/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: title,
        url,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        description: subtitle,
        publisher: { "@type": "Organization", name: "Iprix Media", url: "https://iprixmedia.com" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          All free tools
        </Link>
        <div className="mt-6 max-w-3xl">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Free tool · No login · Runs in your browser</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-400">{subtitle}</p>
        </div>

        <div className="mt-10">{children}</div>

        <div className="mt-16 max-w-3xl">
          <h2 className="text-xl font-extrabold text-zinc-100">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <details className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5" key={item.question}>
                <summary className="cursor-pointer text-sm font-extrabold text-zinc-100">{item.question}</summary>
                <p className="mt-3 text-xs font-semibold leading-relaxed text-zinc-400">{item.answer}</p>
              </details>
            ))}
          </div>
          <Link
            href="/signup"
            className="group mt-10 flex items-center justify-between rounded-3xl border border-indigo-500/25 bg-indigo-500/5 p-6 transition-all hover:border-indigo-400/50 hover:bg-indigo-500/10"
          >
            <span>
              <span className="block text-sm font-extrabold text-zinc-100">Want AI listings, keyword research and extension autofill too?</span>
              <span className="mt-1 block text-xs font-semibold text-zinc-400">Start free — no credit card. 50 AI listings included.</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
