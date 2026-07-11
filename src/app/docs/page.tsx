import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Puzzle, ShieldCheck, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { documentationGuides } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation & Seller Guides",
  description: "Step-by-step A+ Studio documentation for extension setup, Meesho template capture, secure autofill, AI listing generation and marketplace image optimization.",
  keywords: ["A+ Studio documentation", "Meesho extension setup", "Meesho template autofill guide", "AI listing generator guide"],
  alternates: { canonical: "/docs" },
};

const guideIcons = [Puzzle, ShieldCheck, BookOpen, CheckCircle2, Sparkles, Clock3];

export default function DocumentationPage() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="container relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">
            <BookOpen className="h-4 w-4" /> Knowledge centre
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">A+ Studio documentation for faster seller workflows</h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
            Install, connect, capture, autofill and optimize with clear production-ready instructions. Every guide ends with a verifiable outcome.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-[10px] font-extrabold text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">6 complete guides</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">Mobile friendly</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">Built for Indian sellers</span>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-20">
        <div className="container">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {documentationGuides.map((guide, index) => {
              const Icon = guideIcons[index];
              return (
                <Link key={guide.slug} href={`/docs/${guide.slug}`} className="group flex min-h-72 flex-col rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_20px_50px_rgba(79,70,229,0.10)]">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200"><Icon className="h-5 w-5" /></span>
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Step {guide.step}</span>
                  </div>
                  <h2 className="mt-6 text-lg font-extrabold tracking-tight text-slate-950">{guide.title}</h2>
                  <p className="mt-3 flex-1 text-xs font-semibold leading-6 text-slate-500">{guide.summary}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><Clock3 className="h-3.5 w-3.5" /> {guide.duration}</span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-600">Read guide <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
