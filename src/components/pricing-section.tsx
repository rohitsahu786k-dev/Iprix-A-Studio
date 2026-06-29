"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { pricingPlans } from "@/lib/plans";
import { PricingCard } from "@/components/pricing-card";

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <section className="border-b border-zinc-800 bg-zinc-950/50 py-3.5">
        <div className="container flex items-center justify-center gap-2 text-sm font-semibold text-zinc-200">
          <Sparkles className="h-4 w-4 text-white" />
          Start free with 5 AI-powered listings. Upgrade when your free listings are used.
        </div>
      </section>

      <section className="container py-20 bg-zinc-900/50 backdrop-blur-md">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-200">
            Simple Pricing
          </p>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight md:text-6xl text-white">
            Plans for every <span className="underline decoration-indigo-500 underline-offset-4">Indian seller.</span>
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            Generate real AI listings, capture templates with the Chrome extension, and move to monthly quotas when you are ready.
          </p>
        </div>

        {/* Global Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${billing === "monthly" ? "text-white" : "text-zinc-500"}`}>
            Monthly
          </span>
          <button 
            type="button"
            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
            style={{ backgroundColor: billing === "yearly" ? "#4f46e5" : "#27272a" }}
          >
            <span 
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-900/50 backdrop-blur-md shadow ring-0 transition duration-200 ease-in-out ${
                billing === "yearly" ? "translate-x-5" : "translate-x-0"
              }`} 
            />
          </button>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${billing === "yearly" ? "text-white" : "text-zinc-500"}`}>
            Yearly
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-extrabold text-white lowercase">
              save up to 30%
            </span>
          </span>
        </div>

        <div className="mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 max-w-7xl mb-8">
          {pricingPlans.map((plan) => (
            <PricingCard 
              key={plan.slug} 
              plan={plan} 
              dark={plan.slug === "pro"} 
              current={plan.slug === "free"} 
              billing={billing}
            />
          ))}
        </div>

        <div className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-6 border-t border-zinc-800 pt-10 text-sm font-medium text-zinc-400">
          {["No credit card for Free", "14-day money-back guarantee", "Cancel anytime", "Secure checkout"].map((item) => (
            <span className="inline-flex items-center gap-2" key={item}>
              <Check className="h-4 w-4 text-white" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
