"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { pricingPlans } from "@/lib/plans";
import { PricingCard } from "@/components/pricing-card";

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50 py-3.5">
        <div className="container flex items-center justify-center gap-2 text-sm font-semibold text-neutral-850">
          <Sparkles className="h-4 w-4 text-neutral-900" />
          Start free with 5 AI-powered listings. Upgrade when your free listings are used.
        </div>
      </section>

      <section className="container py-20 bg-white">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-neutral-250 bg-neutral-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-800">
            Simple Pricing
          </p>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight md:text-6xl text-neutral-900">
            Plans for every <span className="underline decoration-neutral-950 underline-offset-4">Indian seller.</span>
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-500">
            Generate real AI listings, capture templates with the Chrome extension, and move to monthly quotas when you are ready.
          </p>
        </div>

        {/* Global Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${billing === "monthly" ? "text-neutral-900" : "text-neutral-400"}`}>
            Monthly
          </span>
          <button 
            type="button"
            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
            style={{ backgroundColor: billing === "yearly" ? "#0a0a0a" : "#e5e5e5" }}
          >
            <span 
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                billing === "yearly" ? "translate-x-5" : "translate-x-0"
              }`} 
            />
          </button>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${billing === "yearly" ? "text-neutral-900" : "text-neutral-400"}`}>
            Yearly
            <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[9px] font-extrabold text-white lowercase">
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

        <div className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-6 border-t border-neutral-200 pt-10 text-sm font-medium text-neutral-600">
          {["No credit card for Free", "14-day money-back guarantee", "Cancel anytime", "Secure checkout"].map((item) => (
            <span className="inline-flex items-center gap-2" key={item}>
              <Check className="h-4 w-4 text-neutral-900" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
