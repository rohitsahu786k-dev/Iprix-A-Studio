import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Lightbulb, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { documentationGuides, getDocumentationGuide } from "@/lib/docs";

export function generateStaticParams() {
  return documentationGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getDocumentationGuide(slug);
  if (!guide) return {};
  return {
    title: `${guide.title} Guide`,
    description: guide.summary,
    alternates: { canonical: `/docs/${guide.slug}` },
    keywords: [guide.title, "A+ Studio documentation", "Meesho seller workflow", "marketplace listing guide"],
  };
}

export default async function DocumentationGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getDocumentationGuide(slug);
  if (!guide) notFound();
  const index = documentationGuides.findIndex((item) => item.slug === guide.slug);
  const nextGuide = documentationGuides[index + 1];

  return (
    <PublicShell>
      <section className="border-b border-slate-200 bg-white py-14 lg:py-20">
        <div className="container">
          <Link href="/docs" className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 transition hover:text-indigo-700"><ArrowLeft className="h-4 w-4" /> All documentation</Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Guide {guide.step}</span>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">{guide.title}</h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-600">{guide.summary}</p>
            </div>
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5">
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-indigo-700"><Clock3 className="h-4 w-4" /> {guide.duration} read</div>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-700">{guide.outcome}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-16 lg:py-20">
        <div className="container grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="space-y-4">
              {guide.steps.map((step, stepIndex) => (
                <div key={step.title} className="grid gap-4 rounded-2xl border border-slate-100 p-4 sm:grid-cols-[44px_1fr] sm:p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 font-mono text-xs font-black text-white">{String(stepIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-950">{step.title}</h2>
                    <p className="mt-2 text-xs font-semibold leading-6 text-slate-500">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900"><Lightbulb className="h-4 w-4" /> Practical tips</div>
              <ul className="mt-4 space-y-3">
                {guide.tips.map((tip) => <li key={tip} className="flex gap-2 text-[11px] font-semibold leading-5 text-amber-950/75"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> {tip}</li>)}
              </ul>
            </div>
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900"><ShieldCheck className="h-4 w-4" /> Safe workflow</div>
              <p className="mt-3 text-[11px] font-semibold leading-5 text-emerald-950/70">A+ Studio prepares and fills data, but you always review and submit the final marketplace form yourself.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-12">
        <div className="container flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Next step</p><p className="mt-1 text-sm font-extrabold text-slate-900">{nextGuide ? nextGuide.title : "Put the workflow into practice"}</p></div>
          <Link href={nextGuide ? `/docs/${nextGuide.slug}` : "/dashboard"} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-extrabold text-white">{nextGuide ? "Continue guide" : "Open dashboard"}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </PublicShell>
  );
}
